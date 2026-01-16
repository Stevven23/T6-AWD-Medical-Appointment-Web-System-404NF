import { useState, useEffect } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { prescriptionAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import {
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  BeakerIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from '@heroicons/react/24/outline';

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active' o 'history'
  const [error, setError] = useState('');

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await prescriptionAPI.getPatientPrescriptions();
      const data = Array.isArray(response.data) ? response.data : [];
      
      // Procesar prescripciones con estado activo/expirado
      const processedPrescriptions = data.map(prescription => ({
        ...prescription,
        isActive: checkIsActive(prescription),
        daysUntilExpiry: calculateDaysUntilExpiry(prescription),
        statusInfo: getStatusInfo(prescription)
      }));
      
      setPrescriptions(processedPrescriptions);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
      setError('Error al cargar las recetas médicas');
    } finally {
      setLoading(false);
    }
  };

  // Helper para procesar saltos de línea
  const processLineBreaks = (text) => {
    if (!text) return '';
    // Reemplaza \n literal (como string) con saltos de línea reales
    return text.replace(/\\n/g, '\n');
  };

  const checkIsActive = (prescription) => {
    if (!prescription.created_at || !prescription.duration) return false;
    const expiryDate = calculateExpiryDate(prescription.created_at, parseInt(prescription.duration) || 90);
    return new Date() < expiryDate;
  };

  const calculateExpiryDate = (startDate, durationDays) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + durationDays);
    return date;
  };

  const calculateDaysUntilExpiry = (prescription) => {
    if (!prescription.created_at || !prescription.duration) return 0;
    const expiryDate = calculateExpiryDate(prescription.created_at, parseInt(prescription.duration) || 90);
    const today = new Date();
    return Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
  };

  const getStatusInfo = (prescription) => {
    const isActive = checkIsActive(prescription);
    const daysUntilExpiry = calculateDaysUntilExpiry(prescription);

    if (!isActive) {
      return { class: 'expired', label: 'Vencida', color: 'red' };
    }
    
    if (daysUntilExpiry <= 30) {
      return { class: 'expiring', label: 'Por Vencer', color: 'yellow' };
    }
    
    return { class: 'active', label: 'Activa', color: 'green' };
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    if (activeTab === 'active') {
      return prescription.isActive;
    } else {
      return !prescription.isActive;
    }
  });

  // Generar PDF de una receta
  const downloadPrescription = (prescription) => {
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

    // Encabezado
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 45, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.text('CLÍNICA SAN MIGUEL', margin, 20);
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('Centro Médico Especializado', margin, 28);
    pdf.text('Tel: (02) 2XXX-XXXX | Email: info@clinicasanmiguel.ec', margin, 34);

    // Título
    y = 55;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text('RECETA MÉDICA', margin, y);
    
    y += 3;
    pdf.setDrawColor(46, 204, 113);
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
    pdf.text('PACIENTE', margin + 5, y);
    
    y += 7;
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Nombre: ${user.first_name} ${user.last_name}`, margin + 5, y);
    
    y += 6;
    pdf.text(`Fecha de emisión: ${formatDate(prescription.created_at)}`, margin + 5, y);

    // Información del médico
    y += 12;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
    
    y += 8;
    pdf.setFont(undefined, 'bold');
    pdf.text('MÉDICO TRATANTE', margin + 5, y);
    
    y += 7;
    pdf.setFont(undefined, 'normal');
    pdf.text(`Dr. ${prescription.doctor_first_name} ${prescription.doctor_last_name}`, margin + 5, y);
    
    y += 6;
    pdf.text(`Especialidad: ${prescription.specialty_name || 'N/A'}`, margin + 5, y);

    // Prescripción
    y += 15;
    pdf.setFillColor(240, 248, 255);
    pdf.rect(margin, y, pageWidth - 2 * margin, 80, 'F');
    
    y += 8;
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...primaryColor);
    pdf.text('PRESCRIPCIÓN', margin + 5, y);

    y += 10;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    
    // Medicamentos (intentar parsear JSON si existe)
    let medications = [];
    try {
      if (typeof prescription.medications === 'string') {
        medications = JSON.parse(prescription.medications);
      } else if (Array.isArray(prescription.medications)) {
        medications = prescription.medications;
      }
    } catch (e) {
      medications = [{ name: prescription.medications || 'No especificado' }];
    }

    medications.forEach((med, index) => {
      pdf.text(`${index + 1}. ${med.name || med}`, margin + 5, y);
      y += 8;
      
      pdf.setFont(undefined, 'normal');
      pdf.setFontSize(10);
      
      if (med.dosage) {
        pdf.text(`   Dosis: ${med.dosage}`, margin + 5, y);
        y += 6;
      }
      
      if (med.frequency) {
        pdf.text(`   Frecuencia: ${med.frequency}`, margin + 5, y);
        y += 6;
      }
      
      y += 3;
    });

    // Instrucciones
    if (prescription.instructions) {
      y += 5;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text('INDICACIONES', margin, y);
      
      y += 7;
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const instrLines = pdf.splitTextToSize(prescription.instructions, pageWidth - 2 * margin - 10);
      instrLines.forEach(line => {
        pdf.text(line, margin + 5, y);
        y += 6;
      });
    }

    // Duración
    if (prescription.duration) {
      y += 5;
      pdf.setFont(undefined, 'bold');
      pdf.text('DURACIÓN DEL TRATAMIENTO', margin, y);
      y += 7;
      pdf.setFont(undefined, 'normal');
      const days = parseInt(prescription.duration);
      const months = Math.floor(days / 30);
      pdf.text(`${months > 0 ? `${months} mes(es)` : `${days} días`}`, margin + 5, y);
    }

    // Pie de página
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Este es un documento médico confidencial', pageWidth / 2, 285, { align: 'center' });

    // Abrir en nueva pestaña
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  const renewPrescription = (prescriptionId) => {
    alert('La solicitud de renovación de receta ha sido enviada al doctor. Recibirás una notificación cuando esté lista.');
    // TODO: Implementar lógica de renovación en el backend
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
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <BeakerIcon className="h-8 w-8" />
                Mis Recetas Médicas
              </h1>
              <p className="mt-2 opacity-90">
                Consulta tus recetas activas y el historial completo de prescripciones
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3">
                <p className="text-xs opacity-75">Total de recetas</p>
                <p className="text-2xl font-bold">{prescriptions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
            <div className="flex items-center gap-3">
              <ExclamationCircleIcon className="h-6 w-6 text-red-500" />
              <p className="text-red-700 font-medium">{error}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('active')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'active'
                    ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <CheckCircleIcon className="h-5 w-5" />
                  Recetas Activas ({prescriptions.filter(p => p.isActive).length})
                </span>
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'history'
                    ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <ClockIcon className="h-5 w-5" />
                  Historial ({prescriptions.filter(p => !p.isActive).length})
                </span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {filteredPrescriptions.length === 0 ? (
              <div className="text-center py-12">
                <BeakerIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay recetas {activeTab === 'active' ? 'activas' : 'en el historial'}
                </h3>
                <p className="text-gray-600">
                  {activeTab === 'active'
                    ? 'No tienes recetas médicas activas en este momento.'
                    : 'No hay recetas vencidas en tu historial.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {filteredPrescriptions.map((prescription) => (
                  <PrescriptionCard
                    key={prescription.id}
                    prescription={prescription}
                    formatDate={formatDate}
                    processLineBreaks={processLineBreaks}
                    onDownload={() => downloadPrescription(prescription)}
                    onRenew={() => renewPrescription(prescription.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}

// Componente de tarjeta de receta
function PrescriptionCard({ prescription, formatDate, processLineBreaks, onDownload, onRenew }) {
  const statusColors = {
    active: 'bg-green-100 border-green-300 text-green-800',
    expiring: 'bg-yellow-100 border-yellow-300 text-yellow-800',
    expired: 'bg-red-100 border-red-300 text-red-800',
  };

  const statusIcons = {
    active: CheckCircleIcon,
    expiring: ClockIcon,
    expired: XCircleIcon,
  };

  const StatusIcon = statusIcons[prescription.statusInfo.class] || CheckCircleIcon;

  return (
    <div className={`border-2 rounded-2xl overflow-hidden hover:shadow-lg transition-all ${
      prescription.isActive ? 'border-purple-200 bg-white' : 'border-gray-200 bg-gray-50'
    }`}>
      <div className={`p-5 ${prescription.isActive ? 'bg-gradient-to-r from-purple-50 to-white' : 'bg-gray-100'}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className={`${prescription.isActive ? 'bg-purple-600' : 'bg-gray-500'} p-3 rounded-xl`}>
              <BeakerIcon className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                {prescription.diagnosis || 'Prescripción Médica'}
              </h3>
              <p className="text-sm text-gray-600">
                Prescrito por Dr. {prescription.doctor_first_name} {prescription.doctor_last_name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {prescription.specialty_name || 'Medicina General'}
              </p>
            </div>
          </div>

          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border-2 ${
            statusColors[prescription.statusInfo.class]
          }`}>
            <StatusIcon className="h-4 w-4" />
            {prescription.statusInfo.label}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <CalendarIcon className="h-4 w-4" />
              <p className="text-xs font-semibold">Fecha de emisión</p>
            </div>
            <p className="text-sm font-bold text-gray-900">{formatDate(prescription.created_at)}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <ClockIcon className="h-4 w-4" />
              <p className="text-xs font-semibold">Duración</p>
            </div>
            <p className="text-sm font-bold text-gray-900">
              {prescription.duration ? `${Math.floor(parseInt(prescription.duration) / 30)} meses` : 'No especificado'}
            </p>
          </div>

          {prescription.isActive && prescription.daysUntilExpiry !== undefined && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <ClockIcon className="h-4 w-4" />
                <p className="text-xs font-semibold">Días restantes</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{prescription.daysUntilExpiry} días</p>
            </div>
          )}

          {!prescription.isActive && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <XCircleIcon className="h-4 w-4" />
                <p className="text-xs font-semibold">Venció el</p>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {formatDate(new Date(new Date(prescription.created_at).getTime() + parseInt(prescription.duration || 90) * 24 * 60 * 60 * 1000))}
              </p>
            </div>
          )}
        </div>

        {/* Medicamentos */}
        {prescription.medications && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <BeakerIcon className="h-5 w-5 text-blue-600" />
              Medicamentos
            </h4>
            <div className="text-sm text-gray-700 whitespace-pre-line">
              {typeof prescription.medications === 'string' 
                ? processLineBreaks(prescription.medications)
                : JSON.stringify(prescription.medications, null, 2)}
            </div>
          </div>
        )}

        {/* Instrucciones */}
        {prescription.instructions && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-green-600" />
              Indicaciones
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-line">{processLineBreaks(prescription.instructions)}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex gap-3 mt-4">
          <button
            onClick={onDownload}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-purple-600 text-white hover:bg-purple-700 transition-colors font-semibold"
          >
            <ArrowDownTrayIcon className="h-5 w-5" />
            Descargar Receta
          </button>
          
          {prescription.isActive && (
            <button
              onClick={onRenew}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-purple-600 text-purple-600 hover:bg-purple-50 transition-colors font-semibold"
            >
              <ArrowPathIcon className="h-5 w-5" />
              Solicitar Renovación
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
