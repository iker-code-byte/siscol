import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Student, Course } from '../../types';
import { Search, School } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [sData, cData] = await Promise.all([
          api.getStudents(),
          api.getCourses(),
        ]);
        setStudents(Array.isArray(sData) ? sData : sData.results || []);
        setCourses(Array.isArray(cData) ? cData : cData.results || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filtered = students.filter((s) => {
    const matchesCourse = selectedCourseId === 'ALL' || s.course_id === selectedCourseId;
    if (!matchesCourse) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.full_name.toLowerCase().includes(q) ||
      s.code.toLowerCase().includes(q) ||
      (s.guardians || []).some(
        (g) =>
          (g.guardian_name || '').toLowerCase().includes(q) ||
          (g.guardian_phone || '').toLowerCase().includes(q)
      )
    );
  });

  const shortCourseLabel = (c: Course) => {
    const firstWord = c.name.split(' ')[0];
    return `${firstWord} ${c.parallel}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Estudiantes Matriculados ({filtered.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Padrón oficial separado por curso y paralelo con código RUDE y padre/tutor designado.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar estudiante, RUDE o tutor..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          />
        </div>
      </div>

      {/* Selector de Curso y Paralelo */}
      {courses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2">
            <School className="w-4 h-4 text-brand-600" />
            <span>Filtrar por Curso y Paralelo:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCourseId('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedCourseId === 'ALL'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos ({students.length})
            </button>
            {courses.map((c) => {
              const isSelected = selectedCourseId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCourseId(c.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {shortCourseLabel(c)}{' '}
                  <span className={isSelected ? 'text-brand-100' : 'text-slate-400'}>
                    ({c.students_count ?? 0})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">N°</th>
                <th className="px-4 py-3.5">Curso / Paralelo</th>
                <th className="px-4 py-3.5">Código RUDE</th>
                <th className="px-4 py-3.5">Estudiante (Apellidos y Nombres)</th>
                <th className="px-4 py-3.5">Padre / Madre / Tutor Vinculado</th>
                <th className="px-4 py-3.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    Cargando estudiantes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    No se encontraron estudiantes.
                  </td>
                </tr>
              ) : (
                filtered.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-4 py-3.5 text-center font-semibold text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-4 py-3.5">
                      {s.course_name ? (
                        <span className="inline-flex items-center gap-1.5 font-bold text-brand-800 bg-brand-50 px-2.5 py-1 rounded-lg">
                          {s.course_name} - {s.course_parallel}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Sin curso</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-700">{s.code}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900">{s.full_name}</td>
                    <td className="px-4 py-3.5">
                      {s.guardians && s.guardians.length > 0 ? (
                        <div className="space-y-1">
                          {s.guardians.map((g) => (
                            <div
                              key={g.id}
                              className="inline-flex flex-wrap items-center gap-1.5 text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg mr-1"
                            >
                              <span className="font-bold">👤 {g.guardian_name}</span>
                              {g.guardian_phone && (
                                <span className="font-mono text-slate-500">({g.guardian_phone})</span>
                              )}
                              <span className="bg-brand-100 text-brand-800 px-1.5 py-0.5 rounded font-semibold text-[10px]">
                                {g.relationship_display || g.relationship}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Sin tutor asignado</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <Badge variant={s.active ? 'success' : 'default'}>
                        {s.active ? 'Activo' : 'Inactivo'}
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
