import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useGuardian } from '../../context/GuardianContext';
import { api } from '../../services/api';
import { GuardianInboxItem } from '../../types';
import {
  Bell,
  BellRing,
  Award,
  ClipboardCheck,
  Smartphone,
  Settings,
  ShieldCheck,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Clock,
  User,
} from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { InstallPwaBanner } from '../../components/common/InstallPwaBanner';

export const GuardianInbox: React.FC = () => {
  const { guardianData, pushEnabled, enablePushNotifications, deviceToken } = useGuardian();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<GuardianInboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEnablingPush, setIsEnablingPush] = useState(false);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const data = await api.getGuardianNotifications();
      setNotifications(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!deviceToken) {
      navigate('/guardian/activate');
      return;
    }
    fetchNotifications();

    // Auto-refresh notifications every 15 seconds while inbox is open
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000);

    // Refresh when user returns to window / tab
    const handleFocus = () => {
      fetchNotifications();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [deviceToken]);

  const handlePushPermission = async () => {
    setIsEnablingPush(true);
    await enablePushNotifications();
    setIsEnablingPush(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* PWA Mobile Header */}
      <header className="bg-brand-900 text-white sticky top-0 z-30 shadow-md">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-brand-500/30 flex items-center justify-center font-bold text-xs text-brand-300">
              GRM
            </div>
            <div>
              <h1 className="text-sm font-bold text-white leading-tight">Colegio Gabriel René Moreno II</h1>
              <p className="text-[10px] text-brand-300">Bandeja de Avisos para Tutores</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={fetchNotifications}
              className="p-2 text-brand-200 hover:text-white rounded-lg hover:bg-brand-800 transition-colors"
              title="Actualizar avisos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <Link
              to="/guardian/settings"
              className="p-2 text-brand-200 hover:text-white rounded-lg hover:bg-brand-800 transition-colors"
            >
              <Settings className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area (Mobile Container) */}
      <main className="max-w-md w-full mx-auto p-4 flex-1">
        <InstallPwaBanner />

        {/* Guardian & Student Chips */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-brand-700" />
              <span className="text-xs font-bold text-slate-800">{guardianData?.guardian.full_name}</span>
            </div>
            <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {guardianData?.device.name || 'Dispositivo Vinculado'}
            </span>
          </div>

          {guardianData?.students && guardianData.students.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {guardianData.students.map((st) => (
                <span
                  key={st.id}
                  className="inline-flex items-center gap-1 text-xs bg-brand-50 text-brand-800 px-2.5 py-1 rounded-xl border border-brand-100 font-medium"
                >
                  🎓 {st.full_name} <span className="text-[10px] text-brand-600">({st.relationship})</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Push Notification Activation Card if not enabled */}
        {!pushEnabled && (
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-2xl p-4 shadow-md mb-4 animate-in fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white/20 text-white shrink-0 mt-0.5">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold leading-tight">Activar Notificaciones Push</h4>
                <p className="text-xs text-amber-100 mt-1 leading-relaxed">
                  Para recibir avisos en la pantalla de su teléfono cuando se registre una nota baja o falta.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePushPermission}
                  isLoading={isEnablingPush}
                  className="mt-3 bg-white text-amber-900 hover:bg-amber-50 border-none font-bold"
                >
                  Permitir Avisos Push
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Historial de Notificaciones</h3>
            <span className="text-xs text-slate-400 font-medium">{notifications.length} avisos</span>
          </div>

          {isLoading ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
              <p className="text-xs text-slate-500">Cargando notificaciones autorizadas...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-brand-50 text-brand-600 flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Bandeja al día</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                No tienes notificaciones pendientes. Las alertas sobre notas o faltas aparecerán aquí.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <Link
                key={notif.id}
                to={`/guardian/notifications/${notif.id}`}
                className={`block bg-white p-4 rounded-2xl border transition-all hover:border-brand-500 hover:shadow-sm ${
                  notif.is_read ? 'border-slate-200/80 opacity-80' : 'border-brand-200 bg-emerald-50/20 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div
                      className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        notif.category === 'ATTENDANCE_ALERT'
                          ? 'bg-amber-50 text-amber-600 border border-amber-100'
                          : 'bg-rose-50 text-rose-600 border border-rose-100'
                      }`}
                    >
                      {notif.category === 'ATTENDANCE_ALERT' ? (
                        <ClipboardCheck className="w-4 h-4" />
                      ) : (
                        <Award className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-bold text-slate-900">{notif.student_display}</span>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" title="No leída" />
                        )}
                      </div>
                      <h4 className="text-xs font-semibold text-slate-800 leading-snug">{notif.detailed_title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(notif.created_at).toLocaleDateString()} —{' '}
                        {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      {/* Bottom PWA Tab Bar */}
      <footer className="bg-white border-t border-slate-200/80 sticky bottom-0 z-30">
        <div className="max-w-md mx-auto px-6 py-2 flex items-center justify-around">
          <Link to="/guardian/inbox" className="flex flex-col items-center gap-1 text-brand-700 font-bold text-[10px]">
            <Bell className="w-5 h-5" />
            <span>Avisos</span>
          </Link>
          <Link to="/guardian/settings" className="flex flex-col items-center gap-1 text-slate-400 hover:text-slate-700 text-[10px]">
            <Settings className="w-5 h-5" />
            <span>Ajustes</span>
          </Link>
        </div>
      </footer>
    </div>
  );
};
