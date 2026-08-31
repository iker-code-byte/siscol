import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Course, Subject, AcademicYear } from '../../types';
import { School, BookOpen, Calendar, Plus } from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const AdminCourses: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [cData, sData, yData] = await Promise.all([
          api.getCourses(),
          api.getSubjects(),
          api.getAcademicYears(),
        ]);
        setCourses(Array.isArray(cData) ? cData : (cData as any)?.results || []);
        setSubjects(Array.isArray(sData) ? sData : (sData as any)?.results || []);
        setYears(Array.isArray(yData) ? yData : (yData as any)?.results || []);
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
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Estructura Académica</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Gestión de Años Escolares, Cursos, Paralelos y Malla Curricular de Materias.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cursos y Paralelos */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <School className="w-4 h-4 text-brand-600" />
            Cursos y Paralelos
          </h3>

          <Card className="p-0 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Año / Gestión</th>
                  <th className="px-6 py-3.5">Nombre del Curso</th>
                  <th className="px-6 py-3.5 text-center">Paralelo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {courses.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 text-slate-500">{c.academic_year_name || 'Gestión Actual'}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{c.name}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2.5 py-1 bg-brand-50 text-brand-800 rounded-lg font-bold">
                        {c.parallel}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        {/* Malla de Materias */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-sky-600" />
            Malla de Materias
          </h3>

          <Card className="p-0 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Código</th>
                  <th className="px-6 py-3.5">Nombre de la Materia</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-sky-700">{s.code}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{s.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </div>
  );
};
