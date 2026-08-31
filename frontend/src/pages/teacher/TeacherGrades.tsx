import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { TeachingAssignment, Enrollment, Grade } from '../../types';
import { Award, Save, AlertCircle, CheckCircle2, Filter, Users, Sparkles } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const TeacherGrades: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialAssignId = searchParams.get('assignment_id') || '';

  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [selectedAssignId, setSelectedAssignId] = useState<string>(initialAssignId);
  const [term, setTerm] = useState('T1');
  const [activityName, setActivityName] = useState('Evaluación Trimestral 1');
  const [maxScore, setMaxScore] = useState<number>(100);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [comments, setComments] = useState('');

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [gradesMap, setGradesMap] = useState<Record<string, { score: string; comments: string }>>({});
  const [existingGrades, setExistingGrades] = useState<Grade[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // 1. Fetch Teacher Assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const data = await api.getTeachingAssignments();
        const list = Array.isArray(data) ? data : data.results || [];
        setAssignments(list);
        if (!selectedAssignId && list.length > 0) {
          setSelectedAssignId(list[0].id);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchAssignments();
  }, []);

  // 2. Fetch Students and Existing Grades when Assignment or Term changes
  useEffect(() => {
    if (!selectedAssignId) return;

    const loadData = async () => {
      setIsLoading(true);
      setFeedback(null);
      try {
        const assign = assignments.find((a) => a.id === selectedAssignId);
        if (!assign) return;

        const [enrData, gradesData] = await Promise.all([
          api.getEnrollments({ course_id: assign.course }),
          api.getGrades({ teaching_assignment_id: selectedAssignId, term }),
        ]);

        const enrList: Enrollment[] = Array.isArray(enrData) ? enrData : enrData.results || [];
        const gradesList: Grade[] = Array.isArray(gradesData) ? gradesData : gradesData.results || [];

        setEnrollments(enrList);
        setExistingGrades(gradesList);

        // Pre-fill gradesMap
        const map: Record<string, { score: string; comments: string }> = {};
        enrList.forEach((enr) => {
          const existing = gradesList.find((g) => g.student === enr.student);
          map[enr.student] = {
            score: existing ? String(existing.score) : '',
            comments: existing?.comments || '',
          };
        });
        setGradesMap(map);
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Error al cargar datos.' });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedAssignId, term, assignments]);

  const handleScoreChange = (studentId: string, value: string) => {
    setGradesMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        score: value,
      },
    }));
  };

  const handleCommentChange = (studentId: string, value: string) => {
    setGradesMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comments: value,
      },
    }));
  };

  const handleBulkSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignId) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      const gradesArray = Object.entries(gradesMap)
        .filter(([_, val]) => val.score !== '')
        .map(([studentId, val]) => ({
          student_id: studentId,
          score: parseFloat(val.score),
          comments: val.comments,
        }));

      if (gradesArray.length === 0) {
        setFeedback({ type: 'error', message: 'Ingrese al menos una calificación antes de guardar.' });
        setIsSaving(false);
        return;
      }

      const res = await api.saveBulkGrades({
        teaching_assignment_id: selectedAssignId,
        term,
        activity_name: activityName,
        max_score: maxScore,
        date,
        comments,
        grades: gradesArray,
      });

      setFeedback({
        type: 'success',
        message: `¡Éxito! Se guardaron ${res.count} calificaciones y se evaluaron las alertas automáticas a los tutores.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Ocurrió un error al guardar las calificaciones.' });
    } finally {
      setIsSaving(false);
    }
  };

  const selectedAssign = assignments.find((a) => a.id === selectedAssignId);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Planilla Digital de Calificaciones</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro masivo por materia, validación de notas en tiempo real y disparo de alertas automáticas.
          </p>
        </div>
      </div>

      {/* Control Filter Bar */}
      <Card className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          {/* Assignment Select */}
          <div className="lg:col-span-2">
            <label className="block font-semibold text-slate-700 mb-1.5">Materia y Curso</label>
            <select
              value={selectedAssignId}
              onChange={(e) => setSelectedAssignId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.subject_name} — {a.course_name} ({a.course_parallel})
                </option>
              ))}
            </select>
          </div>

          {/* Term Select */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Trimestre / Período</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="T1">1er Trimestre (T1)</option>
              <option value="T2">2do Trimestre (T2)</option>
              <option value="T3">3er Trimestre (T3)</option>
            </select>
          </div>

          {/* Activity Name */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Nombre Actividad</label>
            <input
              type="text"
              value={activityName}
              onChange={(e) => setActivityName(e.target.value)}
              placeholder="ej. Examen 1"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Max Score & Date */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Puntaje Máx.</label>
              <input
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1.5">Fecha</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-3 animate-in fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Spreadsheet Matrix Form */}
      <form onSubmit={handleBulkSave}>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Lista de Estudiantes — {selectedAssign?.course_name} ({selectedAssign?.course_parallel})
              </h3>
            </div>
            <span className="text-xs text-slate-500">{enrollments.length} alumnos matriculados</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 w-16">#</th>
                  <th className="px-6 py-3">Código RUDE</th>
                  <th className="px-6 py-3">Estudiante</th>
                  <th className="px-6 py-3 w-40">Calificación (/{maxScore})</th>
                  <th className="px-6 py-3">Estado / Rendimiento</th>
                  <th className="px-6 py-3">Observaciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      Cargando alumnos de la materia...
                    </td>
                  </tr>
                ) : enrollments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No hay estudiantes matriculados en este curso.
                    </td>
                  </tr>
                ) : (
                  enrollments.map((enr, idx) => {
                    const studentGrade = gradesMap[enr.student] || { score: '', comments: '' };
                    const numScore = parseFloat(studentGrade.score);
                    const isFailing = !isNaN(numScore) && numScore < 51;
                    const isInvalid = !isNaN(numScore) && (numScore < 0 || numScore > maxScore);

                    return (
                      <tr key={enr.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-6 py-3.5 text-slate-500 font-mono text-[11px]">{enr.student_code}</td>
                        <td className="px-6 py-3.5 font-bold text-slate-900">{enr.student_name}</td>
                        <td className="px-6 py-3.5">
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            max={maxScore}
                            value={studentGrade.score}
                            onChange={(e) => handleScoreChange(enr.student, e.target.value)}
                            placeholder="0 - 100"
                            className={`w-28 px-3 py-1.5 rounded-xl border text-sm font-bold text-center transition-all focus:outline-none focus:ring-2 ${
                              isInvalid
                                ? 'bg-rose-50 border-rose-300 text-rose-700 focus:ring-rose-500'
                                : isFailing
                                ? 'bg-amber-50 border-amber-300 text-amber-800 focus:ring-amber-500'
                                : studentGrade.score !== ''
                                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 focus:ring-emerald-500'
                                : 'bg-slate-50 border-slate-200 text-slate-800 focus:ring-brand-500'
                            }`}
                          />
                        </td>
                        <td className="px-6 py-3.5">
                          {studentGrade.score === '' ? (
                            <span className="text-slate-400">Sin calificar</span>
                          ) : isInvalid ? (
                            <Badge variant="danger">Fuera de rango</Badge>
                          ) : isFailing ? (
                            <Badge variant="warning">Bajo Rendimiento (&lt;51)</Badge>
                          ) : (
                            <Badge variant="success">Aprobado</Badge>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          <input
                            type="text"
                            value={studentGrade.comments}
                            onChange={(e) => handleCommentChange(enr.student, e.target.value)}
                            placeholder="Comentario opcional..."
                            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs focus:outline-none focus:ring-1 focus:ring-brand-500"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Bulk Action Bar */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <div className="text-xs text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-brand-600" />
              <span>Las notas bajo 51 emitirán una alerta push inmediata a los tutores vinculados.</span>
            </div>

            <Button type="submit" variant="primary" size="md" isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
              Guardar Planilla de Calificaciones
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
