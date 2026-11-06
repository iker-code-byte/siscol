import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Question, TeachingAssignment } from '../../types';
import { HelpCircle, Plus, Send, Clock, BookOpen, UserCheck } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

const DEFAULT_PLATFORM_ASSIGNMENTS: TeachingAssignment[] = [
  {
    id: 'bae94d4a-3228-4934-a503-b8fb6af6017c',
    teacher: 'fff900d5-3f44-4da4-9a9f-06cb5c46f0f0',
    teacher_name: 'Carlos Mamani Rojas',
    course: '1ro-a',
    course_name: '1ro de Secundaria',
    course_parallel: 'A',
    subject: '6fb5368a-e7c4-4954-a6c9-07090583065e',
    subject_name: 'Matemáticas',
    subject_code: 'MAT-101',
    academic_year: '2026',
    academic_year_name: 'Gestión 2026',
    active: true,
  },
  {
    id: '080f5c33-a4f2-4889-86bc-bd12736fe5b4',
    teacher: '2a154ad0-1e0e-4745-a572-c2da0dfd6858',
    teacher_name: 'Elena Morales Gutiérrez',
    course: '1ro-a',
    course_name: '1ro de Secundaria',
    course_parallel: 'A',
    subject: '7ccf3fc2-b059-42bb-a495-517b87195f4c',
    subject_name: 'Lenguaje y Literatura',
    subject_code: 'LEN-101',
    academic_year: '2026',
    academic_year_name: 'Gestión 2026',
    active: true,
  },
  {
    id: 'cb9b98e0-8848-495d-993a-08f8a2c39ca5',
    teacher: 'e83c700e-a626-459f-acce-a8fd600ef29c',
    teacher_name: 'Jorge Salazar Peña',
    course: '1ro-a',
    course_name: '1ro de Secundaria',
    course_parallel: 'A',
    subject: 'e0842940-0c6b-4a27-8512-df4cee5a41e2',
    subject_name: 'Ciencias Naturales y Biología',
    subject_code: 'BIO-101',
    academic_year: '2026',
    academic_year_name: 'Gestión 2026',
    active: true,
  },
  {
    id: '1fcd5cb2-52aa-4b3d-9971-6a7720b44030',
    teacher: '6297c33e-9d3b-46a1-b6ea-bd27357a615e',
    teacher_name: 'Patricia Vaca Terrazas',
    course: '1ro-a',
    course_name: '1ro de Secundaria',
    course_parallel: 'A',
    subject: '9dabfef1-be15-4fd4-9fe2-85b3152eac77',
    subject_name: 'Ciencias Sociales e Historia',
    subject_code: 'SOC-101',
    academic_year: '2026',
    academic_year_name: 'Gestión 2026',
    active: true,
  },
  {
    id: 'a5f7e18c-ab58-40d5-ada1-e87e2f41a1f7',
    teacher: '8523e283-aee1-460b-b056-615a0f42cba4',
    teacher_name: 'Raúl Flores Mendoza',
    course: '1ro-a',
    course_name: '1ro de Secundaria',
    course_parallel: 'A',
    subject: 'dde4fdc6-639d-4a06-bcf3-cc7ff11f41ce',
    subject_name: 'Física y Química',
    subject_code: 'FIS-101',
    academic_year: '2026',
    academic_year_name: 'Gestión 2026',
    active: true,
  },
];

export const StudentQuestions: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [assignments, setAssignments] = useState<TeachingAssignment[]>(DEFAULT_PLATFORM_ASSIGNMENTS);
  const [isLoading, setIsLoading] = useState(true);

  // New question modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssignId, setSelectedAssignId] = useState(DEFAULT_PLATFORM_ASSIGNMENTS[0].id);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const [qRes, assignRes] = await Promise.allSettled([
        api.getStudentMeQuestions(),
        api.getTeachingAssignments(),
      ]);

      if (qRes.status === 'fulfilled') {
        const qData = qRes.value;
        setQuestions(Array.isArray(qData) ? qData : (qData as any)?.results || []);
      }

      if (assignRes.status === 'fulfilled') {
        const assignData = assignRes.value;
        const rawList: TeachingAssignment[] = Array.isArray(assignData)
          ? assignData
          : assignData?.results || [];
        if (rawList.length > 0) {
          // Deduplicate by subject_code + course so each teacher/subject appears once cleanly
          const seen = new Set<string>();
          const cleanList: TeachingAssignment[] = [];
          for (const item of rawList) {
            const key = `${item.course}-${item.subject_code || item.subject_name}`;
            if (!seen.has(key)) {
              seen.add(key);
              cleanList.push(item);
            }
          }
          setAssignments(cleanList);
          setSelectedAssignId(cleanList[0].id);
        }
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

  const selectedAssignment = assignments.find((a) => a.id === selectedAssignId) || assignments[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Mis Consultas y Preguntas</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Selecciona a tu docente de materia para enviarle tus dudas pedagógicas y revisar sus respuestas.
          </p>
        </div>

        <Button
          variant="primary"
          className="bg-sky-600 hover:bg-sky-700"
          onClick={() => {
            setFeedback(null);
            setIsModalOpen(true);
          }}
          icon={<Plus className="w-4 h-4" />}
        >
          Hacer una Pregunta
        </Button>
      </div>

      {/* Docentes de la Plataforma Disponibles para Consultar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-600" />
            Docentes Disponibles para Consultas ({assignments[0]?.course_name || 'Secundaria'} — Paralelo {assignments[0]?.course_parallel || 'A'})
          </h3>
          <span className="text-[11px] text-slate-500 font-medium">
            Haz clic en cualquier docente para enviarle una pregunta directa
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {assignments.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => {
                setSelectedAssignId(a.id);
                setFeedback(null);
                setIsModalOpen(true);
              }}
              className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/80 hover:bg-sky-50 hover:border-sky-400 transition-all text-left group cursor-pointer"
            >
              <div className="pr-2">
                <div className="text-xs font-bold text-slate-900 group-hover:text-sky-900">
                  Prof. {a.teacher_name}
                </div>
                <div className="text-[11px] font-medium text-sky-700 mt-0.5">
                  📚 {a.subject_name}
                </div>
              </div>
              <span className="shrink-0 text-[11px] font-bold text-sky-600 bg-white px-3 py-1.5 rounded-lg border border-sky-200 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                Preguntar
              </span>
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Card className="text-center py-12 text-slate-400 text-xs">Cargando consultas...</Card>
      ) : questions.length === 0 ? (
        <Card className="text-center py-12 text-slate-400">
          <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">Aún no tienes preguntas enviadas</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Elige uno de los docentes de arriba o presiona el botón para enviar tu primera consulta.
          </p>
          <Button
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={() => {
              setFeedback(null);
              setIsModalOpen(true);
            }}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Nueva Consulta al Docente
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
                    {q.teacher_name && (
                      <span className="text-xs text-slate-500 font-medium">• Prof. {q.teacher_name}</span>
                    )}
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
          {feedback && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
              {feedback}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              1. Selecciona el Docente y Materia
            </label>
            <select
              value={selectedAssignId}
              onChange={(e) => setSelectedAssignId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              {assignments.map((a) => (
                <option key={a.id} value={a.id}>
                  Prof. {a.teacher_name} — {a.subject_name} ({a.course_name} {a.course_parallel})
                </option>
              ))}
            </select>

            {/* Quick teacher pills inside modal */}
            <div className="grid grid-cols-1 gap-1.5 mt-2.5 max-h-44 overflow-y-auto pr-1">
              {assignments.map((a) => {
                const isSelected = a.id === selectedAssignId;
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => setSelectedAssignId(a.id)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-sky-50 border-sky-500 text-sky-950 ring-1 ring-sky-500'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">Prof. {a.teacher_name}</span>
                      <span className="text-[11px] text-slate-500">{a.subject_name}</span>
                    </div>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                        <UserCheck className="w-3 h-3" /> Seleccionado
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedAssignment && (
            <div className="px-3.5 py-2.5 rounded-xl bg-sky-50/80 border border-sky-200 text-xs text-sky-900 flex items-center justify-between">
              <span>
                Dirigido a: <strong>Prof. {selectedAssignment.teacher_name}</strong>
              </span>
              <span className="text-[11px] font-semibold text-sky-700">
                {selectedAssignment.subject_name}
              </span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">2. Asunto / Tema de la Consulta</label>
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
            <label className="block text-xs font-bold text-slate-700 mb-1.5">3. Detalle de tu Pregunta</label>
            <textarea
              required
              rows={4}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribe tu consulta para el docente con el mayor detalle posible..."
              className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              className="bg-sky-600 hover:bg-sky-700"
              icon={<Send className="w-4 h-4" />}
            >
              Enviar Pregunta al Docente
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
