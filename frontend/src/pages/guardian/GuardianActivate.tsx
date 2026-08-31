import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useGuardian } from '../../context/GuardianContext';
import { KeyRound, Smartphone, ShieldCheck, AlertCircle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const GuardianActivate: React.FC = () => {
  const { activateDevice, deviceToken } = useGuardian();
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already linked, offer direct navigation to inbox
  if (deviceToken) {
    navigate('/guardian/inbox');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Por favor ingrese el código de activación.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await activateDevice(code.trim().toUpperCase(), deviceName.trim() || undefined);
      navigate('/guardian/inbox');
    } catch (err: any) {
      setError(err.message || 'Código inválido, expirado o ya utilizado.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/15 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al portal
        </Link>
        <div className="w-14 h-14 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 mx-auto mb-3">
          <Smartphone className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Vincular Dispositivo de Tutor</h2>
        <p className="mt-1 text-xs text-slate-300 max-w-sm mx-auto">
          Ingrese el código de activación otorgado por la dirección del colegio para recibir avisos y alertas en este teléfono.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="bg-slate-800/90 border border-slate-700/80 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Código de Activación</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="ej. GRM-889613"
                  className="block w-full pl-10 pr-3.5 py-3 bg-slate-900/80 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-base font-mono tracking-wider uppercase focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent text-center font-bold"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">Código de 6 u 8 caracteres generado por el colegio.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nombre de este Teléfono (Opcional)</label>
              <input
                type="text"
                value={deviceName}
                onChange={(e) => setDeviceName(e.target.value)}
                placeholder="ej. Teléfono de Mamá"
                className="block w-full px-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
              Vincular Dispositivo
            </Button>
          </form>

          {/* Privacy Note */}
          <div className="mt-6 pt-5 border-t border-slate-700/60 flex items-start gap-2.5 text-slate-400 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 text-brand-400 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              No requiere registrar contraseñas. Este dispositivo quedará autorizado de forma segura para consultar únicamente los avisos de sus hijos o tutelados.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
