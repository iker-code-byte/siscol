import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AuditLog } from '../../types';
import { ShieldCheck, RefreshCw, Clock, User } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const AdminAudit: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAuditLogs();
      setLogs(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Registro Inmutable de Auditoría</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Trazabilidad de operaciones críticas: guardado de notas, asistencias, códigos y dispositivos.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchLogs} icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}>
          Actualizar Logs
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Fecha y Hora</th>
                <th className="px-6 py-3.5">Acción Realizada</th>
                <th className="px-6 py-3.5">Entidad Afectada</th>
                <th className="px-6 py-3.5">Actor</th>
                <th className="px-6 py-3.5">Metadatos / Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-sans">
                    Cargando registros de auditoría...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 font-sans">
                    No hay eventos de auditoría registrados aún.
                  </td>
                </tr>
              ) : (
                logs.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 text-slate-500">
                      {new Date(l.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3.5 font-bold text-slate-900">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-800">
                        {l.action}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">
                      {l.entity} {l.entity_id ? `(${l.entity_id.substring(0, 8)}...)` : ''}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">
                      {l.actor_username || (l.actor_guardian_device_id ? `TutorDevice (${l.actor_guardian_device_id.substring(0, 8)})` : 'Sistema')}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 font-sans text-xs max-w-xs truncate">
                      {JSON.stringify(l.metadata || {})}
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
