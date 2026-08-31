import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { Button } from './Button';

export const InstallPwaBanner: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  if (!showBanner) return null;

  return (
    <div className="bg-gradient-to-r from-brand-900 to-slate-900 text-white p-4 rounded-2xl shadow-lg border border-brand-700/50 mb-6 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3.5">
        <div className="p-2.5 rounded-xl bg-brand-500/20 text-brand-300 border border-brand-500/30">
          <Smartphone className="w-5 h-5" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-white">Instalar como Aplicación</h4>
          <p className="text-xs text-slate-300">Recibe notificaciones instantáneas directamente en la pantalla de tu teléfono.</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="primary" onClick={handleInstall} icon={<Download className="w-3.5 h-3.5" />}>
          Instalar PWA
        </Button>
        <button
          onClick={() => setShowBanner(false)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
