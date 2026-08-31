import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { TeachingAssignment, Enrollment, Attendance, AttendanceStatus } from '../../types';
import { ClipboardCheck, Save, AlertCircle, CheckCircle2, Users, Calendar, Check, X, Clock, FileText } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const TeacherAttendance: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialAssignId = searchParams.get('assignment_id') || '';

  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [selectedAssignId, setSelectedAssignId] = useState<string>(initialAssignId);
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; comments: string }>>({});
  const [existingRecords, setExistingRecords] = useState<Attendance[]>([]);

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

  // 2. Fetch Enrollments & Existing Attendance on assignment / date change
  useEffect(() => {
    if (!selectedAssignId) return;

    const loadData = async () => {
      setIsLoading(true);
      setFeedback(null);
      try {
        const assign = assignments.find((a) => a.id === selectedAssignId);
        if (!assign) return;

        const [enrData, attData] = await Promise.all([
          api.getEnrollments({ course_id: assign.course }),
          api.getAttendance({ teaching_assignment_id: selectedAssignId, date }),
        ]);

        const enrList: Enrollment[] = Array.isArray(enrData) ? enrData : enrData.results || [];
        const attList: Attendance[] = Array.isArray(attData) ? attData : attData.results || [];

        setEnrollments(enrList);
        setExistingRecords(attList);

        // Pre-fill map: default to PRESENT if no existing record
        const map: Record<string, { status: AttendanceStatus; comments: string }> = {};
        enrList.forEach((enr) => {
          const existing = attList.find((a) => a.student === enr.student);
          map[enr.student] = {
            status: existing ? existing.status : 'PRESENT',
            comments: existing?.comments || '',
          };
        });
        setAttendanceMap(map);
      } catch (err: any) {
        setFeedback({ type: 'error', message: err.message || 'Error al cargar lista de asistencia.' });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedAssignId, date, assignments]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
  };

  const handleCommentChange = (studentId: string, comments: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        comments,
      },
    }));
  };

  const handleMarkAllPresent = () => {
    const updated: Record<string, { status: AttendanceStatus; comments: string }> = {};
    enrollments.forEach((enr) => {
      updated[enr.student] = {
        status: 'PRESENT',
        comments: attendanceMap[enr.student]?.comments || '',
      };
    });
    setAttendanceMap(updated);
  };

  const handleBulkSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignId) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      const rowsArray = Object.entries(attendanceMap).map(([studentId, val]) => ({
        student_id: studentId,
        status: val.status,
        comments: val.comments,
      }));

      const res = await api.saveBulkAttendance({
        teaching_assignment_id: selectedAssignId,
        date,
        rows: rowsArray,
      });

      setFeedback({
        type: 'success',
        message: `¡Asistencia guardada! Se registraron ${res.count} alumnos para el ${date}. Las faltas generaron alertas automáticas.`,
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Ocurrió un error al guardar la asistencia.' });
    } finally {
      setIsSaving(false);
    }
  };

  // Stats calculation
  const total = enrollments.length;
  const presentsCount = Object.values(attendanceMap).filter((v) => v.status === 'PRESENT').length;
  const absentCount = Object.values(attendanceMap).filter((v) => v.status === 'ABSENT').length;
  const lateCount = Object.values(attendanceMap).filter((v) => v.status === 'LATE').length;
  const excusedCount = Object.values(attendanceMap).filter((v) => v.status === 'EXCUSED').length;

  const selectedAssign = assignments.find((a) => a.id === selectedAssignId);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Control Diario de Asistencia</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro ágil: todos presentes por defecto. Marque únicamente las excepciones.
          </p>
        </div>
      </div>

      {/* Control Filter Bar */}
      <Card className="p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
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

          <div>
            <label className="block font-semibold text-slate-700 mb-1.5">Fecha de Asistencia</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="flex items-end">
            <Button
              type="button"
              variant="outline"
              size="md"
              className="w-full justify-center text-xs font-semibold"
              onClick={handleMarkAllPresent}
              icon={<Check className="w-4 h-4 text-emerald-600" />}
            >
              Marcar Todos Presentes
            </Button>
          </div>
        </div>

        {/* Counter Summary Pills */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
          <span className="font-semibold text-slate-500 mr-2">Resumen de clase:</span>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full font-bold border border-emerald-200">
            {presentsCount} Presentes
          </span>
          <span className="px-3 py-1 bg-rose-50 text-rose-800 rounded-full font-bold border border-rose-200">
            {absentCount} Faltas
          </span>
          <span className="px-3 py-1 bg-amber-50 text-amber-800 rounded-full font-bold border border-amber-200">
            {lateCount} Atrasos
          </span>
          <span className="px-3 py-1 bg-sky-50 text-sky-800 rounded-full font-bold border border-sky-200">
            {excusedCount} Licencias
          </span>
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

      {/* Attendance Sheet Form */}
      <form onSubmit={handleBulkSave}>
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-600" />
              <h3 className="text-sm font-bold text-slate-800">
                Planilla de Asistencia — {selectedAssign?.course_name} ({selectedAssign?.course_parallel})
              </h3>
            </div>
            <span className="text-xs text-slate-500">{enrollments.length} alumnos</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3 w-16">#</th>
                  <th className="px-6 py-3">Estudiante</th>
                  <th className="px-6 py-3 text-center">Estado de Asistencia</th>
                  <th className="px-6 py-3">Observación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      Cargando lista de asistencia...
                    </td>
                  </tr>
                ) : enrollments.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-400">
                      No hay estudiantes matriculados en este curso.
                    </td>
                  </tr>
                ) : (
                  enrollments.map((enr, idx) => {
                    const currentStatus = attendanceMap[enr.student]?.status || 'PRESENT';
                    const currentComments = attendanceMap[enr.student]?.comments || '';

                    return (
                      <tr key={enr.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5 text-slate-400 font-mono">{idx + 1}</td>
                        <td className="px-6 py-3.5">
                          <p className="font-bold text-slate-900">{enr.student_name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{enr.student_code}</p>
                        </td>
                        <td className="px-6 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStatusChange(enr.student, 'PRESENT')}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                                currentStatus === 'PRESENT'
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" /> Presente
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(enr.student, 'ABSENT')}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                                currentStatus === 'ABSENT'
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <X className="w-3.5 h-3.5" /> Falta
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(enr.student, 'LATE')}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                                currentStatus === 'LATE'
                                  ? 'bg-amber-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <Clock className="w-3.5 h-3.5" /> Atraso
                            </button>

                            <button
                              type="button"
                              onClick={() => handleStatusChange(enr.student, 'EXCUSED')}
                              className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1 ${
                                currentStatus === 'EXCUSED'
                                  ? 'bg-sky-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              <FileText className="w-3.5 h-3.5" /> Licencia
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-3.5">
                          <input
                            type="text"
                            value={currentComments}
                            onChange={(e) => handleCommentChange(enr.student, e.target.value)}
                            placeholder="Observación..."
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

          {/* Action Bar */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Las faltas registradas emitirán aviso push instantáneo al tutor.
            </span>
            <Button type="submit" variant="primary" size="md" isLoading={isSaving} icon={<Save className="w-4 h-4" />}>
              Guardar Asistencia del Día
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
};
