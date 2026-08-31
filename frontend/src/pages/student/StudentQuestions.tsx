import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Question, TeachingAssignment } from '../../types';
import { HelpCircle, Plus, Send, Clock, BookOpen } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const StudentQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New question modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignId, setSelectedAssignId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const [qData, assignData] = await Promise.all([
        api.getStudentMeQuestions(),
        api.getTeachingAssignments(),
      ]);
      setQuestions(Array.isArray(qData) ? qData : (qData as any)?.results || []);
      const aList = Array.isArray(assignData) ? assignData : assignData.results || [];
      setAssignments(aList);
      if (aList.length > 0) {
        setSelectedAssignId(aList[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignId || !subject.trim() || !body.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);

    try {
      await api.createQuestion({
        teaching_assignment: selectedAssignId,
        subject: subject.trim(),
        body: body.trim(),
      });
      setIsModalOpen(false);
      setSubject('');
      setBody('');
      fetchQuestions();
    } catch (err: any) {
      setFeedback(err.message || 'Error al enviar la consulta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Mis Consultas y Preguntas</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Envía dudas pedagógicas a tus docentes y consulta sus respuestas.
          </p>
        </div>

        <Button
          variant="primary"
          className="bg-sky-600 hover:bg-sky-700"
          onClick={() => setIsModalOpen(true)}
          icon={<Plus className="w-4 h-4" />}
        >
          Hacer una Pregunta
        </Button>
      </div>

      {isLoading ? (
        <Card className="text-center py-12 text-slate-400 text-xs">Cargando consultas...</Card>
      ) : questions.length === 0 ? (
        <Card className="text-center py-12 text-slate-400">
          <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Aún no tienes preguntas</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            ¿Tienes alguna duda sobre tus tareas o evaluaciones? Envía una consulta directamente a tu profesor.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => setIsModalOpen(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Nueva Consulta
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {questions.map((q) => (
            <Card key={q.id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={q.status === 'OPEN' ? 'warning' : 'success'}>
                      {q.status === 'OPEN' ? 'Pendiente de Respuesta' : 'Respondida'}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-600">{q.subject_name}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{q.subject}</h3>
                </div>

                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(q.created_at).toLocaleDateString()}
                </span>
              </div>

              {/* Body */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed mb-4">
                {q.body}
              </div>

              {/* Answers */}
              {q.answers && q.answers.length > 0 ? (
                <div className="space-y-2">
                  {q.answers.map((ans) => (
                    <div key={ans.id} className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 text-xs text-sky-950">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-sky-900">Prof. {ans.teacher_name} respondió:</span>
                        <span className="text-[10px] text-sky-700">
                          {new Date(ans.published_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="leading-relaxed">{ans.body}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic">Esperando respuesta del docente asignado...</p>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* New Question Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nueva Consulta al Profesor">
        <form onSubmit={handleCreateQuestion} className="space-y-4">
          {feedback && <p className="text-xs text-rose-600 font-medium">{feedback}</p>}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Materia / Profesor</label>
            <select
              value={selectedAssignId}
              onChange={(e) => setSelectedAssignId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.subject_name} — Prof. {a.teacher_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Asunto / Tema</label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="ej. Duda sobre el ejercicio 4 del práctico"
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Detalle de tu Pregunta</label>
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe tu consulta con el mayor detalle posible..."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} className="bg-sky-600 hover:bg-sky-700" icon={<Send className="w-4 h-4" />}>
              Enviar Pregunta
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
