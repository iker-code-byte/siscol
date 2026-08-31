import React from 'react';
import { Menu, Bell, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="p-2 -ml-2 rounded-xl text-slate-600 hover:bg-slate-100 lg:hidden cursor-pointer"
        >
          <Menu className="w-5 h-5" />
        </button>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-brand-700 bg-brand-50 px-2.5 py-1 rounded-full border border-brand-100">
          <Shield className="w-3.5 h-3.5" />
          Colegio Gabriel René Moreno II — MVP v2
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-xs font-semibold text-slate-800 leading-tight">
            {user?.profile?.full_name || user?.username}
          </p>
          <p className="text-[10px] text-slate-400 font-medium">
            {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'TEACHER' ? 'Docente' : 'Estudiante'}
          </p>
        </div>

        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs">
          {user?.username.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
};
