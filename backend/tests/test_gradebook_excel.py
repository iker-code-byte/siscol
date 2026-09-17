import pytest
from decimal import Decimal
from rest_framework.test import APIClient
from django.contrib.auth import get_user_model
from apps.academics.models import (
    AcademicYear, AcademicPeriod, Course, Subject, Teacher, Student, Enrollment
)
from apps.grades.models import Gradebook, GradeActivity, GradeEntry
from apps.alerts.models import NotificationRule, AlertEvent

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def setup_gradebook_env():
    # Academic Year & 4 Bimestres
    year = AcademicYear.objects.create(name='Gestión 2026 Test', start_date='2026-02-01', end_date='2026-11-30')
    p1 = AcademicPeriod.objects.create(academic_year=year, name='Primer Bimestre', number=1, start_date='2026-02-01', end_date='2026-04-10', status='CLOSED')
    p2 = AcademicPeriod.objects.create(academic_year=year, name='Segundo Bimestre', number=2, start_date='2026-04-13', end_date='2026-06-26', status='OPEN')
    p3 = AcademicPeriod.objects.create(academic_year=year, name='Tercer Bimestre', number=3, start_date='2026-07-13', end_date='2026-09-18', status='PLANNED')
    p4 = AcademicPeriod.objects.create(academic_year=year, name='Cuarto Bimestre', number=4, start_date='2026-09-21', end_date='2026-11-27', status='PLANNED')

    course = Course.objects.create(academic_year=year, name='3ro Secundaria', parallel='A')
    subject = Subject.objects.create(code='MAT-301', name='Matemáticas')

    # Teacher A
    user_teacher_a = User.objects.create_user(username='prof_a', password='password123', role='TEACHER')
    teacher_a = Teacher.objects.create(user=user_teacher_a, first_name='Carlos', last_name='Pérez')

    # Teacher B (unauthorized)
    user_teacher_b = User.objects.create_user(username='prof_b', password='password123', role='TEACHER')
    teacher_b = Teacher.objects.create(user=user_teacher_b, first_name='Mario', last_name='Gutiérrez')

    # Students
    user_s1 = User.objects.create_user(username='s1', password='password123', role='STUDENT')
    s1 = Student.objects.create(user=user_s1, code='EST-001', first_name='Ana', last_name='Pérez')
    Enrollment.objects.create(student=s1, course=course, academic_year=year, status='ACTIVE')

    user_s2 = User.objects.create_user(username='s2', password='password123', role='STUDENT')
    s2 = Student.objects.create(user=user_s2, code='EST-002', first_name='Carlos', last_name='Rojas')
    Enrollment.objects.create(student=s2, course=course, academic_year=year, status='ACTIVE')

    # Gradebook for Teacher A in Period 2 (OPEN)
    gradebook_open = Gradebook.objects.create(
        academic_year=year,
        academic_period=p2,
        course=course,
        subject=subject,
        teacher=teacher_a,
        status='OPEN'
    )

    # Gradebook in Period 1 (CLOSED)
    gradebook_closed = Gradebook.objects.create(
        academic_year=year,
        academic_period=p1,
        course=course,
        subject=subject,
        teacher=teacher_a,
        status='OPEN'
    )

    # Low grade rule
    NotificationRule.objects.get_or_create(
        name='Alerta Baja',
        type='LOW_GRADE',
        defaults={'enabled': True, 'threshold_value': Decimal('51.00')}
    )

    return {
        'year': year, 'p1': p1, 'p2': p2, 'p3': p3, 'p4': p4,
        'course': course, 'subject': subject,
        'teacher_a': teacher_a, 'user_teacher_a': user_teacher_a,
        'teacher_b': teacher_b, 'user_teacher_b': user_teacher_b,
        's1': s1, 's2': s2,
        'gradebook_open': gradebook_open,
        'gradebook_closed': gradebook_closed
    }

@pytest.mark.django_db
def test_academic_periods_seeded(setup_gradebook_env):
    periods = AcademicPeriod.objects.filter(academic_year=setup_gradebook_env['year']).order_by('number')
    assert periods.count() == 4
    assert periods[0].status == 'CLOSED'
    assert periods[1].status == 'OPEN'
    assert periods[2].status == 'PLANNED'
    assert periods[3].status == 'PLANNED'

@pytest.mark.django_db
def test_create_dynamic_activity(api_client, setup_gradebook_env):
    env = setup_gradebook_env
    api_client.force_authenticate(user=env['user_teacher_a'])

    res = api_client.post(f"/api/gradebooks/{env['gradebook_open'].id}/activities/", {
        "name": "Tarea 1",
        "activity_type": "TASK",
        "activity_date": "2026-04-20",
        "max_score": 45.00,
        "description": "Ejercicios 1 al 10"
    })
    assert res.status_code == 201
    assert res.data['name'] == "Tarea 1"
    assert res.data['max_score'] == "45.00"
    assert res.data['position'] == 0

@pytest.mark.django_db
def test_null_vs_zero_average_calculation(api_client, setup_gradebook_env):
    """SDD Section 16 & 18: 80, NULL, 70 must average to (80 + 70)/2 = 75.0, NOT 50.0!"""
    env = setup_gradebook_env
    api_client.force_authenticate(user=env['user_teacher_a'])
    gb = env['gradebook_open']

    # Create 3 activities
    act1 = GradeActivity.objects.create(gradebook=gb, name='A1', activity_date='2026-04-20', position=0)
    act2 = GradeActivity.objects.create(gradebook=gb, name='A2', activity_date='2026-04-21', position=1)
    act3 = GradeActivity.objects.create(gradebook=gb, name='A3', activity_date='2026-04-22', position=2)

    # Put 36 in A1 (36 / 45 = 80%)
    r1 = api_client.put('/api/grade-entries/', {
        'activity_id': str(act1.id),
        'student_id': str(env['s1'].id),
        'score': 36
    })
    assert r1.status_code == 200

    # Put 31.5 in A3 (31.5 / 45 = 70%) (A2 left NULL)
    r2 = api_client.put('/api/grade-entries/', {
        'activity_id': str(act3.id),
        'student_id': str(env['s1'].id),
        'score': 31.5
    })
    assert r2.status_code == 200
    assert r2.data['average'] == 75.0
    assert r2.data['graded_count'] == 2

    # Check matrix response
    matrix_res = api_client.get(f"/api/gradebooks/{gb.id}/matrix/")
    assert matrix_res.status_code == 200
    assert matrix_res.data['grading_scale_max'] == 45
    s1_avg = matrix_res.data['averages'][str(env['s1'].id)]
    assert s1_avg['average'] == 75.0
    assert s1_avg['graded_count'] == 2
    assert s1_avg['is_passing'] is True

@pytest.mark.django_db
def test_closed_period_blocks_modifications(api_client, setup_gradebook_env):
    """SDD Section 21: When period is CLOSED, modifications are rejected."""
    env = setup_gradebook_env
    api_client.force_authenticate(user=env['user_teacher_a'])
    gb_closed = env['gradebook_closed']

    act = GradeActivity.objects.create(gradebook=gb_closed, name='Actividad Pasada', activity_date='2026-02-15')

    # Attempt to put grade
    res = api_client.put('/api/grade-entries/', {
        'activity_id': str(act.id),
        'student_id': str(env['s1'].id),
        'score': 90
    })
    assert res.status_code == 400
    assert "cerrado" in str(res.data)

@pytest.mark.django_db
def test_horizontal_access_forbidden(api_client, setup_gradebook_env):
    """SDD Section 22: Teacher B cannot view or modify Teacher A's gradebook."""
    env = setup_gradebook_env
    api_client.force_authenticate(user=env['user_teacher_b'])
    gb = env['gradebook_open']

    # Matrix access
    res = api_client.get(f"/api/gradebooks/{gb.id}/matrix/")
    assert res.status_code in (403, 404)

@pytest.mark.django_db
def test_alert_engine_minimum_activities_rule(api_client, setup_gradebook_env):
    """SDD Section 28: Avoid premature alerts - require at least 2 graded activities."""
    env = setup_gradebook_env
    api_client.force_authenticate(user=env['user_teacher_a'])
    gb = env['gradebook_open']

    act1 = GradeActivity.objects.create(gradebook=gb, name='A1', activity_date='2026-04-20', position=0)
    act2 = GradeActivity.objects.create(gradebook=gb, name='A2', activity_date='2026-04-21', position=1)

    # 1st activity with low grade (18/45 = 40.0) -> graded_count = 1 -> No alert yet
    api_client.put('/api/grade-entries/', {
        'activity_id': str(act1.id),
        'student_id': str(env['s1'].id),
        'score': 18
    })
    assert AlertEvent.objects.filter(student=env['s1']).count() == 0

    # 2nd activity with low grade (20/45 = 44.4) -> graded_count = 2, avg = 42.2 -> Triggers alert!
    api_client.put('/api/grade-entries/', {
        'activity_id': str(act2.id),
        'student_id': str(env['s1'].id),
        'score': 20
    })
    assert AlertEvent.objects.filter(student=env['s1']).count() == 1
