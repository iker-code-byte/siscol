import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { School, Lock, User as UserIcon, AlertCircle, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/common/Button';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Por favor complete todos los campos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const user = await login(username, password);
      if (user.role === 'ADMIN') {
        navigate('/admin');
      } else if (user.role === 'TEACHER') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      setError(err.message || 'Credenciales incorrectas. Verifique su usuario y contraseña.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemo = (demoUser: string, demoPass: string) => {
    setUsername(demoUser);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Volver al portal
        </Link>
        <div className="w-12 h-12 rounded-2xl bg-brand-500/20 border border-brand-500/40 flex items-center justify-center text-brand-400 font-bold text-xl mx-auto mb-3">
          GRM
        </div>
        <h2 className="text-2xl font-extrabold tracking-tight text-white">Colegio Gabriel René Moreno II</h2>
        <p className="mt-1 text-xs text-slate-400">Ingreso para Administradores, Docentes y Estudiantes</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-800/90 border border-slate-700/80 backdrop-blur-md py-8 px-6 shadow-2xl rounded-3xl sm:px-10">
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Nombre de Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="ej. docente1 o estudiante1"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-10 pr-3.5 py-2.5 bg-slate-900/60 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <Button type="submit" variant="primary" size="lg" className="w-full mt-2" isLoading={isLoading}>
              Iniciar Sesión
            </Button>
          </form>

          {/* Quick Demo Access Bar */}
          <div className="mt-8 pt-6 border-t border-slate-700/60">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 text-center mb-3">
              Credenciales de Demostración (1 Clic)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemo('admin', 'admin123')}
                className="px-2.5 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-medium text-center transition-all cursor-pointer"
              >
                <div className="font-bold text-amber-400">Admin</div>
                <div className="text-[10px] text-slate-400">admin123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('docente1', 'docente123')}
                className="px-2.5 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-medium text-center transition-all cursor-pointer"
              >
                <div className="font-bold text-emerald-400">Docente</div>
                <div className="text-[10px] text-slate-400">docente123</div>
              </button>

              <button
                type="button"
                onClick={() => handleQuickDemo('estudiante1', 'estudiante123')}
                className="px-2.5 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600 text-slate-200 text-xs font-medium text-center transition-all cursor-pointer"
              >
                <div className="font-bold text-sky-400">Alumno</div>
                <div className="text-[10px] text-slate-400">estudiante123</div>
              </button>
            </div>
          </div>
        </div>

        <div className="text-center mt-6">
          <p className="text-xs text-slate-400">
            ¿Es padre o tutor de familia?{' '}
            <Link to="/guardian/activate" className="font-semibold text-brand-400 hover:text-brand-300 underline">
              Vincular dispositivo con código aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
