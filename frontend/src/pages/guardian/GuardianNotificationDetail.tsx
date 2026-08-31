import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../../services/api';
import { GuardianNotificationDetail as INotificationDetail } from '../../types';
import { ArrowLeft, Award, ClipboardCheck, Calendar, User, School, Clock, ShieldCheck } from 'lucide-react';
import { Badge } from '../../components/common/Badge';

export const GuardianNotificationDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [notification, setNotification] = useState<INotificationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDetail = async () => {
      if (!id) return;
      try {
        const data = await api.getGuardianNotificationDetail(id);
        setNotification(data);
      } catch (err: any) {
        setError(err.message || 'No se pudo cargar el detalle de esta notificación.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetail();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <p className="text-xs text-slate-500 font-medium animate-pulse">Cargando notificación autorizada...</p>
      </div>
    );
  }

  if (error || !notification) {
    return (
      <div className="min-h-screen bg-slate-100 p-4 max-w-md mx-auto flex flex-col justify-center">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 text-center">
          <p className="text-xs text-rose-600 mb-4">{error || 'Notificación no encontrada'}</p>
          <Link to="/guardian/inbox" className="text-xs text-brand-600 font-bold underline">
            Volver a la bandeja
          </Link>
        </div>
      </div>
    );
  }

  const meta = notification.metadata || {};

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-30">
        <div className="max-w-md mx-auto px-4 py-3.5 flex items-center gap-3">
          <button
            onClick={() => navigate('/guardian/inbox')}
            className="p-1.5 -ml-1.5 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-900">Detalle del Aviso</h1>
            <p className="text-[10px] text-slate-400">Colegio Gabriel René Moreno II</p>
          </div>
        </div>
      </header>

      {/* Detail Content */}
      <main className="max-w-md w-full mx-auto p-4 flex-1">
        <div className="bg-white rounded-3xl p-6 shadow-xs border border-slate-200/80 space-y-5">
          {/* Badge & Date */}
          <div className="flex items-center justify-between">
            <Badge variant={notification.category === 'ATTENDANCE_ALERT' ? 'warning' : 'danger'}>
              {notification.category_display}
            </Badge>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {new Date(notification.created_at).toLocaleDateString()} {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* Student Header */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs">
                🎓
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">{notification.student_display}</p>
                <p className="text-[10px] text-slate-400 font-mono">{notification.student_code}</p>
              </div>
            </div>
          </div>

          {/* Title & Body */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-snug mb-2">{notification.detailed_title}</h2>
            <p className="text-sm text-slate-600 leading-relaxed bg-brand-50/40 p-4 rounded-2xl border border-brand-100/60">
              {notification.detailed_body}
            </p>
          </div>

          {/* Metadata Breakdown */}
          {Object.keys(meta).length > 0 && (
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Detalles Académicos</h4>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {meta.subject_name && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Materia</span>
                    <span className="font-semibold text-slate-800">{meta.subject_name}</span>
                  </div>
                )}
                {meta.course_name && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Curso</span>
                    <span className="font-semibold text-slate-800">{meta.course_name}</span>
                  </div>
                )}
                {meta.score !== undefined && (
                  <div className="p-3 bg-rose-50 text-rose-800 rounded-xl border border-rose-100">
                    <span className="text-[10px] text-rose-500 block">Calificación</span>
                    <span className="font-bold text-base">{meta.score} / {meta.max_score || 100}</span>
                  </div>
                )}
                {meta.date && (
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Fecha Registro</span>
                    <span className="font-semibold text-slate-800">{meta.date}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Privacy footer */}
          <div className="pt-4 border-t border-slate-100 flex items-center gap-2 text-slate-400 text-[11px]">
            <ShieldCheck className="w-4 h-4 text-brand-600" />
            <span>Notificación oficial emitida por el Colegio Gabriel René Moreno II.</span>
          </div>
        </div>
      </main>
    </div>
  );
};
