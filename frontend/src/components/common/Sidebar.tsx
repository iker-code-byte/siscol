import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  GraduationCap,
  Users,
  BookOpen,
  ClipboardCheck,
  Award,
  BellRing,
  HelpCircle,
  BarChart3,
  ShieldCheck,
  KeyRound,
  LogOut,
  Sparkles,
  School,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getLinks = () => {
    if (!user) return [];

    if (user.role === 'ADMIN') {
      return [
        { to: '/admin', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Dashboard' },
        { to: '/admin/students', icon: <GraduationCap className="w-4 h-4" />, label: 'Estudiantes' },
        { to: '/admin/guardians', icon: <KeyRound className="w-4 h-4" />, label: 'Tutores y Códigos' },
        { to: '/admin/teachers', icon: <Users className="w-4 h-4" />, label: 'Docentes' },
        { to: '/admin/courses', icon: <School className="w-4 h-4" />, label: 'Cursos y Materias' },
        { to: '/admin/assignments', icon: <BookOpen className="w-4 h-4" />, label: 'Asignaciones' },
        { to: '/admin/alert-rules', icon: <BellRing className="w-4 h-4" />, label: 'Reglas de Alerta' },
        { to: '/admin/notifications', icon: <Sparkles className="w-4 h-4" />, label: 'Notificaciones' },
        { to: '/admin/audit', icon: <ShieldCheck className="w-4 h-4" />, label: 'Auditoría' },
      ];
    }

    if (user.role === 'TEACHER') {
      return [
        { to: '/teacher', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Mi Panel' },
        { to: '/teacher/grades', icon: <Award className="w-4 h-4" />, label: 'Planilla de Notas' },
        { to: '/teacher/attendance', icon: <ClipboardCheck className="w-4 h-4" />, label: 'Asistencia' },
        { to: '/teacher/questions', icon: <HelpCircle className="w-4 h-4" />, label: 'Preguntas / Dudas' },
        { to: '/teacher/reports', icon: <BarChart3 className="w-4 h-4" />, label: 'Reportes de Curso' },
      ];
    }

    if (user.role === 'STUDENT') {
      return [
        { to: '/student', icon: <LayoutDashboard className="w-4 h-4" />, label: 'Mi Panel' },
        { to: '/student/grades', icon: <Award className="w-4 h-4" />, label: 'Mis Calificaciones' },
        { to: '/student/attendance', icon: <ClipboardCheck className="w-4 h-4" />, label: 'Mi Asistencia' },
        { to: '/student/questions', icon: <HelpCircle className="w-4 h-4" />, label: 'Mis Consultas' },
      ];
    }

    return [];
  };

  const links = getLinks();

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800/80 bg-slate-950/40 gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 font-bold">
            GRM
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white leading-tight">Gabriel René Moreno II</h1>
            <p className="text-[10px] text-brand-400 font-medium tracking-wider uppercase">Comarapa, Bolivia</p>
          </div>
        </div>

        {/* User Info Capsule */}
        <div className="px-4 py-3 mx-3 my-3 bg-slate-800/50 rounded-xl border border-slate-700/50 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center font-bold text-xs text-white">
            {user?.username.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-slate-200 truncate">{user?.profile?.full_name || user?.username}</p>
            <p className="text-[10px] text-brand-400 font-medium tracking-wide capitalize">
              {user?.role === 'ADMIN' ? 'Administrador' : user?.role === 'TEACHER' ? 'Docente' : 'Estudiante'}
            </p>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/admin' || link.to === '/teacher' || link.to === '/student'}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              {link.icon}
              <span>{link.label}</span>
            </NavLink>
          ))}
        </div>

        {/* Footer Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/20">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>
    </>
  );
};
