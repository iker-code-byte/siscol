import os
import zipfile
import xml.etree.ElementTree as ET
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import RoleChoices
from apps.academics.models import (
    AcademicYear, AcademicPeriod, AcademicPeriodStatusChoices,
    Course, Subject, Teacher, Student,
    Guardian, StudentGuardian, RelationshipChoices,
    Enrollment, TeachingAssignment, EnrollmentStatusChoices
)

User = get_user_model()

COURSE_NAME_MAP = {
    '1°': '1ro de Secundaria',
    '2°': '2do de Secundaria',
    '3°': '3ro de Secundaria',
    '4°': '4to de Secundaria',
    '5°': '5to de Secundaria',
    '6°': '6to de Secundaria',
}

SHEET_NAME_MAP = {
    '1°': '1ro',
    '2°': '2do',
    '3°': '3ro',
    '4°': '4to',
    '5°': '5to',
    '6°': '6to',
}

RELATIONSHIP_MAP = {
    'MADRE': RelationshipChoices.MOTHER,
    'PADRE': RelationshipChoices.FATHER,
    'TUTORA/TUTOR': RelationshipChoices.TUTOR,
    'TIA/O': RelationshipChoices.OTHER,
    'HERMANA/O': RelationshipChoices.OTHER,
    'ABUELA/O': RelationshipChoices.OTHER,
}

SINGLE_SURNAME_STUDENTS = {
    'ZANABRIA EMILY': ('ZANABRIA', 'EMILY'),
    'CABEZAS MATIAS BASTIAN': ('CABEZAS', 'MATIAS BASTIAN'),
    'COLQUE JUAN LUCAS': ('COLQUE', 'JUAN LUCAS'),
    'CASTRO JHOCELL MYERS': ('CASTRO', 'JHOCELL MYERS'),
}


def split_student_name(full_name: str):
    full_name = ' '.join(full_name.split())
    if full_name in SINGLE_SURNAME_STUDENTS:
        return SINGLE_SURNAME_STUDENTS[full_name]
    parts = full_name.split()
    if len(parts) <= 1:
        return (full_name, '')
    if len(parts) == 2:
        return (parts[0], parts[1])
    return (' '.join(parts[:2]), ' '.join(parts[2:]))


def parse_bjp_excel(xlsx_path: Path):
    ns = '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}'
    with zipfile.ZipFile(xlsx_path, 'r') as z:
        shared_strings = []
        if 'xl/sharedStrings.xml' in z.namelist():
            root = ET.fromstring(z.read('xl/sharedStrings.xml'))
            for si in root:
                shared_strings.append(
                    ''.join(t.text or '' for t in si.iter(f'{ns}t'))
                )

        sheet1 = ET.fromstring(z.read('xl/worksheets/sheet1.xml'))
        rows = list(sheet1.iter(f'{ns}row'))

        año = None
        paralelo = None
        records = []

        for r in rows:
            vals = {}
            for c in r:
                t = c.attrib.get('t')
                v_el = c.find(f'{ns}v')
                v = v_el.text if v_el is not None else ''
                if t == 's' and v != '':
                    v = shared_strings[int(v)]
                col = ''.join(ch for ch in c.attrib.get('r', '') if ch.isalpha())
                vals[col] = ' '.join(v.replace('\n', ' ').split())

            a = vals.get('A', '')
            if a.startswith('Año de Escolaridad:'):
                año = a.split(':', 1)[1].strip()
            elif a.startswith('Paralelo:'):
                p = a.split(':', 1)[1].strip()
                # Detect transition from 1° D to 2° A where the Año header was omitted in the source report
                if p == 'A' and paralelo == 'D' and año == '1°':
                    año = '2°'
                paralelo = p
            elif a.isdigit():
                records.append({
                    'año': año,
                    'curso_nombre': COURSE_NAME_MAP.get(año, f'{año} de Secundaria'),
                    'sheet_prefix': SHEET_NAME_MAP.get(año, año),
                    'paralelo': paralelo,
                    'nro': int(a),
                    'rude': vals.get('B', ''),
                    'estudiante': vals.get('C', ''),
                    'fecha_nac': vals.get('D', ''),
                    'estado_pago': vals.get('E', ''),
                    'ci_titular': vals.get('F', ''),
                    'titular': vals.get('G', ''),
                    'parentesco': vals.get('H', ''),
                })
            elif a == '' and any(vals.get(k, '') for k in ('B', 'C', 'D', 'E', 'F', 'G', 'H')):
                if records:
                    prev = records[-1]
                    for field, col in [
                        ('rude', 'B'),
                        ('estudiante', 'C'),
                        ('fecha_nac', 'D'),
                        ('estado_pago', 'E'),
                        ('ci_titular', 'F'),
                        ('titular', 'G'),
                        ('parentesco', 'H'),
                    ]:
                        extra = vals.get(col, '')
                        if extra:
                            prev[field] = f"{prev[field]} {extra}".strip()

        for rec in records:
            apellidos, nombres = split_student_name(rec['estudiante'])
            rec['apellidos'] = apellidos
            rec['nombres'] = nombres

        return records


def col_letter(idx: int) -> str:
    """1-based column index to Excel column letter (A, B, ..., Z, AA)."""
    res = ''
    while idx > 0:
        idx, rem = divmod(idx - 1, 26)
        res = chr(65 + rem) + res
    return res


def write_xlsx_workbook(out_path: Path, sheets_data: list):
    """
    Writes a valid OpenXML .xlsx workbook with multiple sheets using only Python's standard library.
    sheets_data: list of tuples (sheet_name, headers, rows)
    """
    shared_strings = []
    ss_index = {}

    def get_ss_idx(val: str) -> int:
        if val not in ss_index:
            ss_index[val] = len(shared_strings)
            shared_strings.append(val)
        return ss_index[val]

    sheet_xmls = []
    for _, headers, rows in sheets_data:
        all_rows = [headers] + rows
        row_strs = []
        for r_idx, row_vals in enumerate(all_rows, start=1):
            cell_strs = []
            style_attr = ' s="1"' if r_idx == 1 else ''
            for c_idx, val in enumerate(row_vals, start=1):
                ref = f"{col_letter(c_idx)}{r_idx}"
                if isinstance(val, int) and r_idx > 1:
                    cell_strs.append(f'<c r="{ref}"{style_attr}><v>{val}</v></c>')
                else:
                    s_idx = get_ss_idx(str(val if val is not None else ''))
                    cell_strs.append(f'<c r="{ref}" t="s"{style_attr}><v>{s_idx}</v></c>')
            row_strs.append(f'<row r="{r_idx}">{"".join(cell_strs)}</row>')

        # Column widths
        col_defs = []
        for c_idx in range(1, len(headers) + 1):
            max_len = max(
                [len(str(r[c_idx - 1])) for r in all_rows if c_idx - 1 < len(r)] + [10]
            )
            width = min(max(max_len + 4, 10), 42)
            col_defs.append(f'<col min="{c_idx}" max="{c_idx}" width="{width}" customWidth="1"/>')

        cols_xml = f'<cols>{"".join(col_defs)}</cols>' if col_defs else ''
        sheet_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            f'{cols_xml}'
            f'<sheetData>{"".join(row_strs)}</sheetData>'
            '</worksheet>'
        )
        sheet_xmls.append(sheet_xml)

    with zipfile.ZipFile(out_path, 'w', zipfile.ZIP_DEFLATED) as z:
        # [Content_Types].xml
        sheet_overrides = ''.join(
            f'<Override PartName="/xl/worksheets/sheet{i}.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'
            for i in range(1, len(sheets_data) + 1)
        )
        content_types = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
            '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
            '<Default Extension="xml" ContentType="application/xml"/>'
            '<Override PartName="/xl/workbook.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>'
            '<Override PartName="/xl/styles.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>'
            '<Override PartName="/xl/sharedStrings.xml" '
            'ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>'
            f'{sheet_overrides}'
            '</Types>'
        )
        z.writestr('[Content_Types].xml', content_types)

        # _rels/.rels
        rels = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            '<Relationship Id="rId1" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" '
            'Target="xl/workbook.xml"/>'
            '</Relationships>'
        )
        z.writestr('_rels/.rels', rels)

        # xl/workbook.xml
        sheets_entries = ''.join(
            f'<sheet name="{escape(name)}" sheetId="{i}" r:id="rId{i}"/>'
            for i, (name, _, _) in enumerate(sheets_data, start=1)
        )
        workbook_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">'
            f'<sheets>{sheets_entries}</sheets>'
            '</workbook>'
        )
        z.writestr('xl/workbook.xml', workbook_xml)

        # xl/_rels/workbook.xml.rels
        wb_rels_entries = ''.join(
            f'<Relationship Id="rId{i}" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" '
            f'Target="worksheets/sheet{i}.xml"/>'
            for i in range(1, len(sheets_data) + 1)
        )
        s_id = len(sheets_data) + 1
        ss_id = len(sheets_data) + 2
        wb_rels = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
            f'{wb_rels_entries}'
            f'<Relationship Id="rId{s_id}" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" '
            'Target="styles.xml"/>'
            f'<Relationship Id="rId{ss_id}" '
            'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" '
            'Target="sharedStrings.xml"/>'
            '</Relationships>'
        )
        z.writestr('xl/_rels/workbook.xml.rels', wb_rels)

        # xl/styles.xml (style 0 = normal, style 1 = bold header with fill)
        styles_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            '<fonts count="2">'
            '<font><sz val="11"/><name val="Calibri"/></font>'
            '<font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>'
            '</fonts>'
            '<fills count="3">'
            '<fill><patternFill patternType="none"/></fill>'
            '<fill><patternFill patternType="gray125"/></fill>'
            '<fill><patternFill patternType="solid"><fgColor rgb="FF1E3A8A"/><bgColor indexed="64"/></patternFill></fill>'
            '</fills>'
            '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>'
            '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>'
            '<cellXfs count="2">'
            '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
            '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/>'
            '</cellXfs>'
            '</styleSheet>'
        )
        z.writestr('xl/styles.xml', styles_xml)

        # xl/sharedStrings.xml
        si_items = ''.join(f'<si><t xml:space="preserve">{escape(s)}</t></si>' for s in shared_strings)
        ss_xml = (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" '
            f'count="{len(shared_strings)}" uniqueCount="{len(shared_strings)}">'
            f'{si_items}'
            '</sst>'
        )
        z.writestr('xl/sharedStrings.xml', ss_xml)

        for i, s_xml in enumerate(sheet_xmls, start=1):
            z.writestr(f'xl/worksheets/sheet{i}.xml', s_xml)


class Command(BaseCommand):
    help = 'Importa los cursos, paralelos, estudiantes y padres del reporte Excel BJP y genera los Excel separados'

    def add_arguments(self, parser):
        parser.add_argument(
            '--excel',
            type=str,
            default=str(Path(settings.BASE_DIR).parent / 'REPORTE_DE_SEGUIMIENTO_BJP_2025_20261029T235357.xlsx'),
            help='Ruta al archivo Excel de origen',
        )
        parser.add_argument(
            '--clean-demo',
            action='store_true',
            default=True,
            help='Elimina los estudiantes y tutores ficticios de prueba antes de importar',
        )

    def handle(self, *args, **options):
        xlsx_path = Path(options['excel'])
        if not xlsx_path.exists():
            alt_path = Path(settings.BASE_DIR) / 'data' / 'REPORTE_DE_SEGUIMIENTO_BJP_2025_20261029T235357.xlsx'
            if alt_path.exists():
                xlsx_path = alt_path
            else:
                self.stderr.write(self.style.ERROR(f'No se encontró el archivo Excel en: {xlsx_path}'))
                return

        records = parse_bjp_excel(xlsx_path)
        self.stdout.write(self.style.NOTICE(f'Leídos {len(records)} registros desde {xlsx_path.name}'))

        # Group records by (año, paralelo) preserving order
        groups = {}
        for r in records:
            key = (r['año'], r['curso_nombre'], r['sheet_prefix'], r['paralelo'])
            groups.setdefault(key, []).append(r)

        # 1. Generate the two separated Excel workbooks in the workspace root
        workspace_root = xlsx_path.parent
        students_xlsx = workspace_root / 'Estudiantes_Por_Curso_Paralelo.xlsx'
        parents_xlsx = workspace_root / 'Padres_Por_Curso_Paralelo.xlsx'

        student_sheets = []
        parent_sheets = []

        resumen_est_rows = []
        resumen_pad_rows = []

        for idx, ((año, curso_nombre, sheet_prefix, paralelo), items) in enumerate(groups.items(), start=1):
            sheet_title = f'{sheet_prefix} {paralelo}'
            resumen_est_rows.append([idx, curso_nombre, paralelo, sheet_title, len(items)])
            resumen_pad_rows.append([idx, curso_nombre, paralelo, sheet_title, len(items)])

            est_rows = []
            pad_rows = []
            for item in items:
                est_rows.append([
                    item['nro'],
                    curso_nombre,
                    paralelo,
                    item['rude'],
                    item['apellidos'],
                    item['nombres'],
                    item['estudiante'],
                    item['fecha_nac'],
                    item['estado_pago'],
                    item['ci_titular'],
                    item['titular'],
                    item['parentesco'],
                ])
                pad_rows.append([
                    item['nro'],
                    curso_nombre,
                    paralelo,
                    item['ci_titular'],
                    item['titular'],
                    item['parentesco'],
                    item['rude'],
                    item['estudiante'],
                ])

            student_sheets.append((
                sheet_title,
                [
                    'N°', 'Curso', 'Paralelo', 'Código RUDE', 'Apellidos', 'Nombres',
                    'Nombre Completo Estudiante', 'Fecha Nacimiento', 'Estado Pago',
                    'CI Padre/Tutor', 'Nombre Padre/Tutor', 'Parentesco'
                ],
                est_rows
            ))

            parent_sheets.append((
                sheet_title,
                [
                    'N°', 'Curso', 'Paralelo', 'CI Padre/Tutor',
                    'Nombre Completo Padre/Tutor', 'Parentesco',
                    'Código RUDE Estudiante', 'Nombre Completo Estudiante'
                ],
                pad_rows
            ))

        resumen_est_rows.append(['', 'TOTAL GENERAL', '', '', len(records)])
        resumen_pad_rows.append(['', 'TOTAL GENERAL', '', '', len(records)])

        student_sheets.insert(0, (
            'Resumen Cursos',
            ['N°', 'Curso', 'Paralelo', 'Hoja', 'Cantidad Estudiantes'],
            resumen_est_rows
        ))
        parent_sheets.insert(0, (
            'Resumen Padres',
            ['N°', 'Curso', 'Paralelo', 'Hoja', 'Cantidad Padres/Tutores en Paralelo'],
            resumen_pad_rows
        ))

        write_xlsx_workbook(students_xlsx, student_sheets)
        write_xlsx_workbook(parents_xlsx, parent_sheets)
        self.stdout.write(self.style.SUCCESS(f'Archivos Excel generados:\n  - {students_xlsx}\n  - {parents_xlsx}'))

        # 2. Import into Django Database
        with transaction.atomic():
            if options['clean_demo']:
                # Remove demo students RUDE-8072* and demo guardians (keep estudiante1..12 users to re-link)
                Student.objects.filter(code__startswith='RUDE-8072').delete()
                Guardian.objects.filter(
                    full_name__in=[
                        'María Gómez de Pérez',
                        'Roberto Fernández Vargas',
                        'Carmen Torrez de Morales',
                    ]
                ).delete()
                # Also remove old course naming '1ro Secundaria' if any without 'de'
                Course.objects.filter(name='1ro Secundaria').delete()

            year_2026, _ = AcademicYear.objects.get_or_create(
                name='Gestión 2026',
                defaults={
                    'start_date': date(2026, 2, 2),
                    'end_date': date(2026, 11, 30),
                    'active': True,
                }
            )

            # Ensure 4 academic periods exist
            periods_spec = [
                (1, 'Primer Bimestre', date(2026, 2, 2), date(2026, 4, 10), AcademicPeriodStatusChoices.CLOSED),
                (2, 'Segundo Bimestre', date(2026, 4, 13), date(2026, 6, 26), AcademicPeriodStatusChoices.OPEN),
                (3, 'Tercer Bimestre', date(2026, 7, 13), date(2026, 9, 18), AcademicPeriodStatusChoices.PLANNED),
                (4, 'Cuarto Bimestre', date(2026, 9, 21), date(2026, 11, 27), AcademicPeriodStatusChoices.PLANNED),
            ]
            for num, p_name, s_date, e_date, st in periods_spec:
                AcademicPeriod.objects.get_or_create(
                    academic_year=year_2026,
                    number=num,
                    defaults={
                        'name': p_name,
                        'period_type': 'BIMONTH',
                        'start_date': s_date,
                        'end_date': e_date,
                        'status': st,
                    }
                )

            # Create all 20 Courses
            courses_by_key = {}
            for (_, curso_nombre, _, paralelo) in groups.keys():
                course_obj, _ = Course.objects.get_or_create(
                    academic_year=year_2026,
                    name=curso_nombre,
                    parallel=paralelo,
                )
                courses_by_key[(curso_nombre, paralelo)] = course_obj

            # Pre-hash default student password once for fast import
            default_student_pw = make_password('estudiante123')

            # Cache existing users, students, guardians
            existing_users = {u.username: u for u in User.objects.all()}
            existing_students = {s.code: s for s in Student.objects.all()}
            existing_guardians = {}
            for g in Guardian.objects.all():
                key = (g.full_name.strip().upper(), (g.phone or '').strip().upper())
                existing_guardians[key] = g

            created_students = 0
            created_guardians = 0
            created_links = 0

            for rec_idx, rec in enumerate(records):
                rude = rec['rude']
                username = f"est_{rude}"
                st_user = existing_users.get(username)
                if not st_user:
                    st_user = User.objects.create(
                        username=username,
                        email=f"{rude}@estudiante.grm.edu.bo",
                        role=RoleChoices.STUDENT,
                        is_active=True,
                        password=default_student_pw,
                    )
                    existing_users[username] = st_user

                if rec_idx < 12:
                    demo_uname = f"estudiante{rec_idx + 1}"
                    demo_user = existing_users.get(demo_uname)
                    if not demo_user:
                        demo_user = User.objects.create(
                            username=demo_uname,
                            email=f"{demo_uname}@colegio-grm.edu.bo",
                            role=RoleChoices.STUDENT,
                            is_active=True,
                            password=default_student_pw,
                        )
                        existing_users[demo_uname] = demo_user
                    linked_user = demo_user
                else:
                    linked_user = st_user

                student = existing_students.get(rude)
                if not student:
                    student = Student.objects.create(
                        user=linked_user,
                        code=rude,
                        first_name=rec['nombres'],
                        last_name=rec['apellidos'],
                        active=True,
                    )
                    existing_students[rude] = student
                    created_students += 1
                else:
                    student.first_name = rec['nombres']
                    student.last_name = rec['apellidos']
                    student.user = linked_user
                    student.active = True
                    student.save(update_fields=['first_name', 'last_name', 'user', 'active'])

                course_obj = courses_by_key[(rec['curso_nombre'], rec['paralelo'])]
                Enrollment.objects.update_or_create(
                    student=student,
                    academic_year=year_2026,
                    defaults={
                        'course': course_obj,
                        'status': EnrollmentStatusChoices.ACTIVE,
                    }
                )

                ci_str = f"CI: {rec['ci_titular']}"
                g_key = (rec['titular'].strip().upper(), ci_str.upper())
                guardian = existing_guardians.get(g_key)
                if not guardian:
                    guardian = Guardian.objects.create(
                        full_name=rec['titular'],
                        phone=ci_str,
                        notifications_enabled=True,
                        active=True,
                    )
                    existing_guardians[g_key] = guardian
                    created_guardians += 1

                rel = RELATIONSHIP_MAP.get(rec['parentesco'], RelationshipChoices.OTHER)
                _, link_created = StudentGuardian.objects.update_or_create(
                    student=student,
                    guardian=guardian,
                    defaults={
                        'relationship': rel,
                        'is_primary': True,
                        'can_receive_notifications': True,
                    }
                )
                if link_created:
                    created_links += 1

            # Also ensure existing teachers are assigned to all 20 courses so gradebooks/attendance work across all courses
            teachers = list(Teacher.objects.all())
            subjects = list(Subject.objects.all())
            if teachers and subjects:
                for course_obj in courses_by_key.values():
                    for idx_s, subj in enumerate(subjects):
                        prof = teachers[idx_s % len(teachers)]
                        TeachingAssignment.objects.get_or_create(
                            teacher=prof,
                            course=course_obj,
                            subject=subj,
                            academic_year=year_2026,
                            defaults={'active': True},
                        )

        self.stdout.write(self.style.SUCCESS(
            f"\nImportación completada con éxito en la base de datos:\n"
            f"  - Cursos y Paralelos activos: {Course.objects.filter(academic_year=year_2026).count()}\n"
            f"  - Estudiantes matriculados:   {Student.objects.count()} (nuevos: {created_students})\n"
            f"  - Padres/Tutores únicos:      {Guardian.objects.count()} (nuevos: {created_guardians})\n"
            f"  - Vínculos Padre-Estudiante:  {StudentGuardian.objects.count()} (559 registros por paralelo)"
        ))
