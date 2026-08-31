import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Attendance } from '../../types';
import { ClipboardCheck, Check, X, Clock, FileText } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';

export const StudentAttendance: React.FC = () => {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      setIsLoading(true);
      try {
        const res = await api.getStudentMeAttendance();
        setAttendances(res.results || []);
        setStats(res.stats || null);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Mi Registro de Asistencia</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Historial detallado de presencia, faltas, atrasos y licencias en el colegio.
        </p>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Tasa de Asistencia"
            value={`${stats.attendance_rate}%`}
            icon={<ClipboardCheck className="w-5 h-5" />}
            color="brand"
            subtitle={`${stats.total} clases registradas`}
          />
          <StatCard
            title="Presentes"
            value={stats.present}
            icon={<Check className="w-5 h-5" />}
            color="brand"
            subtitle="Asistencias efectivas"
          />
          <StatCard
            title="Faltas"
            value={stats.absent}
            icon={<X className="w-5 h-5" />}
            color={stats.absent > 0 ? 'rose' : 'slate'}
            subtitle="Inasistencias registradas"
          />
          <StatCard
            title="Atrasos y Licencias"
            value={stats.late + stats.excused}
            icon={<Clock className="w-5 h-5" />}
            color={stats.late > 0 ? 'amber' : 'slate'}
            subtitle={`${stats.late} atrasos, ${stats.excused} licencias`}
          />
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Fecha</th>
                <th className="px-6 py-3.5">Materia</th>
                <th className="px-6 py-3.5">Curso</th>
                <th className="px-6 py-3.5 text-center">Estado</th>
                <th className="px-6 py-3.5">Observación del Docente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Cargando asistencia...
                  </td>
                </tr>
              ) : attendances.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No hay registros de asistencia aún.
                  </td>
                </tr>
              ) : (
                attendances.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">{att.date}</td>
                    <td className="px-6 py-4 text-slate-800 font-bold">{att.subject_name}</td>
                    <td className="px-6 py-4 text-slate-500">
                      {att.course_name} ({att.course_parallel})
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge
                        variant={
                          att.status === 'PRESENT'
                            ? 'success'
                            : att.status === 'ABSENT'
                            ? 'danger'
                            : att.status === 'LATE'
                            ? 'warning'
                            : 'info'
                        }
                      >
                        {att.status_display || att.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500 italic">{att.comments || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
