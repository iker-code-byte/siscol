import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { Award, ClipboardCheck, HelpCircle, ArrowRight, TrendingUp, Clock, BookOpen } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();
  const [grades, setGrades] = useState<any[]>([]);
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [gradesRes, attRes, qRes] = await Promise.all([
          api.getStudentMeGrades(),
          api.getStudentMeAttendance(),
          api.getStudentMeQuestions(),
        ]);
        setGrades(gradesRes.results || []);
        setAttendanceStats(attRes.stats || null);
        setQuestions(Array.isArray(qRes) ? qRes : (qRes as any)?.results || []);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-sm border border-sky-800/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-sky-400">Portal del Estudiante</span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-1">
            Hola, {user?.profile?.full_name || user?.username}
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-2 max-w-xl">
            Consulta tus notas oficiales, revisa tu asistencia diaria y envía consultas a tus profesores.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/student/grades">
            <Button variant="primary" className="bg-sky-600 hover:bg-sky-700" icon={<Award className="w-4 h-4" />}>
              Mis Notas
            </Button>
          </Link>
          <Link to="/student/questions">
            <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" icon={<HelpCircle className="w-4 h-4" />}>
              Hacer Pregunta
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Calificaciones Registradas"
          value={grades.length}
          icon={<Award className="w-5 h-5" />}
          color="sky"
          subtitle="En el período actual"
        />
        <StatCard
          title="Asistencia Global"
          value={attendanceStats ? `${attendanceStats.attendance_rate}%` : '100%'}
          icon={<ClipboardCheck className="w-5 h-5" />}
          color="brand"
          subtitle={attendanceStats ? `${attendanceStats.present} presentes` : 'Al día'}
        />
        <StatCard
          title="Faltas Acumuladas"
          value={attendanceStats ? attendanceStats.absent : 0}
          icon={<Clock className="w-5 h-5" />}
          color={attendanceStats && attendanceStats.absent > 0 ? 'rose' : 'slate'}
          subtitle="En el historial"
        />
        <StatCard
          title="Mis Consultas"
          value={questions.length}
          icon={<HelpCircle className="w-5 h-5" />}
          color="amber"
          subtitle="Dudas enviadas"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Grades */}
        <Card
          title="Últimas Calificaciones"
          subtitle="Evaluaciones recientes"
          headerAction={
            <Link to="/student/grades" className="text-xs font-semibold text-sky-600 hover:underline">
              Ver todas
            </Link>
          }
        >
          {grades.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No hay calificaciones registradas aún.</p>
          ) : (
            <div className="space-y-2.5">
              {grades.slice(0, 4).map((g) => (
                <div key={g.id} className="p-3.5 bg-slate-50 rounded-xl flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{g.subject_name}</h4>
                    <p className="text-[11px] text-slate-500">{g.activity_name} ({g.term})</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-extrabold px-2.5 py-1 rounded-lg ${
                        g.percentage && g.percentage < 51
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {g.score} / {g.max_score}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Q&A */}
        <Card
          title="Mis Preguntas al Profesor"
          subtitle="Dudas y respuestas pedagógicas"
          headerAction={
            <Link to="/student/questions" className="text-xs font-semibold text-sky-600 hover:underline">
              Nueva consulta
            </Link>
          }
        >
          {questions.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">No has enviado preguntas a tus profesores.</p>
          ) : (
            <div className="space-y-3">
              {questions.slice(0, 3).map((q) => (
                <div key={q.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-800">{q.subject}</span>
                    <Badge variant={q.status === 'OPEN' ? 'warning' : 'success'}>
                      {q.status === 'OPEN' ? 'Pendiente' : 'Respondida'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-1">{q.body}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
