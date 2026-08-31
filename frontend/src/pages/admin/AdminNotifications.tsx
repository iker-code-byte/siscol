import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Sparkles, RefreshCw, Send, ShieldCheck, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const AdminNotifications: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminNotifications();
      setNotifications(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRetry = async (notifId: string) => {
    setRetryingId(notifId);
    try {
      await api.retryNotification(notifId);
      fetchNotifications();
    } catch (err: any) {
      alert(err.message || 'Error al reintentar entrega.');
    } finally {
      setRetryingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Historial de Notificaciones y Entregas Push</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro y estado de entrega de avisos generados para tutores (FCM Web Push).
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={fetchNotifications} icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}>
          Actualizar
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Fecha Emisión</th>
                <th className="px-6 py-3.5">Tutor Destinatario</th>
                <th className="px-6 py-3.5">Estudiante</th>
                <th className="px-6 py-3.5">Título del Aviso</th>
                <th className="px-6 py-3.5">Safe Push Payload</th>
                <th className="px-6 py-3.5 text-center">Estado de Entrega</th>
                <th className="px-6 py-3.5 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    Cargando historial de notificaciones...
                  </td>
                </tr>
              ) : notifications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                    No se han generado notificaciones en el sistema aún.
                  </td>
                </tr>
              ) : (
                notifications.map((n) => {
                  const deliveries = n.deliveries || [];
                  const latestDelivery = deliveries[0];

                  return (
                    <tr key={n.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-4 text-slate-500">
                        {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{n.guardian_name}</td>
                      <td className="px-6 py-4 text-slate-700">{n.student_name}</td>
                      <td className="px-6 py-4 font-semibold text-slate-800">{n.detailed_title}</td>
                      <td className="px-6 py-4 text-slate-500 font-mono text-[11px]">
                        "{n.safe_body}"
                      </td>
                      <td className="px-6 py-4 text-center">
                        {latestDelivery ? (
                          <Badge
                            variant={
                              latestDelivery.status === 'SENT'
                                ? 'success'
                                : latestDelivery.status === 'FAILED'
                                ? 'danger'
                                : latestDelivery.status === 'INVALID_TOKEN'
                                ? 'warning'
                                : 'default'
                            }
                          >
                            {latestDelivery.status_display || latestDelivery.status}
                          </Badge>
                        ) : (
                          <Badge variant="default">Sin dispositivo</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[11px] py-1 px-2 text-brand-600 hover:text-brand-700"
                          isLoading={retryingId === n.id}
                          onClick={() => handleRetry(n.id)}
                          icon={<Send className="w-3 h-3" />}
                        >
                          Reintentar
                        </Button>
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
