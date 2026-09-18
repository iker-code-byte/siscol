import React from 'react';
import { Link } from 'react-router-dom';
import { School, Smartphone, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../components/common/Button';

export const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-[#0e2138] to-slate-950 text-white flex flex-col justify-between relative overflow-hidden">
      {/* Decorative Glows */}
      <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/3 -left-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="px-6 py-6 max-w-6xl mx-auto w-full flex items-center justify-between z-10">
        <div className="flex items-center gap-3.5">
          <img
            src="/marista-logo.png"
            alt="Escudo Marista"
            className="w-12 h-12 object-contain drop-shadow-md transition-transform hover:scale-105"
          />
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white leading-tight">
              U.E. Gabriel René Moreno II
            </h1>
            <p className="text-xs text-amber-400 font-semibold tracking-wide">
              Fe y Alegría Marista — Comarapa
            </p>
          </div>
        </div>

        <Link to="/login">
          <Button variant="outline" size="sm" className="bg-blue-950/60 text-blue-200 border-blue-500/30 hover:bg-blue-900/60 hover:text-white transition-all shadow-sm">
            Ingreso Personal
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="px-6 py-12 max-w-4xl mx-auto w-full text-center z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/15 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          Plataforma Institucional Oficial — Gestión 2026
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 leading-tight">
          Gestión Digital de <span className="text-blue-400">Notas</span>, <span className="text-blue-400">Asistencia</span> y Alertas a Tutores
        </h2>

        <p className="text-sm sm:text-base md:text-lg text-slate-300 max-w-2xl mx-auto mb-12 leading-relaxed">
          Plataforma oficial de la <strong className="text-white font-semibold">U.E. Gabriel René Moreno II Fe y Alegría Marista</strong>. Planillas bimestrales para docentes, consulta de avance para estudiantes y notificaciones automáticas a padres y tutores.
        </p>

        {/* Portal Access Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left max-w-3xl mx-auto mb-12">
          {/* Card 1: Padre / Tutor */}
          <div className="bg-gradient-to-br from-[#122844]/90 to-slate-900/90 border border-amber-500/30 hover:border-amber-400/70 rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-amber-500/10 transition-all group backdrop-blur-sm">
            <div className="p-3 bg-amber-500/15 rounded-2xl w-fit text-amber-400 border border-amber-500/30 mb-4 group-hover:scale-105 transition-transform">
              <Smartphone className="w-6 h-6" />
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-400 text-[10px] font-bold uppercase tracking-wider mb-2">
              Familias y Tutores
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Soy Padre o Tutor</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Vincule su teléfono con el código otorgado por la dirección para consultar calificaciones, registrar firmas y recibir avisos inmediatos de faltas o notas.
            </p>
            <Link to="/guardian/activate">
              <Button variant="primary" className="w-full justify-between bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold border-none shadow-lg shadow-amber-500/20" icon={<ArrowRight className="w-4 h-4" />}>
                Vincular mi Dispositivo
              </Button>
            </Link>
          </div>

          {/* Card 2: Personal & Alumnos */}
          <div className="bg-gradient-to-br from-[#0e2138]/90 to-slate-900/90 border border-blue-500/30 hover:border-blue-400/70 rounded-3xl p-6 sm:p-7 shadow-xl hover:shadow-blue-500/10 transition-all group backdrop-blur-sm">
            <div className="p-3 bg-blue-500/15 rounded-2xl w-fit text-blue-400 border border-blue-500/30 mb-4 group-hover:scale-105 transition-transform">
              <School className="w-6 h-6" />
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-2">
              Comunidad Educativa
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Personal y Alumnos</h3>
            <p className="text-xs text-slate-300 mb-6 leading-relaxed">
              Acceso seguro para Administradores, Docentes de área y Estudiantes con credenciales institucionales.
            </p>
            <Link to="/login">
              <Button variant="outline" className="w-full justify-between bg-blue-900/40 text-blue-100 border-blue-500/40 hover:bg-blue-800/50 hover:text-white" icon={<ArrowRight className="w-4 h-4" />}>
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-6 py-6 border-t border-slate-800/80 text-center text-xs text-slate-400 z-10 bg-slate-950/60 backdrop-blur-xs">
        <p className="font-medium text-slate-300">
          U.E. Gabriel René Moreno II Fe y Alegría Marista
        </p>
        <p className="text-[11px] text-slate-500 mt-1">
          Comarapa, Santa Cruz, Bolivia — Gestión Escolar 2026. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  );
};
