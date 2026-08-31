import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Guardian, GuardianActivationCode } from '../../types';
import { KeyRound, Plus, Copy, Check, ShieldAlert, RefreshCw, Smartphone, UserCheck, Clock } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';

export const AdminGuardians: React.FC = () => {
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [codes, setCodes] = useState<GuardianActivationCode[]>([]);
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
      const [gData, cData] = await Promise.all([
        api.getGuardians(),
        api.getAdminGuardianCodes(),
      ]);
      const gList = Array.isArray(gData) ? gData : gData.results || [];
      const cList = Array.isArray(cData) ? cData : cData.results || [];
      setGuardians(gList);
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
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Gestión de Tutores y Códigos de Activación</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Emisión segura de códigos de vinculación temporal para la PWA de padres y tutores.
          </p>
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
          Generar Código de Activación
        </Button>
      </div>

      {/* Grid: Guardians List & Recent Codes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Guardians */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Padrón de Tutores</h3>
            <span className="text-xs text-slate-400">{guardians.length} registrados</span>
          </div>

          <Card className="p-0 overflow-hidden max-h-[600px] overflow-y-auto">
            <div className="divide-y divide-slate-100 text-xs">
              {guardians.map((g) => (
                <div key={g.id} className="p-4 hover:bg-slate-50 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900">{g.full_name}</h4>
                    <p className="text-[11px] text-slate-500">{g.phone || 'Sin teléfono registrado'}</p>
                    <span className="inline-block mt-1 text-[10px] bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full font-semibold">
                      {g.students_count || 0} alumno(s) vinculados
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-brand-600 hover:text-brand-700"
                    onClick={() => {
                      setSelectedGuardianId(g.id);
                      setGeneratedResult(null);
                      setError(null);
                      setIsModalOpen(true);
                    }}
                  >
                    Emitir código
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Generated Codes Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 tracking-tight">Historial de Códigos de Activación</h3>
            <Button variant="ghost" size="sm" onClick={fetchData} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Actualizar
            </Button>
          </div>

          <Card className="p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Tutor</th>
                    <th className="px-6 py-3.5">Expira en</th>
                    <th className="px-6 py-3.5 text-center">Estado</th>
                    <th className="px-6 py-3.5">Emitido por</th>
                    <th className="px-6 py-3.5 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {codes.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                        No hay códigos de activación emitidos recientemente.
                      </td>
                    </tr>
                  ) : (
                    codes.map((c) => {
                      const isExpired = new Date(c.expires_at) < new Date();
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{c.guardian_name}</td>
                          <td className="px-6 py-4 text-slate-500">
                            {new Date(c.expires_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-center">
                            {c.used_at ? (
                              <Badge variant="success">Usado / Vinculado</Badge>
                            ) : c.revoked_at ? (
                              <Badge variant="danger">Revocado</Badge>
                            ) : isExpired ? (
                              <Badge variant="default">Expirado</Badge>
                            ) : (
                              <Badge variant="warning">Válido / Pendiente</Badge>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-500">{c.created_by_name || 'Admin'}</td>
                          <td className="px-6 py-4 text-right">
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
