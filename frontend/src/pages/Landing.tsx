import React from 'react';
import { Link } from 'react-router-dom';
import { School, Smartphone, ShieldCheck, ArrowRight, BellRing, Sparkles } from 'lucide-react';
import { Button } from '../components/common/Button';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col justify-between">
      {/* Header */}
      <header className="px-6 py-6 max-w-6xl mx-auto w-full flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 font-bold text-lg">
            GRM
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">Colegio Gabriel René Moreno II</h1>
            <p className="text-xs text-brand-400 font-medium">Comarapa — Gestión 2026</p>
          </div>
        </div>

        <Link to="/login">
          <Button variant="outline" size="sm" className="bg-white/10 text-white border-white/20 hover:bg-white/20">
            Ingreso Personal
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-12 max-w-4xl mx-auto w-full text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-semibold mb-6">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          Sistema Web Académico + PWA Web Push
        </div>

        <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Gestión Digital de <span className="text-brand-400">Notas, Asistencia</span> y Alertas a Tutores
        </h2>

        <p className="text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
          Plataforma oficial del Colegio Gabriel René Moreno II. Planillas digitales para docentes, portal de consulta para estudiantes y notificaciones instantáneas a teléfonos de tutores.
        </p>

        {/* Portal Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto mb-12">
          {/* Card 1: Padre / Tutor PWA */}
          <div className="bg-gradient-to-br from-brand-950/80 to-slate-900/80 border border-brand-500/40 rounded-3xl p-6 shadow-xl hover:border-brand-400 transition-all group">
            <div className="p-3 bg-brand-500/20 rounded-2xl w-fit text-brand-400 border border-brand-500/30 mb-4">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Soy Padre o Tutor</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Vincule su teléfono con el código otorgado por la administración para recibir avisos y alertas académicas sin registrar cuentas complejas.
            </p>
            <Link to="/guardian/activate">
              <Button variant="primary" className="w-full justify-between" icon={<ArrowRight className="w-4 h-4" />}>
                Vincular mi Dispositivo
              </Button>
            </Link>
          </div>

          {/* Card 2: Personal & Alumnos */}
          <div className="bg-slate-900/80 border border-slate-700/80 rounded-3xl p-6 shadow-xl hover:border-slate-500 transition-all group">
            <div className="p-3 bg-slate-800 rounded-2xl w-fit text-slate-300 border border-slate-700 mb-4">
              <School className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Personal y Alumnos</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Acceso a la plataforma para Administradores, Docentes de materia y Estudiantes con credenciales institucionales.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full justify-between bg-slate-800 text-white border-slate-700 hover:bg-slate-700" icon={<ArrowRight className="w-4 h-4" />}>
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-800 text-center text-xs text-slate-500">
        Colegio Gabriel René Moreno II — Comarapa, Santa Cruz, Bolivia. Todos los derechos reservados.
      </footer>
    </div>
  );
};
