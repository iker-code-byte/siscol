import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TeachingAssignment } from '../../types';
import { BookOpen, Users, School, CheckCircle2 } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const AdminAssignments: React.FC = () => {
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAssignments = async () => {
      setIsLoading(true);
      try {
        const data = await api.getTeachingAssignments();
        setAssignments(Array.isArray(data) ? data : data.results || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAssignments();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Asignaciones Docentes</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Matriz de asignación de profesores a materias y cursos específicos.
        </p>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Profesor / Docente</th>
                <th className="px-6 py-3.5">Materia Asignada</th>
                <th className="px-6 py-3.5">Curso y Paralelo</th>
                <th className="px-6 py-3.5">Año Escolar</th>
                <th className="px-6 py-3.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Cargando asignaciones docentes...
                  </td>
                </tr>
              ) : assignments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No hay asignaciones docentes registradas.
                  </td>
                </tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{a.teacher_name}</td>
                    <td className="px-6 py-4 text-slate-800 font-semibold">
                      {a.subject_name}{' '}
                      <span className="text-[10px] text-slate-400 font-mono">({a.subject_code})</span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {a.course_name} ({a.course_parallel})
                    </td>
                    <td className="px-6 py-4 text-slate-500">{a.academic_year_name}</td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={a.active ? 'success' : 'default'}>
                        {a.active ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </td>
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
