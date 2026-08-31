import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Student } from '../../types';
import { GraduationCap, Search, User, ShieldCheck, KeyRound } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const AdminStudents: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const data = await api.getStudents();
        setStudents(Array.isArray(data) ? data : data.results || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const filtered = students.filter((s) =>
    s.full_name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Estudiantes Matriculados</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Padrón de alumnos con código RUDE, relaciones de tutela y estado académico.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o RUDE..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Código RUDE</th>
                <th className="px-6 py-3.5">Estudiante</th>
                <th className="px-6 py-3.5">Usuario de Acceso</th>
                <th className="px-6 py-3.5">Tutores Vinculados</th>
                <th className="px-6 py-3.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Cargando estudiantes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No se encontraron estudiantes.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-700">{s.code}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{s.full_name}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                      {s.user_details?.username || 'Sin cuenta'}
                    </td>
                    <td className="px-6 py-4">
                      {s.guardians && s.guardians.length > 0 ? (
                        <div className="space-y-1">
                          {s.guardians.map((g) => (
                            <span
                              key={g.id}
                              className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md mr-1"
                            >
                              👤 {g.guardian_name} ({g.relationship})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Sin tutor asignado</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
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
