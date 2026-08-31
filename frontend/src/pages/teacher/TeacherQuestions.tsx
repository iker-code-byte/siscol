import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Question } from '../../types';
import { HelpCircle, Send, CheckCircle2, MessageSquare, Clock, User } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const TeacherQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Modal answering
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answerBody, setAnswerBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const data = await api.getQuestions({ status: statusFilter || undefined });
      setQuestions(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [statusFilter]);

  const handleOpenAnswerModal = (q: Question) => {
    setSelectedQuestion(q);
    setAnswerBody('');
    setFeedback(null);
  };

  const handleSendAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !answerBody.trim()) return;

    setIsSubmitting(true);
    try {
      await api.answerQuestion(selectedQuestion.id, answerBody.trim());
      setSelectedQuestion(null);
      fetchQuestions();
    } catch (err: any) {
      setFeedback(err.message || 'Error al enviar respuesta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Preguntas y Dudas de Estudiantes</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Canal de retroalimentación pedagógica y respuestas a consultas de las materias asignadas.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Todas las consultas</option>
            <option value="OPEN">Pendientes de respuesta</option>
            <option value="ANSWERED">Respondidas</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <Card className="text-center py-12 text-slate-400 text-xs">Cargando consultas de estudiantes...</Card>
      ) : questions.length === 0 ? (
        <Card className="text-center py-12 text-slate-400">
          <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Sin consultas registradas</p>
          <p className="text-xs text-slate-500 mt-1">No hay preguntas de estudiantes que coincidan con el filtro.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {questions.map((q) => (
            <Card key={q.id} className="p-6">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <Badge variant={q.status === 'OPEN' ? 'warning' : 'success'}>
                      {q.status_display}
                    </Badge>
                    <span className="text-xs font-semibold text-slate-600">
                      {q.subject_name} — {q.course_name} ({q.course_parallel})
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{q.subject}</h3>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <span className="font-semibold text-slate-700 block">{q.student_name}</span>
                  <span className="flex items-center gap-1 mt-0.5 justify-end">
                    <Clock className="w-3.5 h-3.5" />
                    {new Date(q.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* Question Body */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-700 leading-relaxed mb-4">
                {q.body}
              </div>

              {/* Answers List */}
              {q.answers && q.answers.length > 0 && (
                <div className="space-y-2 mb-4">
                  {q.answers.map((ans) => (
                    <div key={ans.id} className="p-4 bg-brand-50/40 rounded-2xl border border-brand-100/60 text-xs text-brand-950">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-brand-800">Respuesta de {ans.teacher_name}:</span>
                        <span className="text-[10px] text-brand-600">
                          {new Date(ans.published_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="leading-relaxed">{ans.body}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Button */}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant={q.status === 'OPEN' ? 'primary' : 'outline'}
                  onClick={() => handleOpenAnswerModal(q)}
                  icon={<MessageSquare className="w-4 h-4" />}
                >
                  {q.status === 'OPEN' ? 'Responder Consulta' : 'Agregar otra respuesta'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Answering Modal */}
      <Modal
        isOpen={!!selectedQuestion}
        onClose={() => setSelectedQuestion(null)}
        title="Redactar Respuesta al Estudiante"
        maxWidth="lg"
      >
        {selectedQuestion && (
          <form onSubmit={handleSendAnswer} className="space-y-4">
            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-800">
                {selectedQuestion.student_name} preguntó sobre: "{selectedQuestion.subject}"
              </p>
              <p className="text-slate-600 italic">"{selectedQuestion.body}"</p>
            </div>

            {feedback && <p className="text-xs text-rose-600 font-medium">{feedback}</p>}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tu Respuesta:</label>
              <textarea
                required
                rows={4}
                value={answerBody}
                onChange={(e) => setAnswerBody(e.target.value)}
                placeholder="Escribe una explicación pedagógica clara para el alumno..."
                className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setSelectedQuestion(null)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isSubmitting} icon={<Send className="w-4 h-4" />}>
                Publicar Respuesta
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
