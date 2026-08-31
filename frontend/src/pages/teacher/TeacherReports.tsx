import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { TeachingAssignment } from '../../types';
import { BarChart3, Award, Users, ClipboardCheck, HelpCircle, CheckCircle, AlertTriangle, TrendingUp } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';

export const TeacherReports: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialAssignId = searchParams.get('assignment_id') || '';

  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [selectedAssignId, setSelectedAssignId] = useState<string>(initialAssignId);
  const [reportData, setReportData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

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

  useEffect(() => {
    if (!selectedAssignId) return;

    const fetchReport = async () => {
      setIsLoading(true);
      try {
        const data = await api.getTeacherCourseSummary(selectedAssignId);
        setReportData(data);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [selectedAssignId]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Métricas y Reportes de Curso</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Estadísticas agregadas de rendimiento académico y asistencia por materia.
          </p>
        </div>

        <div className="w-full md:w-72">
          <select
            value={selectedAssignId}
            onChange={(e) => setSelectedAssignId(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.subject_name} — {a.course_name} ({a.course_parallel})
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading || !reportData ? (
        <Card className="text-center py-12 text-slate-400 text-xs">Cargando reporte de curso...</Card>
      ) : (
        <div className="space-y-6">
          {/* Key Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Alumnos Matriculados"
              value={reportData.students_count}
              icon={<Users className="w-5 h-5" />}
              color="brand"
              subtitle="En este curso"
            />
            <StatCard
              title="Promedio General"
              value={`${reportData.grades.average_score} / 100`}
              icon={<TrendingUp className="w-5 h-5" />}
              color={reportData.grades.average_score >= 51 ? 'brand' : 'amber'}
              subtitle={`${reportData.grades.total_evaluations} evaluaciones`}
            />
            <StatCard
              title="Tasa de Asistencia"
              value={`${reportData.attendance.attendance_rate}%`}
              icon={<ClipboardCheck className="w-5 h-5" />}
              color="sky"
              subtitle={`${reportData.attendance.total_records} asistencias`}
            />
            <StatCard
              title="Consultas Pendientes"
              value={reportData.pending_questions}
              icon={<HelpCircle className="w-5 h-5" />}
              color={reportData.pending_questions > 0 ? 'amber' : 'slate'}
              subtitle="Preguntas sin responder"
            />
          </div>

          {/* Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Grades Breakdown */}
            <Card title="Distribución de Calificaciones" subtitle="Rendimiento del grupo">
              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between p-3.5 bg-emerald-50 text-emerald-900 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span className="font-semibold">Aprobados (&gt;= 51)</span>
                  </div>
                  <span className="font-extrabold text-sm">{reportData.grades.passing_count}</span>
                </div>

                <div className="flex items-center justify-between p-3.5 bg-rose-50 text-rose-900 rounded-xl border border-rose-100">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span className="font-semibold">En Riesgo / Reprobados (&lt; 51)</span>
                  </div>
                  <span className="font-extrabold text-sm">{reportData.grades.failing_count}</span>
                </div>
              </div>
            </Card>

            {/* Attendance Breakdown */}
            <Card title="Desglose de Asistencia" subtitle="Registros consolidados">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-slate-400 block">Presentes</span>
                  <span className="text-lg font-bold text-slate-800">{reportData.attendance.present_count}</span>
                </div>
                <div className="p-3 bg-rose-50 rounded-xl text-rose-800">
                  <span className="text-rose-400 block">Faltas</span>
                  <span className="text-lg font-bold text-rose-700">{reportData.attendance.absent_count}</span>
                </div>
                <div className="p-3 bg-amber-50 rounded-xl text-amber-800">
                  <span className="text-amber-400 block">Atrasos</span>
                  <span className="text-lg font-bold text-amber-700">{reportData.attendance.late_count}</span>
                </div>
                <div className="p-3 bg-sky-50 rounded-xl text-sky-800">
                  <span className="text-sky-400 block">Tasa Global</span>
                  <span className="text-lg font-bold text-sky-700">{reportData.attendance.attendance_rate}%</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
