import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { NotificationRule } from '../../types';
import { BellRing, Play, CheckCircle2, AlertTriangle, ShieldCheck, ToggleLeft, ToggleRight, Sparkles } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const AdminAlertRules: React.FC = () => {
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchRules = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNotificationRules();
      setRules(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleToggleRule = async (rule: NotificationRule) => {
    try {
      await api.updateNotificationRule(rule.id, { enabled: !rule.enabled });
      fetchRules();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar regla.');
    }
  };

  const handleRunEvaluation = async () => {
    setIsRunning(true);
    setFeedback(null);
    try {
      const res = await api.runAlertEvaluation();
      setFeedback(`Motor de alertas ejecutado: ${res.results.total_new_events} eventos creados.`);
      fetchRules();
    } catch (err: any) {
      setFeedback(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Reglas de Alerta y Notificación</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configuración de umbrales para detección de notas bajas, faltas individuales y reiteradas.
          </p>
        </div>

        <Button
          variant="primary"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none"
          onClick={handleRunEvaluation}
          isLoading={isRunning}
          icon={<Play className="w-4 h-4" />}
        >
          Ejecutar Evaluación de Alertas
        </Button>
      </div>

      {feedback && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-medium">{feedback}</span>
        </div>
      )}

      <Card className="p-0 overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
            <tr>
              <th className="px-6 py-3.5">Nombre de la Regla</th>
              <th className="px-6 py-3.5">Tipo de Evento</th>
              <th className="px-6 py-3.5">Umbral Configurado</th>
              <th className="px-6 py-3.5">Período / Cooldown</th>
              <th className="px-6 py-3.5 text-center">Estado</th>
              <th className="px-6 py-3.5 text-right">Interruptor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rules.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900">{r.name}</td>
                <td className="px-6 py-4 text-slate-600 font-semibold">{r.type_display || r.type}</td>
                <td className="px-6 py-4 font-mono font-bold text-slate-700">
                  {r.type === 'LOW_GRADE'
                    ? `< ${r.threshold_value || 51} pts`
                    : r.type === 'REPEATED_ABSENCE'
                    ? `>= ${r.threshold_value || 3} faltas`
                    : '1 falta'}
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {r.period_days ? `${r.period_days} días` : '—'} / {r.cooldown_hours || 24}h cooldown
                </td>
                <td className="px-6 py-4 text-center">
                  <Badge variant={r.enabled ? 'success' : 'default'}>
                    {r.enabled ? 'Activa' : 'Desactivada'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => handleToggleRule(r)}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    {r.enabled ? (
                      <ToggleRight className="w-6 h-6 text-brand-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
};
