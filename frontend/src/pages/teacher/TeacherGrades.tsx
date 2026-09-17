import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../services/api';
import { 
  TeachingAssignment, AcademicPeriod, GradeActivity, 
  GradeMatrixData, GradeActivityType 
} from '../../types';
import { 
  FileSpreadsheet, Plus, Edit2, Trash2, CheckCircle2, 
  AlertCircle, Loader2, Lock, Save, Sparkles, Filter, 
  Calendar, Layers, BookOpen, UserCheck, ShieldAlert, Users
} from 'lucide-react';

import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

const ACTIVITY_TYPE_LABELS: Record<GradeActivityType, { label: string; color: string }> = {
  TASK: { label: 'Tarea', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  EXAM: { label: 'Examen', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  PRACTICE: { label: 'Práctica', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  PROJECT: { label: 'Proyecto', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  PRESENTATION: { label: 'Exposición', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  PARTICIPATION: { label: 'Participación', color: 'bg-rose-50 text-rose-700 border-rose-200' },
  OTHER: { label: 'Otro', color: 'bg-slate-50 text-slate-700 border-slate-200' },
};

export const TeacherGrades: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialAssignId = searchParams.get('assignment_id') || '';

  // Dropdown states
  const [assignments, setAssignments] = useState<TeachingAssignment[]>([]);
  const [selectedAssignId, setSelectedAssignId] = useState<string>(initialAssignId);
  const [periods, setPeriods] = useState<AcademicPeriod[]>([]);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');

  // Matrix state
  const [matrixData, setMatrixData] = useState<GradeMatrixData | null>(null);
  const [localScores, setLocalScores] = useState<Record<string, Record<string, string>>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [activityToEdit, setActivityToEdit] = useState<GradeActivity | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<GradeActivity | null>(null);
  const [isSubmittingActivity, setIsSubmittingActivity] = useState(false);

  // Activity Form Fields
  const [actName, setActName] = useState('');
  const [actType, setActType] = useState<GradeActivityType>('TASK');
  const [actDate, setActDate] = useState(new Date().toISOString().split('T')[0]);
  const [actMaxScore, setActMaxScore] = useState<number>(45);
  const [actDescription, setActDescription] = useState('');

  // Navigation & Debounce Refs
  const cellRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const debounceTimers = useRef<Record<string, NodeJS.Timeout>>({});

  // 1. Fetch Teacher Assignments & Periods on Mount
  useEffect(() => {
    const initData = async () => {
      try {
        const [assignData, periodData] = await Promise.all([
          api.getTeachingAssignments(),
          api.getAcademicPeriods(),
        ]);

        const assignList: TeachingAssignment[] = Array.isArray(assignData) ? assignData : assignData.results || [];
        setAssignments(assignList);
        if (!selectedAssignId && assignList.length > 0) {
          setSelectedAssignId(assignList[0].id);
        }

        const periodList: AcademicPeriod[] = Array.isArray(periodData) ? periodData : periodData.results || [];
        setPeriods(periodList);
        if (periodList.length > 0) {
          // Prefer open period, else first
          const openPeriod = periodList.find((p) => p.status === 'OPEN') || periodList[0];
          setSelectedPeriodId(openPeriod.id);
        }
      } catch (err) {
        console.error('Error inicializando asignaciones o periodos:', err);
      }
    };
    initData();
  }, []);

  // Current selected assignment
  const currentAssignment = useMemo(() => {
    return assignments.find((a) => a.id === selectedAssignId);
  }, [assignments, selectedAssignId]);

  // Current selected period
  const currentPeriod = useMemo(() => {
    return periods.find((p) => p.id === selectedPeriodId);
  }, [periods, selectedPeriodId]);

  // 2. Fetch or Create Gradebook Matrix
  const loadMatrix = async () => {
    if (!currentAssignment || !selectedPeriodId) return;

    setIsLoading(true);
    setSaveStatus('idle');
    try {
      // Get or create gradebook for this assignment + period
      const gradebook = await api.getOrCreateGradebook({
        academic_year_id: currentAssignment.academic_year,
        academic_period_id: selectedPeriodId,
        course_id: currentAssignment.course,
        subject_id: currentAssignment.subject,
      });

      // Load full matrix data
      const data: GradeMatrixData = await api.getGradebookMatrix(gradebook.id);
      setMatrixData(data);

      // Pre-fill local string inputs from numeric matrix
      const scoresMap: Record<string, Record<string, string>> = {};
      data.students.forEach((st) => {
        scoresMap[st.id] = {};
        data.activities.forEach((act) => {
          const val = data.matrix[st.id]?.[act.id];
          scoresMap[st.id][act.id] = val !== null && val !== undefined ? String(val) : '';
        });
      });
      setLocalScores(scoresMap);
    } catch (err: any) {
      setSaveStatus('error');
      setStatusMessage(err.message || 'Error al cargar la planilla de notas');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMatrix();
  }, [selectedAssignId, selectedPeriodId, assignments]);

  // 3. Dynamic Cell Editing & Keyboard Navigation
  const getCellKey = (studentId: string, activityId: string) => `${studentId}_${activityId}`;

  const handleCellKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    studentIdx: number,
    activityIdx: number
  ) => {
    if (!matrixData) return;
    const totalStudents = matrixData.students.length;
    const totalActivities = matrixData.activities.length;

    let targetStudentIdx = studentIdx;
    let targetActivityIdx = activityIdx;

    if (e.key === 'ArrowRight' || (e.key === 'Tab' && !e.shiftKey)) {
      if (activityIdx + 1 < totalActivities) {
        targetActivityIdx = activityIdx + 1;
        e.preventDefault();
      } else if (studentIdx + 1 < totalStudents) {
        targetStudentIdx = studentIdx + 1;
        targetActivityIdx = 0;
        e.preventDefault();
      }
    } else if (e.key === 'ArrowLeft' || (e.key === 'Tab' && e.shiftKey)) {
      if (activityIdx - 1 >= 0) {
        targetActivityIdx = activityIdx - 1;
        e.preventDefault();
      } else if (studentIdx - 1 >= 0) {
        targetStudentIdx = studentIdx - 1;
        targetActivityIdx = totalActivities - 1;
        e.preventDefault();
      }
    } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
      if (studentIdx + 1 < totalStudents) {
        targetStudentIdx = studentIdx + 1;
        e.preventDefault();
      }
    } else if (e.key === 'ArrowUp') {
      if (studentIdx - 1 >= 0) {
        targetStudentIdx = studentIdx - 1;
        e.preventDefault();
      }
    }

    if (targetStudentIdx !== studentIdx || targetActivityIdx !== activityIdx) {
      const targetStudent = matrixData.students[targetStudentIdx];
      const targetActivity = matrixData.activities[targetActivityIdx];
      if (targetStudent && targetActivity) {
        const key = getCellKey(targetStudent.id, targetActivity.id);
        cellRefs.current[key]?.focus();
        cellRefs.current[key]?.select();
      }
    }
  };

  // 4. Save Entry to Backend with Debounce
  const saveEntry = async (studentId: string, activityId: string, rawVal: string) => {
    setSaveStatus('saving');
    setStatusMessage('Guardando notas...');

    try {
      let scoreNum: number | null = null;
      if (rawVal.trim() !== '') {
        const parsed = parseFloat(rawVal);
        if (!isNaN(parsed)) {
          scoreNum = parsed;
        }
      }

      const res = await api.upsertGradeEntry({
        activity_id: activityId,
        student_id: studentId,
        score: scoreNum,
      });

      // Update matrixData averages & local matrix
      setMatrixData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          matrix: {
            ...prev.matrix,
            [studentId]: {
              ...(prev.matrix[studentId] || {}),
              [activityId]: res.score,
            },
          },
          averages: {
            ...prev.averages,
            [studentId]: {
              average: res.average,
              graded_count: res.graded_count,
              is_passing: res.is_passing,
            },
          },
        };
      });

      setSaveStatus('saved');
      setStatusMessage('✓ Todos los cambios guardados');
    } catch (err: any) {
      setSaveStatus('error');
      setStatusMessage(err.message || 'Error al guardar calificación');
    }
  };

  const handleScoreChange = (studentId: string, activityId: string, value: string) => {
    // 1. Update local input state immediately
    setLocalScores((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [activityId]: value,
      },
    }));

    // 2. Clear previous debounce timer for this cell
    const cellKey = getCellKey(studentId, activityId);
    if (debounceTimers.current[cellKey]) {
      clearTimeout(debounceTimers.current[cellKey]);
    }

    // 3. Queue new save (500ms debounce)
    debounceTimers.current[cellKey] = setTimeout(() => {
      saveEntry(studentId, activityId, value);
    }, 500);
  };

  const handleCellBlur = (studentId: string, activityId: string) => {
    const cellKey = getCellKey(studentId, activityId);
    if (debounceTimers.current[cellKey]) {
      clearTimeout(debounceTimers.current[cellKey]);
      const currentVal = localScores[studentId]?.[activityId] ?? '';
      saveEntry(studentId, activityId, currentVal);
    }
  };

  // 5. Activity Creation & Management
  const openCreateModal = () => {
    setActName('');
    setActType('TASK');
    setActDate(new Date().toISOString().split('T')[0]);
    setActMaxScore(45);
    setActDescription('');
    setIsCreateModalOpen(true);
  };

  const handleCreateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matrixData?.gradebook?.id || !actName.trim()) return;

    setIsSubmittingActivity(true);
    try {
      await api.createGradeActivity(matrixData.gradebook.id, {
        name: actName.trim(),
        activity_type: actType,
        activity_date: actDate,
        max_score: actMaxScore,
        description: actDescription.trim(),
      });
      setIsCreateModalOpen(false);
      await loadMatrix();
    } catch (err: any) {
      alert(err.message || 'Error al crear actividad');
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  const openEditModal = (act: GradeActivity) => {
    setActivityToEdit(act);
    setActName(act.name);
    setActType(act.activity_type);
    setActDate(act.activity_date);
    setActMaxScore(Number(act.max_score));
    setActDescription(act.description || '');
  };

  const handleUpdateActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityToEdit) return;

    setIsSubmittingActivity(true);
    try {
      await api.updateGradeActivity(activityToEdit.id, {
        name: actName.trim(),
        activity_type: actType,
        activity_date: actDate,
        max_score: actMaxScore,
        description: actDescription.trim(),
      });
      setActivityToEdit(null);
      await loadMatrix();
    } catch (err: any) {
      alert(err.message || 'Error al actualizar actividad');
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  const handleDeleteActivity = async () => {
    if (!activityToDelete) return;
    setIsSubmittingActivity(true);
    try {
      await api.deleteGradeActivity(activityToDelete.id);
      setActivityToDelete(null);
      await loadMatrix();
    } catch (err: any) {
      alert(err.message || 'Error al eliminar actividad');
    } finally {
      setIsSubmittingActivity(false);
    }
  };

  const isClosed = matrixData?.is_closed ?? (currentPeriod?.status === 'CLOSED');

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden">
      {/* Top Header & Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">
              Libro de Calificaciones (Bimestral)
            </h1>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            Planilla matricial interactiva tipo Excel. Registre y modifique notas en tiempo real con recálculo automático.
          </p>
        </div>

        {/* Real-time Save & Status Badge */}
        <div className="flex items-center gap-3">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full border border-amber-200 text-xs font-bold animate-pulse">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Guardando...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200 text-xs font-bold transition-all">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Guardado</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-full border border-rose-200 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              <span>Error al guardar</span>
            </div>
          )}

          {isClosed ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-full text-xs font-bold border border-slate-200">
              <Lock className="w-3.5 h-3.5" />
              <span>Periodo Cerrado (Solo Lectura)</span>
            </div>
          ) : (
            <Button
              onClick={openCreateModal}
              disabled={isLoading || !matrixData}
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl shadow-sm text-xs font-bold px-4 py-2"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Nueva Actividad
            </Button>
          )}
        </div>
      </div>

      {/* Control Bar: Selectors for Academic Year, Period, Course, Subject */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Assignment (Course & Subject) */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
            Asignación Docente
          </label>
          <select
            value={selectedAssignId}
            onChange={(e) => setSelectedAssignId(e.target.value)}
            className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
          >
            {assignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.course_name} {a.course_parallel} — {a.subject_name}
              </option>
            ))}
          </select>
        </div>

        {/* Academic Period (Bimestres) */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Bimestre / Periodo
          </label>
          <select
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
          >
            {periods.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} {p.status === 'CLOSED' ? '(Cerrado)' : p.status === 'OPEN' ? '(Abierto)' : '(Planificado)'}
              </option>
            ))}
          </select>
        </div>

        {/* Course Info Display */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
            Curso Matriculado
          </label>
          <div className="text-xs font-bold text-slate-700 bg-slate-100/70 border border-slate-200/70 rounded-2xl px-3.5 py-2.5">
            {currentAssignment ? `${currentAssignment.course_name} ${currentAssignment.course_parallel}` : '—'}
          </div>
        </div>

        {/* Subject Info Display */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            Materia
          </label>
          <div className="text-xs font-bold text-slate-700 bg-slate-100/70 border border-slate-200/70 rounded-2xl px-3.5 py-2.5">
            {currentAssignment?.subject_name || '—'}
          </div>
        </div>
      </div>

      {/* Main Gradebook Matrix (Excel Sheet) */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-xs font-semibold">Cargando libro de calificaciones...</p>
          </div>
        ) : !matrixData || matrixData.students.length === 0 ? (
          <div className="py-20 text-center px-4">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No hay estudiantes inscritos</p>
            <p className="text-xs text-slate-400 mt-1">
              No se encontraron alumnos activos para el curso seleccionado en este periodo.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto relative max-w-full">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600">
                  {/* Fixed Sticky Column 1: Index */}
                  <th className="sticky left-0 z-20 bg-slate-50 px-3 py-3 w-12 text-center font-bold border-r border-slate-200">
                    #
                  </th>

                  {/* Fixed Sticky Column 2: Student Name */}
                  <th className="sticky left-12 z-20 bg-slate-50 px-4 py-3 min-w-[200px] font-bold border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                    Estudiante
                  </th>

                  {/* Dynamic Activity Columns */}
                  {matrixData.activities.map((act, actIdx) => {
                    const badgeInfo = ACTIVITY_TYPE_LABELS[act.activity_type] || ACTIVITY_TYPE_LABELS.OTHER;
                    return (
                      <th
                        key={act.id}
                        className="px-3 py-2.5 min-w-[130px] max-w-[170px] border-r border-slate-200 font-medium group hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${badgeInfo.color}`}
                            >
                              {badgeInfo.label}
                            </span>
                            {!isClosed && (
                              <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
                                <button
                                  title="Editar actividad"
                                  onClick={() => openEditModal(act)}
                                  className="p-1 hover:bg-white rounded text-slate-500 hover:text-slate-800 shadow-sm"
                                >
                                  <Edit2 className="w-3 h-3" />
                                </button>
                                <button
                                  title="Eliminar actividad"
                                  onClick={() => setActivityToDelete(act)}
                                  className="p-1 hover:bg-white rounded text-rose-500 hover:text-rose-700 shadow-sm"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                          <span
                            className="font-bold text-slate-800 truncate"
                            title={act.name}
                          >
                            {act.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-semibold">
                            Máx: {act.max_score} pts
                          </span>
                        </div>
                      </th>
                    );
                  })}

                  {/* Add Activity Button Header Column */}
                  {!isClosed && (
                    <th className="px-3 py-3 w-16 text-center border-r border-slate-200">
                      <button
                        onClick={openCreateModal}
                        title="Agregar columna de actividad"
                        className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors inline-flex items-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </th>
                  )}

                  {/* Fixed Sticky Last Column: Average */}
                  <th className="sticky right-0 z-20 bg-slate-100/90 backdrop-blur-sm px-4 py-3 w-28 text-center font-black text-slate-800 border-l border-slate-200 shadow-[-2px_0_5px_rgba(0,0,0,0.03)]">
                    Promedio
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {matrixData.students.map((st, stIdx) => {
                  const studentAvg = matrixData.averages[st.id];
                  const hasAvg = studentAvg?.average !== null && studentAvg?.average !== undefined;
                  const isPassing = studentAvg?.is_passing;

                  return (
                    <tr
                      key={st.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Fixed Sticky Column 1: Index */}
                      <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50/70 px-3 py-2 text-center text-slate-400 font-bold border-r border-slate-100">
                        {stIdx + 1}
                      </td>

                      {/* Fixed Sticky Column 2: Student Name */}
                      <td className="sticky left-12 z-10 bg-white group-hover:bg-slate-50/70 px-4 py-2 font-bold text-slate-800 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.02)] truncate">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-slate-800">{st.full_name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{st.code}</span>
                        </div>
                      </td>

                      {/* Dynamic Activity Grade Cells */}
                      {matrixData.activities.map((act, actIdx) => {
                        const cellKey = getCellKey(st.id, act.id);
                        const currentVal = localScores[st.id]?.[act.id] ?? '';

                        return (
                          <td
                            key={act.id}
                            className="p-1 border-r border-slate-100 text-center relative"
                          >
                            <input
                              ref={(el) => (cellRefs.current[cellKey] = el)}
                              type="number"
                              step="0.5"
                              min="0"
                              max={Number(act.max_score)}
                              disabled={isClosed}
                              value={currentVal}
                              placeholder="—"
                              onChange={(e) => handleScoreChange(st.id, act.id, e.target.value)}
                              onBlur={() => handleCellBlur(st.id, act.id)}
                              onKeyDown={(e) => handleCellKeyDown(e, stIdx, actIdx)}
                              className={`w-full py-1.5 px-2 text-center font-mono font-bold text-xs rounded-xl transition-all border outline-none ${
                                isClosed
                                  ? 'bg-slate-50 text-slate-500 border-transparent cursor-not-allowed'
                                  : currentVal !== ''
                                  ? 'bg-white text-slate-800 border-slate-200 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:bg-emerald-50/20'
                                  : 'bg-transparent text-slate-400 border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-200'
                              }`}
                            />
                          </td>
                        );
                      })}

                      {/* Spacer Cell for Add Button Column */}
                      {!isClosed && (
                        <td className="p-1 border-r border-slate-100 text-center bg-slate-50/30">
                          {/* Empty spacer */}
                        </td>
                      )}

                      {/* Fixed Sticky Last Column: Average Display */}
                      <td className="sticky right-0 z-10 bg-slate-50 group-hover:bg-slate-100/80 px-4 py-2 text-center border-l border-slate-200 shadow-[-2px_0_5px_rgba(0,0,0,0.02)]">
                        {hasAvg ? (
                          <span
                            className={`inline-block font-mono font-black text-xs px-2.5 py-1 rounded-xl shadow-xs border ${
                              isPassing
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {studentAvg.average}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-bold">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Matrix Footer Toolbar */}
        <div className="p-4 bg-slate-50/80 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 text-slate-700 font-semibold">
              <span className="w-2 h-2 rounded-full bg-sky-500 inline-block"></span>
              Actividades: hasta 45 pts
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              Promedio Aprobado (&ge; 51/100 pts)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
              Promedio Bajo Rendimiento (&lt; 51/100 pts)
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="font-mono font-bold">—</span> Sin calificar (NULL no afecta promedio)
            </span>
          </div>
          <div className="text-[11px] text-slate-400">
            Navegación: <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded font-mono text-[10px]">TAB</kbd> o flechas entre celdas
          </div>
        </div>
      </div>

      {/* Modal: Create Activity */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Crear Nueva Actividad Calificada"
      >
        <form onSubmit={handleCreateActivity} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre de la Actividad *
            </label>
            <input
              type="text"
              required
              value={actName}
              onChange={(e) => setActName(e.target.value)}
              placeholder="Ej: Tarea 1 - Ecuaciones de 1er Grado"
              className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipo de Actividad
              </label>
              <select
                value={actType}
                onChange={(e) => setActType(e.target.value as GradeActivityType)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="TASK">Tarea</option>
                <option value="EXAM">Examen</option>
                <option value="PRACTICE">Práctica</option>
                <option value="PROJECT">Proyecto</option>
                <option value="PRESENTATION">Exposición</option>
                <option value="PARTICIPATION">Participación</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Puntaje Máximo
              </label>
              <input
                type="number"
                min="1"
                max="45"
                value={actMaxScore}
                onChange={(e) => setActMaxScore(parseFloat(e.target.value) || 45)}
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Fecha de la Actividad
            </label>
            <input
              type="date"
              value={actDate}
              onChange={(e) => setActDate(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descripción u Observaciones (Opcional)
            </label>
            <textarea
              rows={2}
              value={actDescription}
              onChange={(e) => setActDescription(e.target.value)}
              placeholder="Instrucciones breves o contenido evaluado..."
              className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              className="rounded-2xl text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingActivity || !actName.trim()}
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold px-4"
            >
              {isSubmittingActivity ? 'Creando...' : 'Crear Columna'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit Activity */}
      <Modal
        isOpen={!!activityToEdit}
        onClose={() => setActivityToEdit(null)}
        title="Editar Actividad Calificada"
      >
        <form onSubmit={handleUpdateActivity} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre de la Actividad *
            </label>
            <input
              type="text"
              required
              value={actName}
              onChange={(e) => setActName(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Tipo de Actividad
              </label>
              <select
                value={actType}
                onChange={(e) => setActType(e.target.value as GradeActivityType)}
                className="w-full text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="TASK">Tarea</option>
                <option value="EXAM">Examen</option>
                <option value="PRACTICE">Práctica</option>
                <option value="PROJECT">Proyecto</option>
                <option value="PRESENTATION">Exposición</option>
                <option value="PARTICIPATION">Participación</option>
                <option value="OTHER">Otro</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Puntaje Máximo
              </label>
              <input
                type="number"
                min="1"
                max="45"
                value={actMaxScore}
                onChange={(e) => setActMaxScore(parseFloat(e.target.value) || 45)}
                className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Fecha de la Actividad
            </label>
            <input
              type="date"
              value={actDate}
              onChange={(e) => setActDate(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Descripción u Observaciones
            </label>
            <textarea
              rows={2}
              value={actDescription}
              onChange={(e) => setActDescription(e.target.value)}
              className="w-full text-xs font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActivityToEdit(null)}
              className="rounded-2xl text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingActivity || !actName.trim()}
              className="bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl text-xs font-bold px-4"
            >
              {isSubmittingActivity ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal: Delete Confirmation */}
      <Modal
        isOpen={!!activityToDelete}
        onClose={() => setActivityToDelete(null)}
        title="Eliminar Actividad Calificada"
      >
        <div className="space-y-4">
          <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-900">
                ¿Está seguro de eliminar "{activityToDelete?.name}"?
              </p>
              <p className="text-xs text-rose-700 mt-1">
                {activityToDelete?.entries_count && activityToDelete.entries_count > 0
                  ? `Esta actividad tiene ${activityToDelete.entries_count} calificaciones registradas. Al eliminarla, las notas se excluirán del cálculo del promedio bimestral.`
                  : 'Esta actividad no tiene calificaciones registradas actualmente.'}
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActivityToDelete(null)}
              className="rounded-2xl text-xs font-bold"
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleDeleteActivity}
              disabled={isSubmittingActivity}
              className="bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold px-4"
            >
              {isSubmittingActivity ? 'Eliminando...' : 'Eliminar Actividad'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
