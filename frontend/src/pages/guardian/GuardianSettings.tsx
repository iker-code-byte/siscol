import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGuardian } from '../../context/GuardianContext';
import { ArrowLeft, BellRing, Smartphone, LogOut, ShieldCheck, CheckCircle2, XCircle } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const GuardianSettings: React.FC = () => {
  const { guardianData, pushEnabled, enablePushNotifications, disablePushNotifications, unlinkDevice } = useGuardian();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);

  const handleTogglePush = async () => {
    setIsLoading(true);
    if (pushEnabled) {
      await disablePushNotifications();
    } else {
      await enablePushNotifications();
    }
    setIsLoading(false);
  };

  const handleUnlink = async () => {
    if (window.confirm('¿Está seguro de desvincular este dispositivo? Dejará de recibir notificaciones hasta ingresar un nuevo código.')) {
      await unlinkDevice();
      navigate('/guardian/activate');
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center gap-3">
          <Link to="/guardian/inbox" className="p-1.5 -ml-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-sm font-bold text-slate-900">Ajustes del Dispositivo</h1>
            <p className="text-[10px] text-slate-400">Tutor PWA</p>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-md w-full mx-auto p-4 flex-1 space-y-4">
        {/* Device Information */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Datos de Vinculación</h3>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Tutor Titular:</span>
              <span className="font-semibold text-slate-800">{guardianData?.guardian.full_name}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Dispositivo:</span>
              <span className="font-semibold text-slate-800">{guardianData?.device.name || 'Web PWA'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Plataforma:</span>
              <span className="font-semibold text-slate-800 uppercase">{guardianData?.device.platform}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-100">
              <span className="text-slate-500">Vinculado el:</span>
              <span className="font-semibold text-slate-800">
                {guardianData?.device.linked_at ? new Date(guardianData.device.linked_at).toLocaleDateString() : '-'}
              </span>
            </div>
          </div>
        </div>

        {/* Push Notification Controls */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${pushEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Notificaciones Push</h4>
                <p className="text-xs text-slate-500">
                  {pushEnabled ? 'Activas en este navegador' : 'Desactivadas o sin permiso'}
                </p>
              </div>
            </div>
          </div>

          <Button
            variant={pushEnabled ? 'outline' : 'primary'}
            size="sm"
            className="w-full justify-center"
            onClick={handleTogglePush}
            isLoading={isLoading}
          >
            {pushEnabled ? 'Desactivar Notificaciones Push' : 'Activar Notificaciones Push'}
          </Button>
        </div>

        {/* Unlink Device Action */}
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80">
          <h4 className="text-xs font-bold uppercase tracking-wider text-rose-500 mb-2">Zona de Peligro</h4>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Si desvincula este dispositivo, no podrá consultar la bandeja ni recibir avisos hasta solicitar un nuevo código de activación al colegio.
          </p>

          <Button variant="danger" size="sm" className="w-full justify-center" onClick={handleUnlink} icon={<LogOut className="w-4 h-4" />}>
            Desvincular este Teléfono
          </Button>
        </div>
      </main>
    </div>
  );
};
