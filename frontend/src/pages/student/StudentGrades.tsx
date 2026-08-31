import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Grade } from '../../types';
import { Award, Clock, BookOpen, Filter } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const StudentGrades: React.FC = () => {
  const [grades, setGrades] = useState<Grade[]>([]);
  const [termFilter, setTermFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      setIsLoading(true);
      try {
        const res = await api.getStudentMeGrades({ term: termFilter || undefined });
        setGrades(res.results || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchGrades();
  }, [termFilter]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Mis Calificaciones Oficiales</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro personal de evaluaciones por materia y trimestre.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={termFilter}
            onChange={(e) => setTermFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-xs"
          >
            <option value="">Todos los trimestres</option>
            <option value="T1">1er Trimestre (T1)</option>
            <option value="T2">2do Trimestre (T2)</option>
            <option value="T3">3er Trimestre (T3)</option>
          </select>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Materia</th>
                <th className="px-6 py-3.5">Evaluación / Actividad</th>
                <th className="px-6 py-3.5">Período</th>
                <th className="px-6 py-3.5">Fecha</th>
                <th className="px-6 py-3.5 text-center">Puntaje Obtenido</th>
                <th className="px-6 py-3.5">Estado</th>
                <th className="px-6 py-3.5">Comentarios del Docente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Cargando calificaciones...
                  </td>
                </tr>
              ) : grades.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No se encontraron calificaciones registradas.
                  </td>
                </tr>
              ) : (
                grades.map((g) => {
                  const numScore = parseFloat(String(g.score));
                  const isFailing = numScore < 51;

                  return (
                    <tr key={g.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 font-bold text-slate-900">{g.subject_name}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{g.activity_name}</td>
                      <td className="px-6 py-4 text-slate-500">{g.term}</td>
                      <td className="px-6 py-4 text-slate-500">{g.date}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-xl font-extrabold text-sm ${
                            isFailing
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {g.score} / {g.max_score}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant={isFailing ? 'warning' : 'success'}>
                          {isFailing ? 'Bajo Rendimiento' : 'Aprobado'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-slate-500 italic">
                        {g.comments || '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
