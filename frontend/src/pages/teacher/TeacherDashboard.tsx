import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import { TeachingAssignment, Question } from '../../types';
import { Award, ClipboardCheck, HelpCircle, BarChart3, ArrowRight, BookOpen, Clock, Users } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [assignData, qData] = await Promise.all([
          api.getTeachingAssignments(),
          api.getQuestions({ status: 'OPEN' }),
        ]);
        setAssignments(Array.isArray(assignData) ? assignData : assignData.results || []);
        setQuestions(Array.isArray(qData) ? qData : qData.results || []);
      } catch (e) {
        console.error('Error loading teacher data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-900 via-slate-900 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-sm border border-brand-800/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">Panel del Docente</span>
          <h2 className="text-2xl md:text-3xl font-extrabold mt-1">
            Bienvenido, Prof. {user?.profile?.full_name || user?.username}
          </h2>
          <p className="text-xs md:text-sm text-slate-300 mt-2 max-w-xl">
            Gestione sus planillas de notas, registre asistencia diaria y responda consultas académicas de sus alumnos.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link to="/teacher/grades">
            <Button variant="primary" icon={<Award className="w-4 h-4" />}>
              Cargar Notas
            </Button>
          </Link>
          <Link to="/teacher/attendance">
            <Button variant="outline" className="bg-white/10 text-white border-white/20 hover:bg-white/20" icon={<ClipboardCheck className="w-4 h-4" />}>
              Tomar Asistencia
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: My Assignments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Mis Materias Asignadas</h3>
            <span className="text-xs text-slate-500 font-medium">{assignments.length} asignaciones activas</span>
          </div>

          {isLoading ? (
            <p className="text-xs text-slate-500">Cargando asignaciones...</p>
          ) : assignments.length === 0 ? (
            <Card className="text-center py-8 text-slate-500 text-xs">
              No tienes asignaciones registradas actualmente.
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {assignments.map((assign) => (
                <div
                  key={assign.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full border border-brand-100">
                        {assign.subject_code}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        {assign.course_name} ({assign.course_parallel})
                      </span>
                    </div>
                    <h4 className="text-base font-bold text-slate-900 mb-1">{assign.subject_name}</h4>
                    <p className="text-xs text-slate-400">{assign.academic_year_name}</p>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      to={`/teacher/grades?assignment_id=${assign.id}`}
                      className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                    >
                      <Award className="w-3.5 h-3.5" /> Planilla
                    </Link>
                    <Link
                      to={`/teacher/attendance?assignment_id=${assign.id}`}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1"
                    >
                      <ClipboardCheck className="w-3.5 h-3.5" /> Asistencia
                    </Link>
                    <Link
                      to={`/teacher/reports?assignment_id=${assign.id}`}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1"
                    >
                      <BarChart3 className="w-3.5 h-3.5" /> Métricas
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Pending Questions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-800 tracking-tight">Dudas de Alumnos</h3>
            <Badge variant={questions.length > 0 ? 'warning' : 'default'}>{questions.length} pendientes</Badge>
          </div>

          <Card>
            {questions.length === 0 ? (
              <div className="text-center py-6 text-slate-400">
                <HelpCircle className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs">No hay dudas de estudiantes pendientes de respuesta.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.slice(0, 5).map((q) => (
                  <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-xs font-bold text-slate-800">{q.student_name}</span>
                      <span className="text-[10px] text-slate-400 font-medium">{q.subject_name}</span>
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{q.body}</p>
                    <Link
                      to="/teacher/questions"
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:underline mt-2"
                    >
                      Responder <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))}

                <Link to="/teacher/questions" className="block text-center pt-2">
                  <Button variant="ghost" size="sm" className="w-full text-xs">
                    Ver todas las consultas
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
