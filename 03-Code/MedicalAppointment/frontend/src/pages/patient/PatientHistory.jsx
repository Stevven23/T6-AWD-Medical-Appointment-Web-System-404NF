import { useMemo, useState, useEffect } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { MedicalRecordModel } from '../../models';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import {
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  HeartIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';

export default function PatientHistory() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [medicalRecord, setMedicalRecord] = useState(null);
  const [consultationNotes, setConsultationNotes] = useState([]);

  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadMedicalHistory();
  }, []);

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Cargar registro médico general
      const recordResponse = await MedicalRecordModel.get();
      setMedicalRecord(recordResponse.data || recordResponse);

      // Cargar notas de consultas
      const notesResponse = await MedicalRecordModel.getConsultationNotes();
      const notesData = notesResponse.data || notesResponse;
      setConsultationNotes(Array.isArray(notesData) ? notesData : []);
    } catch (e) {
      console.error('Error loading medical history:', e);
      setError('Error al cargar el historial médico.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return 'Fecha no válida';
    return d.toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString) => {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return 'Fecha no válida';
    return d.toLocaleString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const years = useMemo(() => {
    const ys = new Set();
    consultationNotes.forEach((r) => {
      const d = new Date(r.scheduled_start);
      if (!Number.isNaN(d.getTime())) ys.add(String(d.getFullYear()));
    });
    return Array.from(ys).sort((a, b) => Number(b) - Number(a));
  }, [consultationNotes]);

  const specialties = useMemo(() => {
    const specs = new Set();
    consultationNotes.forEach((r) => {
      if (r.specialty_name) specs.add(r.specialty_name);
    });
    return Array.from(specs).sort();
  }, [consultationNotes]);

  const filteredHistory = useMemo(() => {
    const s = search.trim().toLowerCase();

    return consultationNotes.filter((r) => {
      const d = new Date(r.scheduled_start);
      const rYear = !Number.isNaN(d.getTime()) ? String(d.getFullYear()) : '';

      const doctor = `${r.doctor_first_name || ''} ${r.doctor_last_name || ''}`
        .trim()
        .toLowerCase();
      const specialtyName = (r.specialty_name || '').toLowerCase();
      const diagnosis = (r.diagnosis || '').toLowerCase();
      const notes = (r.notes || '').toLowerCase();

      const matchesSearch = !s || doctor.includes(s) || specialtyName.includes(s) || diagnosis.includes(s) || notes.includes(s);
      const matchesYear = !year || rYear === year;
      const matchesSpecialty = !specialty || r.specialty_name === specialty;

      return matchesSearch && matchesYear && matchesSpecialty;
    });
  }, [consultationNotes, search, year, specialty]);

  // Generar PDF individual de una consulta
  const generateConsultationPDF = (note) => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Colores corporativos
    const primaryColor = [41, 128, 185]; // Azul
    const secondaryColor = [52, 73, 94]; // Gris oscuro
    const accentColor = [46, 204, 113]; // Verde

    // Encabezado con fondo
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 45, 'F');

    // Logo/Nombre de la clínica
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.text('CLÍNICA SAN MIGUEL', margin, 20);
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('Centro Médico Especializado', margin, 28);
    pdf.text('Tel: (02) 2XXX-XXXX | Email: info@clinicasanmiguel.ec', margin, 34);

    // Título del documento
    y = 55;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text('INFORME DE CONSULTA MÉDICA', margin, y);
    
    // Línea decorativa
    y += 3;
    pdf.setDrawColor(...accentColor);
    pdf.setLineWidth(1);
    pdf.line(margin, y, pageWidth - margin, y);

    // Información del paciente
    y += 12;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
    
    y += 8;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text('DATOS DEL PACIENTE', margin + 5, y);
    
    y += 7;
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Paciente: ${user.first_name} ${user.last_name}`, margin + 5, y);
    
    y += 6;
    const consultDate = formatDateTime(note.scheduled_start);
    pdf.text(`Fecha de Consulta: ${consultDate}`, margin + 5, y);

    // Información del médico
    y += 12;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
    
    y += 8;
    pdf.setFont(undefined, 'bold');
    pdf.text('DATOS DEL MÉDICO', margin + 5, y);
    
    y += 7;
    pdf.setFont(undefined, 'normal');
    const doctorName = `Dr. ${note.doctor_first_name} ${note.doctor_last_name}`;
    pdf.text(`Médico Tratante: ${doctorName}`, margin + 5, y);
    
    y += 6;
    pdf.text(`Especialidad: ${note.specialty_name || 'Medicina General'}`, margin + 5, y);

    // Contenido del informe
    y += 15;
    
    // Diagnóstico
    if (note.diagnosis) {
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text('DIAGNÓSTICO', margin, y);
      y += 7;
      
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const diagLines = pdf.splitTextToSize(note.diagnosis, pageWidth - 2 * margin - 10);
      diagLines.forEach(line => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, margin + 5, y);
        y += 6;
      });
      y += 5;
    }

    // Notas clínicas
    if (note.notes) {
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text('OBSERVACIONES CLÍNICAS', margin, y);
      y += 7;
      
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const notesLines = pdf.splitTextToSize(note.notes, pageWidth - 2 * margin - 10);
      notesLines.forEach(line => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, margin + 5, y);
        y += 6;
      });
      y += 5;
    }

    // Plan de tratamiento
    if (note.treatment_plan) {
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text('PLAN DE TRATAMIENTO', margin, y);
      y += 7;
      
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const treatLines = pdf.splitTextToSize(note.treatment_plan, pageWidth - 2 * margin - 10);
      treatLines.forEach(line => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, margin + 5, y);
        y += 6;
      });
      y += 5;
    }

    // Prescripciones
    if (note.prescriptions_given) {
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text('MEDICAMENTOS PRESCRITOS', margin, y);
      y += 7;
      
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const prescLines = pdf.splitTextToSize(note.prescriptions_given, pageWidth - 2 * margin - 10);
      prescLines.forEach(line => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, margin + 5, y);
        y += 6;
      });
      y += 5;
    }

    // Seguimiento
    if (note.follow_up_required && note.follow_up_date) {
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text('SEGUIMIENTO', margin, y);
      y += 7;
      
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Próxima cita de control: ${formatDate(note.follow_up_date)}`, margin + 5, y);
      y += 10;
    }

    // Pie de página
    const totalPages = pdf.internal.pages.length - 1;
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, 285, { align: 'center' });
      pdf.text('Este es un documento médico confidencial', pageWidth / 2, 290, { align: 'center' });
    }

    // Abrir en nueva pestaña
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  // Descargar historial completo
  const downloadFullHistory = () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    const primaryColor = [41, 128, 185];
    const secondaryColor = [52, 73, 94];

    // Portada
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, pdf.internal.pageSize.getHeight(), 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(28);
    pdf.setFont(undefined, 'bold');
    pdf.text('HISTORIAL MÉDICO', pageWidth / 2, 100, { align: 'center' });

    pdf.setFontSize(16);
    pdf.setFont(undefined, 'normal');
    pdf.text(`${user.first_name} ${user.last_name}`, pageWidth / 2, 120, { align: 'center' });

    pdf.setFontSize(12);
    pdf.text(`Generado el: ${formatDate(new Date().toISOString())}`, pageWidth / 2, 135, { align: 'center' });

    // Agregar página para registro médico
    if (medicalRecord) {
      pdf.addPage();
      y = 20;

      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text('REGISTRO MÉDICO GENERAL', margin, y);
      y += 10;

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');

      const addSection = (title, content) => {
        if (content && y < 270) {
          pdf.setFont(undefined, 'bold');
          pdf.text(title, margin, y);
          y += 6;
          pdf.setFont(undefined, 'normal');
          const lines = pdf.splitTextToSize(content, pageWidth - 2 * margin);
          lines.forEach(line => {
            if (y > 270) {
              pdf.addPage();
              y = 20;
            }
            pdf.text(line, margin, y);
            y += 5;
          });
          y += 5;
        }
      };

      addSection('Alergias:', medicalRecord.allergies || 'No registradas');
      addSection('Condiciones Médicas:', medicalRecord.medical_conditions || 'Ninguna');
      addSection('Medicamentos Actuales:', medicalRecord.current_medications || 'Ninguno');
      addSection('Diagnósticos:', medicalRecord.diagnoses || 'Sin diagnósticos');
      addSection('Tratamientos:', medicalRecord.treatments || 'Sin tratamientos');
      addSection('Historial:', medicalRecord.medical_history || 'Sin historial');
    }

    // Agregar consultas
    filteredHistory.forEach((note, index) => {
      pdf.addPage();
      y = 20;

      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text(`CONSULTA #${index + 1}`, margin, y);
      y += 10;

      pdf.setFontSize(10);
      pdf.text(`Fecha: ${formatDateTime(note.scheduled_start)}`, margin, y);
      y += 6;
      pdf.text(`Doctor: Dr. ${note.doctor_first_name} ${note.doctor_last_name}`, margin, y);
      y += 6;
      pdf.text(`Especialidad: ${note.specialty_name || 'N/A'}`, margin, y);
      y += 10;

      pdf.setFont(undefined, 'normal');

      const addNoteSection = (title, content) => {
        if (content) {
          pdf.setFont(undefined, 'bold');
          pdf.text(title, margin, y);
          y += 6;
          pdf.setFont(undefined, 'normal');
          const lines = pdf.splitTextToSize(content, pageWidth - 2 * margin);
          lines.forEach(line => {
            if (y > 270) {
              pdf.addPage();
              y = 20;
            }
            pdf.text(line, margin, y);
            y += 5;
          });
          y += 5;
        }
      };

      addNoteSection('Diagnóstico:', note.diagnosis);
      addNoteSection('Notas:', note.notes);
      addNoteSection('Plan de Tratamiento:', note.treatment_plan);
      addNoteSection('Prescripciones:', note.prescriptions_given);
    });

    pdf.save(`historial-medico-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600"></div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <ClipboardDocumentListIcon className="h-8 w-8" />
                Historial Médico
              </h1>
              <p className="mt-2 opacity-90">
                Consulta el historial completo de tus consultas y registros médicos
              </p>
            </div>
            <button
              onClick={downloadFullHistory}
              disabled={filteredHistory.length === 0}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              type="button"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              Descargar Historial Completo
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Filtros de Búsqueda</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por doctor, especialidad o diagnóstico..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="relative">
              <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="">Todos los años</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all appearance-none"
              >
                <option value="">Todas las especialidades</option>
                {specialties.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
            <span className="text-sm font-semibold text-blue-700">Total de registros encontrados</span>
            <span className="text-2xl font-bold text-blue-700">{filteredHistory.length}</span>
          </div>
        </div>

        {/* Registro Médico General */}
        {medicalRecord && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                <DocumentTextIcon className="h-7 w-7" />
                Registro Médico General
              </h2>
              {medicalRecord.updated_at && (
                <p className="text-blue-100 mt-1 text-sm flex items-center gap-2">
                  <ClockIcon className="h-4 w-4" />
                  Última actualización: {formatDateTime(medicalRecord.updated_at)}
                </p>
              )}
            </div>

            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InfoCard
                icon={<ExclamationTriangleIcon className="h-6 w-6" />}
                title="Alergias"
                content={medicalRecord.allergies}
                colorClass="bg-red-50 border-red-200"
                iconColorClass="text-red-600"
              />
              <InfoCard
                icon={<HeartIcon className="h-6 w-6" />}
                title="Condiciones Médicas"
                content={medicalRecord.medical_conditions}
                colorClass="bg-purple-50 border-purple-200"
                iconColorClass="text-purple-600"
              />
              <InfoCard
                icon={<BeakerIcon className="h-6 w-6" />}
                title="Medicamentos Actuales"
                content={medicalRecord.current_medications}
                colorClass="bg-green-50 border-green-200"
                iconColorClass="text-green-600"
              />
              <InfoCard
                icon={<DocumentTextIcon className="h-6 w-6" />}
                title="Diagnósticos"
                content={medicalRecord.diagnoses}
                colorClass="bg-blue-50 border-blue-200"
                iconColorClass="text-blue-600"
              />
              <InfoCard
                icon={<ClipboardDocumentListIcon className="h-6 w-6" />}
                title="Tratamientos"
                content={medicalRecord.treatments}
                colorClass="bg-yellow-50 border-yellow-200"
                iconColorClass="text-yellow-600"
              />
              <InfoCard
                icon={<ClockIcon className="h-6 w-6" />}
                title="Historial Médico"
                content={medicalRecord.medical_history}
                colorClass="bg-gray-50 border-gray-200"
                iconColorClass="text-gray-600"
                fullWidth
              />
            </div>
          </div>
        )}

        {/* Timeline de Consultas */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
            <CalendarIcon className="h-7 w-7 text-blue-600" />
            Historial de Consultas
          </h2>

          {filteredHistory.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay registros médicos</h3>
              <p className="text-gray-600">
                {search || year || specialty
                  ? 'No se encontraron consultas con los filtros aplicados.'
                  : 'Aún no tienes consultas médicas registradas en tu historial.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHistory.map((note, index) => (
                <ConsultationCard
                  key={note.id}
                  note={note}
                  index={index}
                  formatDate={formatDateTime}
                  onViewPDF={() => generateConsultationPDF(note)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PatientLayout>
  );
}

// Componente auxiliar para tarjetas de información
function InfoCard({ icon, title, content, colorClass, iconColorClass, fullWidth = false }) {
  return (
    <div className={`${colorClass} ${fullWidth ? 'md:col-span-2 lg:col-span-3' : ''} border rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <div className={`${iconColorClass} flex-shrink-0`}>{icon}</div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 mb-1">{title}</h3>
          <p className="text-gray-700 text-sm whitespace-pre-wrap break-words">
            {content || <span className="text-gray-400 italic">No registrado</span>}
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente auxiliar para tarjetas de consulta
function ConsultationCard({ note, index, formatDate, onViewPDF }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
      <div className="bg-gradient-to-r from-blue-50 to-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {note.diagnosis || 'Consulta Médica'}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <CalendarIcon className="h-5 w-5 text-blue-600" />
                <span>{formatDate(note.scheduled_start)}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <UserIcon className="h-5 w-5 text-blue-600" />
                <span>Dr. {note.doctor_first_name} {note.doctor_last_name}</span>
              </div>

              <div className="flex items-center gap-2 text-gray-700">
                <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                <span>{note.specialty_name || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onViewPDF}
              className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              title="Ver PDF"
            >
              <EyeIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              {expanded ? '−' : '+'}
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="p-5 bg-white border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {note.notes && (
              <DetailSection title="Observaciones Clínicas" content={note.notes} />
            )}
            {note.treatment_plan && (
              <DetailSection title="Plan de Tratamiento" content={note.treatment_plan} />
            )}
            {note.prescriptions_given && (
              <DetailSection title="Medicamentos Prescritos" content={note.prescriptions_given} />
            )}
            {note.follow_up_required && note.follow_up_date && (
              <DetailSection 
                title="Seguimiento" 
                content={`Próxima cita: ${new Date(note.follow_up_date).toLocaleDateString('es-EC')}`} 
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function DetailSection({ title, content }) {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
      <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
      <p className="text-gray-700 text-sm whitespace-pre-line">{content}</p>
    </div>
  );
}
