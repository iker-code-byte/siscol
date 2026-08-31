# Skill 08 — Student Portal

## Objetivo
Entregar al estudiante una vista simple de sus propios datos.

## Pantallas
- dashboard;
- mis notas;
- mi asistencia;
- mis preguntas.

## Reglas
- usar endpoints `/me/*`;
- no usar selector de student_id;
- mostrar datos claros por materia/período;
- no exponer datos de otros alumnos en responses compartidas.

## Tests
- estudiante A no obtiene B por manipulación de URL/query;
- empty states funcionan;
- filtros no cambian ownership.
