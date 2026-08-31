import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import {
  Users,
  GraduationCap,
  KeyRound,
  BellRing,
  Sparkles,
  ShieldCheck,
  Play,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Award,
  RefreshCw,
} from 'lucide-react';
import { StatCard } from '../../components/common/StatCard';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const AdminDashboard: React.FC = () => {
  const [overview, setOverview] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunningEngine, setIsRunningEngine] = useState(false);
  const [engineResult, setEngineResult] = useState<string | null>(null);

  const fetchOverview = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAdminOverview();
      setOverview(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const handleRunAlertEngine = async () => {
    setIsRunningEngine(true);
    setEngineResult(null);
    try {
      const res = await api.runAlertEvaluation();
      setEngineResult(`Motor ejecutado: ${res.results.total_new_events} nuevos eventos de alerta generados.`);
      fetchOverview();
    } catch (err: any) {
      setEngineResult(`Error: ${err.message}`);
    } finally {
      setIsRunningEngine(false);
    }
  };

  const metrics = overview?.metrics;

  return (
    <div className="space-y-6">
      {/* Hero Welcome & Engine Trigger */}
      <div className="bg-gradient-to-r from-slate-900 via-brand-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400">Panel de Control General</span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-1">Colegio Gabriel René Moreno II</h2>
          <p className="text-xs md:text-sm text-slate-300 mt-2 max-w-xl">
            Monitoreo en tiempo real del ciclo académico, vinculación de dispositivos de tutores y motor de alertas automáticas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Button
            variant="primary"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none"
            onClick={handleRunAlertEngine}
            isLoading={isRunningEngine}
            icon={<Play className="w-4 h-4" />}
          >
            Evaluar Motor de Alertas
          </Button>
          <Button
            variant="outline"
            className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            onClick={fetchOverview}
            icon={<RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />}
          >
            Actualizar
          </Button>
        </div>
      </div>

      {engineResult && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2 animate-in fade-in">
          <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="font-medium">{engineResult}</span>
        </div>
      )}

      {/* Primary KPI Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Estudiantes Activos"
            value={metrics.total_students}
            icon={<GraduationCap className="w-5 h-5" />}
            color="brand"
            subtitle="Matriculados en gestión"
          />
          <StatCard
            title="Planta Docente"
            value={metrics.total_teachers}
            icon={<Users className="w-5 h-5" />}
            color="sky"
            subtitle="Profesores con asignación"
          />
          <StatCard
            title="Tutores / Dispositivos"
            value={`${metrics.linked_devices} / ${metrics.total_guardians}`}
            icon={<KeyRound className="w-5 h-5" />}
            color="amber"
            subtitle="Dispositivos PWA vinculados"
          />
          <StatCard
            title="Alertas Abiertas"
            value={metrics.open_alerts}
            icon={<BellRing className="w-5 h-5" />}
            color={metrics.open_alerts > 0 ? 'rose' : 'slate'}
            subtitle={`Éxito entregas: ${metrics.delivery_success_rate}%`}
          />
        </div>
      )}

      {/* Quick Links & Recent Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Open Alerts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Eventos de Alerta Recientes</h3>
            <Link to="/admin/alert-rules" className="text-xs font-semibold text-brand-600 hover:underline">
              Ver reglas
            </Link>
          </div>

          <Card className="p-0 overflow-hidden">
            {!overview?.recent_alerts || overview.recent_alerts.length === 0 ? (
              <p className="p-6 text-center text-slate-400 text-xs">No hay alertas abiertas en este momento.</p>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {overview.recent_alerts.map((al: any) => (
                  <div key={al.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-xl shrink-0 ${
                          al.severity === 'CRITICAL'
                            ? 'bg-rose-50 text-rose-600'
                            : 'bg-amber-50 text-amber-600'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{al.rule_name}</p>
                        <p className="text-slate-500">Alumno: {al.student_name}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <Badge variant={al.severity === 'CRITICAL' ? 'danger' : 'warning'}>
                        {al.severity}
                      </Badge>
                      <p className="text-[10px] text-slate-400 mt-1">{al.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Quick Management Shortcuts */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">Accesos Rápidos</h3>

          <div className="space-y-2.5">
            <Link
              to="/admin/guardians"
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-500 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-brand-50 text-brand-700 rounded-xl">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Generar Código de Tutor</h4>
                  <p className="text-[11px] text-slate-400">Emisión de códigos OTP para PWA</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-600 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/admin/notifications"
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-500 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-50 text-sky-700 rounded-xl">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Historial de Notificaciones</h4>
                  <p className="text-[11px] text-slate-400">Entregas Push y reintentos</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-sky-600 group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/admin/audit"
              className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-brand-500 hover:shadow-sm transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Logs de Auditoría</h4>
                  <p className="text-[11px] text-slate-400">Trazabilidad inmutable</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-800 group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
