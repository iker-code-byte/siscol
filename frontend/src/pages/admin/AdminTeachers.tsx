import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Teacher } from '../../types';
import { Users, Search, BookOpen, ShieldCheck } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const AdminTeachers: React.FC = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTeachers = async () => {
      setIsLoading(true);
      try {
        const data = await api.getTeachers();
        setTeachers(Array.isArray(data) ? data : data.results || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  const filtered = teachers.filter((t) =>
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (t.document_number && t.document_number.includes(search))
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Planta Docente</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro de profesores habilitados para calificar y registrar asistencia.
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre o CI..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Profesor / Docente</th>
                <th className="px-6 py-3.5">Documento de Identidad</th>
                <th className="px-6 py-3.5">Usuario del Sistema</th>
                <th className="px-6 py-3.5">Correo Electrónico</th>
                <th className="px-6 py-3.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    Cargando docentes...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No se encontraron docentes.
                  </td>
                </tr>
              ) : (
                filtered.map((t: any) => (
                  <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">{t.full_name}</td>
                    <td className="px-6 py-4 text-slate-600 font-mono text-[11px]">
                      {t.document_number || 'No especificado'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                      {t.user_details?.username || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {t.user_details?.email || '—'}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant="success">Habilitado</Badge>
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
