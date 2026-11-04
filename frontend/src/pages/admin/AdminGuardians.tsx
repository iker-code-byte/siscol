import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Guardian, GuardianActivationCode, StudentGuardian, Course } from '../../types';
import { KeyRound, Plus, Copy, Check, RefreshCw, School, Search } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const AdminGuardians: React.FC = () => {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [links, setLinks] = useState<StudentGuardian[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [codes, setCodes] = useState<GuardianActivationCode[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  // Generate code modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuardianId, setSelectedGuardianId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{ plain_code: string; guardian_name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [gData, sgData, crData, cData] = await Promise.all([
        api.getGuardians(),
        api.getStudentGuardians(),
        api.getCourses(),
        api.getAdminGuardianCodes(),
      ]);
      const gList = Array.isArray(gData) ? gData : gData.results || [];
      const sgList = Array.isArray(sgData) ? sgData : sgData.results || [];
      const crList = Array.isArray(crData) ? crData : crData.results || [];
      const cList = Array.isArray(cData) ? cData : cData.results || [];
      setGuardians(gList);
      setLinks(sgList);
      setCourses(crList);
      setCodes(cList);
      if (gList.length > 0 && !selectedGuardianId) {
        setSelectedGuardianId(gList[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredLinks = links.filter((item) => {
    const matchesCourse = selectedCourseId === 'ALL' || item.course_id === selectedCourseId;
    if (!matchesCourse) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (item.guardian_name || '').toLowerCase().includes(q) ||
      (item.guardian_phone || '').toLowerCase().includes(q) ||
      (item.student_name || '').toLowerCase().includes(q) ||
      (item.student_code || '').toLowerCase().includes(q)
    );
  });

  const shortCourseLabel = (c: Course) => {
    const firstWord = c.name.split(' ')[0];
    return `${firstWord} ${c.parallel}`;
  };

  const handleGenerateCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuardianId) return;

    setIsGenerating(true);
    setError(null);
    setCopied(false);

    try {
      const res = await api.generateGuardianCode(selectedGuardianId);
      setGeneratedResult({
        plain_code: res.plain_code,
        guardian_name: res.guardian.full_name,
      });
      fetchData();
    } catch (err: any) {
      setError(err.message || 'Error al generar código.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyCode = () => {
    if (!generatedResult) return;
    navigator.clipboard.writeText(generatedResult.plain_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleRevokeCode = async (codeId: string) => {
    if (window.confirm('¿Está seguro de revocar este código? Ya no podrá ser utilizado.')) {
      try {
        await api.revokeGuardianCode(codeId);
        fetchData();
      } catch (err: any) {
        alert(err.message || 'Error al revocar código.');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Padres de Familia por Curso y Paralelo ({filteredLinks.length})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Padrón de padres y tutores separados por paralelo ({links.length} registros en paralelos, {guardians.length} tutores únicos) y emisión de códigos PWA.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar padre, CI o alumno..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-xs"
            />
          </div>

          <Button
            variant="primary"
            onClick={() => {
              setGeneratedResult(null);
              setError(null);
              setIsModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            Generar Código
          </Button>
        </div>
      </div>

      {/* Selector de Curso y Paralelo */}
      {courses.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 mb-2">
            <School className="w-4 h-4 text-brand-600" />
            <span>Separar Padres de Familia por Curso y Paralelo:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setSelectedCourseId('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                selectedCourseId === 'ALL'
                  ? 'bg-brand-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Todos ({links.length})
            </button>
            {courses.map((c) => {
              const isSelected = selectedCourseId === c.id;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCourseId(c.id)}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    isSelected
                      ? 'bg-brand-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {shortCourseLabel(c)}{' '}
                  <span className={isSelected ? 'text-brand-100' : 'text-slate-400'}>
                    ({c.students_count ?? 0})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Grid: Guardians by Parallel & Recent Codes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left/Center Column: Guardians separated by Parallel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 tracking-tight">
              Lista de Padres / Tutores ({filteredLinks.length})
            </h3>
            <span className="text-xs text-slate-400">
              {selectedCourseId === 'ALL' ? 'Todos los paralelos' : 'Filtrado por paralelo'}
            </span>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3.5 w-10 text-center">N°</th>
                    <th className="px-4 py-3.5">Curso / Paralelo</th>
                    <th className="px-4 py-3.5">Padre / Madre / Tutor</th>
                    <th className="px-4 py-3.5">Estudiante Vinculado</th>
                    <th className="px-4 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        Cargando padres de familia...
                      </td>
                    </tr>
                  ) : filteredLinks.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        No se encontraron padres para este filtro.
                      </td>
                    </tr>
                  ) : (
                    filteredLinks.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 text-center font-semibold text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block bg-brand-50 text-brand-800 font-bold px-2.5 py-1 rounded-lg">
                            {item.course_name} - {item.course_parallel}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900">{item.guardian_name}</div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[11px] font-mono text-slate-500">
                              {item.guardian_phone || 'Sin CI'}
                            </span>
                            <span className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
                              {item.relationship_display || item.relationship}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-800">{item.student_name}</div>
                          <div className="text-[11px] font-mono text-slate-400">
                            RUDE: {item.student_code}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-brand-600 hover:text-brand-700"
                            onClick={() => {
                              setSelectedGuardianId(item.guardian);
                              setGeneratedResult(null);
                              setError(null);
                              setIsModalOpen(true);
                            }}
                          >
                            Emitir código
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Column: Generated Codes Table */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Historial de Códigos</h3>
            <Button variant="ghost" size="sm" onClick={fetchData} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Actualizar
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-3.5">Tutor</th>
                    <th className="px-4 py-3.5 text-center">Estado</th>
                    <th className="px-4 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {codes.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-400">
                        No hay códigos de activación emitidos recientemente.
                      </td>
                    </tr>
                  ) : (
                    codes.map((c) => {
                      const isExpired = new Date(c.expires_at) < new Date();
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{c.guardian_name}</div>
                            <div className="text-[10px] text-slate-400">
                              Exp: {new Date(c.expires_at).toLocaleString()}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {c.used_at ? (
                              <Badge variant="success">Vinculado</Badge>
                            ) : c.revoked_at ? (
                              <Badge variant="danger">Revocado</Badge>
                            ) : isExpired ? (
                              <Badge variant="default">Expirado</Badge>
                            ) : (
                              <Badge variant="warning">Pendiente</Badge>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {c.is_valid && (
                              <Button
                                size="sm"
                                variant="danger"
                                className="text-[11px] py-1 px-2.5"
                                onClick={() => handleRevokeCode(c.id)}
                              >
                                Revocar
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>

      {/* Modal: Generate Code */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Generar Código de Activación de Tutor"
      >
        {!generatedResult ? (
          <form onSubmit={handleGenerateCode} className="space-y-4">
            {error && <p className="text-xs text-rose-600 font-medium">{error}</p>}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Seleccionar Tutor</label>
              <select
                value={selectedGuardianId}
                onChange={(e) => setSelectedGuardianId(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {guardians.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.full_name} ({g.phone || 'Sin tel.'})
                  </option>
                ))}
              </select>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              El código generado tendrá una vigencia de 24 horas y solo puede ser utilizado una sola vez para vincular un dispositivo.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isGenerating} icon={<KeyRound className="w-4 h-4" />}>
                Generar Código
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-5 text-center py-2">
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-2xl border border-emerald-100 text-xs">
              Código emitido exitosamente para <strong className="font-bold">{generatedResult.guardian_name}</strong>
            </div>

            <div className="p-6 bg-slate-900 text-white rounded-3xl shadow-inner border border-slate-800">
              <span className="text-[10px] uppercase font-semibold tracking-widest text-brand-400 block mb-1">
                Código de Activación
              </span>
              <span className="text-3xl md:text-4xl font-extrabold font-mono tracking-widest text-amber-400">
                {generatedResult.plain_code}
              </span>
            </div>

            <Button
              variant="outline"
              size="md"
              className="w-full justify-center"
              onClick={handleCopyCode}
              icon={copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            >
              {copied ? '¡Código Copiado al Portapapeles!' : 'Copiar Código de Activación'}
            </Button>

            <p className="text-xs text-slate-400 text-left bg-slate-50 p-3 rounded-xl">
              <strong>Instrucciones para el tutor:</strong> Indíquele que ingrese a la aplicación web (PWA), elija la opción "Vincular Dispositivo" e ingrese este código.
            </p>

            <Button variant="primary" size="sm" className="w-full justify-center" onClick={() => setIsModalOpen(false)}>
              Listo / Cerrar
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};
