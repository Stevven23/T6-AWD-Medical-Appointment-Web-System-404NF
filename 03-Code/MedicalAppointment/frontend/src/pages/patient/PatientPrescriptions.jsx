import { useState, useEffect } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { PrescriptionModel } from '../../models';
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
  XMarkIcon,
  InboxIcon,
} from '@heroicons/react/24/outline';

export default function PatientPrescriptions() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [renewals, setRenewals] = useState([]);
  const [activeTab, setActiveTab] = useState('active'); // 'active', 'history', 'renewals'
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  const [renewalLoading, setRenewalLoading] = useState(null); // prescription ID being renewed
  
  // Renewal modal states
  const [showRenewalModal, setShowRenewalModal] = useState(false);
  const [renewalPrescription, setRenewalPrescription] = useState(null);
  const [renewalReason, setRenewalReason] = useState('');

  // Show notification
  const showNotification = (message, type = 'success', action = null) => {
    setNotification({ message, type, action });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    loadPrescriptions();
    loadRenewals();
  }, []);

  const loadRenewals = async () => {
    try {
      const response = await PrescriptionModel.getMyRenewals();
      const data = Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];
      setRenewals(data);
    } catch (error) {
      console.error('Error loading renewals:', error);
    }
  };

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await PrescriptionModel.getPatientPrescriptions();
      const data = Array.isArray(response.data) ? response.data : Array.isArray(response) ? response : [];
      
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
    return text.replace(/\\n/g, '\n');
  };

  // Parse duration string to days - handles "12 dias", "7 días", "2 semanas", etc.
  const parseDurationToDays = (duration) => {
    if (!duration) return 90; // Default 90 days
    
    // If it's already a number
    if (typeof duration === 'number') return duration;
    
    const str = String(duration).toLowerCase().trim();
    
    // Try to extract number
    const numberMatch = str.match(/(\d+)/);
    if (!numberMatch) return 90;
    
    const number = parseInt(numberMatch[1]);
    
    // Check for time units
    if (str.includes('semana')) return number * 7;
    if (str.includes('mes')) return number * 30;
    if (str.includes('año')) return number * 365;
    // Default to days (días, dias, day, etc.)
    return number;
  };

  // Format duration for display
  const formatDuration = (duration) => {
    if (!duration) return 'No especificado';
    
    const str = String(duration).trim();
    
    // If it already has text description, return it
    if (str.match(/[a-zA-ZáéíóúÁÉÍÓÚ]/)) {
      return str;
    }
    
    // If it's just a number, format it
    const days = parseInt(str);
    if (isNaN(days)) return 'No especificado';
    
    if (days >= 30) {
      const months = Math.floor(days / 30);
      const remainingDays = days % 30;
      if (remainingDays > 0) {
        return `${months} mes(es) y ${remainingDays} días`;
      }
      return `${months} mes(es)`;
    }
    return `${days} días`;
  };

  // Parse medications from various formats
  const parseMedications = (medications) => {
    if (!medications) return [];
    
    try {
      if (typeof medications === 'string') {
        // Try to parse as JSON
        if (medications.trim().startsWith('[') || medications.trim().startsWith('{')) {
          const parsed = JSON.parse(medications);
          return Array.isArray(parsed) ? parsed : [parsed];
        }
        // Handle multiline string format - each line is a medication
        return medications.split('\n').filter(m => m.trim()).map(m => ({ medication: m.trim(), name: m.trim() }));
      }
      if (Array.isArray(medications)) {
        return medications;
      }
      if (typeof medications === 'object') {
        return [medications];
      }
    } catch (e) {
      // If parsing fails, return as single medication
      return [{ medication: String(medications), name: String(medications) }];
    }
    
    return [];
  };

  // Get effective duration - from prescription.duration or from medications
  const getEffectiveDuration = (prescription) => {
    // First check if prescription has a duration field
    if (prescription.duration) {
      return prescription.duration;
    }
    
    // Try to get max duration from medications
    const meds = parseMedications(prescription.medications);
    let maxDays = 0;
    let durationStr = null;
    
    for (const med of meds) {
      if (med.duration) {
        const days = parseDurationToDays(med.duration);
        if (days > maxDays) {
          maxDays = days;
          durationStr = med.duration;
        }
      }
    }
    
    return durationStr; // Return null if no duration found
  };

  const checkIsActive = (prescription) => {
    if (!prescription.created_at) return false;
    const effectiveDuration = getEffectiveDuration(prescription);
    const durationDays = parseDurationToDays(effectiveDuration);
    const expiryDate = calculateExpiryDate(prescription.created_at, durationDays);
    return new Date() < expiryDate;
  };

  const calculateExpiryDate = (startDate, durationDays) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + durationDays);
    return date;
  };

  const calculateDaysUntilExpiry = (prescription) => {
    if (!prescription.created_at) return 0;
    const effectiveDuration = getEffectiveDuration(prescription);
    const durationDays = parseDurationToDays(effectiveDuration);
    const expiryDate = calculateExpiryDate(prescription.created_at, durationDays);
    const today = new Date();
    return Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
  };

  const getExpiryDate = (prescription) => {
    if (!prescription.created_at) return null;
    const effectiveDuration = getEffectiveDuration(prescription);
    const durationDays = parseDurationToDays(effectiveDuration);
    return calculateExpiryDate(prescription.created_at, durationDays);
  };

  // Format the effective duration for display
  const getDisplayDuration = (prescription) => {
    const effectiveDuration = getEffectiveDuration(prescription);
    return formatDuration(effectiveDuration);
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Check if a prescription has a pending renewal request
  const hasPendingRenewal = (prescriptionId) => {
    return renewals.some(r => r.original_prescription_id === prescriptionId && r.status === 'pending');
  };

  // Get renewal status for a prescription
  const getRenewalStatus = (prescriptionId) => {
    const renewal = renewals.find(r => r.original_prescription_id === prescriptionId);
    return renewal?.status || null;
  };

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    if (activeTab === 'active') {
      return prescription.isActive;
    } else if (activeTab === 'history') {
      return !prescription.isActive;
    }
    return false; // renewals tab doesn't show prescriptions
  });

  // Cancel a renewal request
  const cancelRenewal = async (renewalId) => {
    try {
      await PrescriptionModel.cancelRenewal(renewalId);
      await loadRenewals();
      showNotification('Solicitud de renovación cancelada.', 'success');
    } catch (error) {
      console.error('Error canceling renewal:', error);
      showNotification('Error al cancelar la solicitud.', 'error');
    }
  };

  // Generar PDF de una receta (similar al doctor)
  const downloadPrescription = async (prescription) => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let y = 20;

    const primaryColor = [41, 128, 185];
    const secondaryColor = [52, 73, 94];
    const accentColor = [46, 204, 113];

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
    pdf.text(`Especialidad: ${prescription.specialty_name || 'Medicina General'}`, margin + 5, y);

    // Diagnóstico
    if (prescription.diagnosis) {
      y += 12;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text('DIAGNÓSTICO', margin, y);
      
      y += 7;
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(prescription.diagnosis, margin + 5, y);
    }

    // Medicamentos
    y += 12;
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...primaryColor);
    pdf.text('MEDICAMENTOS', margin, y);

    y += 8;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(10);
    
    const medications = parseMedications(prescription.medications);
    
    medications.forEach((med, index) => {
      const medName = med.medication || med.name || String(med);
      
      pdf.setFont(undefined, 'bold');
      pdf.text(`${index + 1}. ${medName}`, margin + 5, y);
      y += 6;
      
      pdf.setFont(undefined, 'normal');
      
      if (med.dosage) {
        pdf.text(`   Dosis: ${med.dosage}`, margin + 5, y);
        y += 5;
      }
      
      if (med.frequency) {
        pdf.text(`   Frecuencia: ${med.frequency}`, margin + 5, y);
        y += 5;
      }
      
      if (med.duration) {
        pdf.text(`   Duración: ${med.duration}`, margin + 5, y);
        y += 5;
      }
      
      if (med.instructions) {
        pdf.text(`   Indicaciones: ${med.instructions}`, margin + 5, y);
        y += 5;
      }
      
      y += 3;
    });

    // Instrucciones generales
    if (prescription.instructions) {
      y += 5;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text('INDICACIONES GENERALES', margin, y);
      
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

    // Duración del tratamiento
    const effectiveDuration = getEffectiveDuration(prescription);
    if (effectiveDuration) {
      y += 5;
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text('DURACIÓN DEL TRATAMIENTO', margin, y);
      y += 7;
      pdf.setTextColor(...secondaryColor);
      pdf.setFont(undefined, 'normal');
      pdf.text(formatDuration(effectiveDuration), margin + 5, y);
    }

    // QR Code if available
    if (prescription.qr_url || prescription.qr_image) {
      const qrSize = 35;
      const qrX = pageWidth - margin - qrSize;
      const qrY = Math.min(y + 15, pageHeight - 70);
      
      try {
        const qrUrl = prescription.qr_url || prescription.qr_image;
        const img = await new Promise((resolve, reject) => {
          const image = new Image();
          image.crossOrigin = 'anonymous';
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = qrUrl;
        });
        
        // Draw QR background
        pdf.setFillColor(248, 249, 250);
        pdf.roundedRect(qrX - 3, qrY - 3, qrSize + 6, qrSize + 12, 2, 2, 'F');
        
        pdf.addImage(img, 'PNG', qrX, qrY, qrSize, qrSize);
        
        pdf.setFontSize(6);
        pdf.setTextColor(100, 100, 100);
        pdf.text('Escanee para verificar', qrX + qrSize / 2, qrY + qrSize + 5, { align: 'center' });
      } catch (e) {
        console.warn('No se pudo agregar QR al PDF:', e.message);
      }
    }

    // Pie de página
    const footerY = pageHeight - 25;
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.3);
    pdf.line(margin, footerY, pageWidth - margin, footerY);
    
    pdf.setTextColor(120, 120, 120);
    pdf.setFontSize(8);
    pdf.text(`Fecha de emisión: ${formatDate(prescription.created_at)}`, margin, footerY + 6);
    pdf.text('Receta válida por 30 días a partir de la fecha de emisión', margin, footerY + 11);
    
    if (prescription.qr_token) {
      pdf.setFontSize(7);
      pdf.text(`ID: ${prescription.qr_token.substring(0, 12)}`, pageWidth / 2, footerY + 6, { align: 'center' });
    }

    // Abrir en nueva pestaña
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  const renewPrescription = async (prescription) => {
    // Check if already has pending renewal
    const hasPending = renewals.some(
      r => r.original_prescription_id === prescription.id && r.status === 'pending'
    );
    
    if (hasPending) {
      showNotification('Ya tienes una solicitud de renovación pendiente para esta receta.', 'warning');
      return;
    }

    // Open modal for renewal reason
    setRenewalPrescription(prescription);
    setRenewalReason('');
    setShowRenewalModal(true);
  };

  const submitRenewalRequest = async () => {
    if (!renewalPrescription) return;
    
    if (!renewalReason.trim()) {
      showNotification('Por favor ingresa el motivo de la renovación.', 'warning');
      return;
    }

    try {
      setRenewalLoading(renewalPrescription.id);
      setShowRenewalModal(false);
      
      // Call the renewal API
      await PrescriptionModel.requestRenewal(renewalPrescription.id, {
        reason: renewalReason,
        notes: `Receta original emitida el ${formatDate(renewalPrescription.created_at)} por Dr. ${renewalPrescription.doctor_first_name} ${renewalPrescription.doctor_last_name}`
      });
      
      // Reload renewals to update the list
      await loadRenewals();
      
      showNotification(
        'Tu solicitud de renovación ha sido enviada al doctor.', 
        'success',
        { label: 'Ver solicitudes', onClick: () => setActiveTab('renewals') }
      );
      
      setRenewalPrescription(null);
    } catch (error) {
      console.error('Error requesting renewal:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Error al solicitar renovación.';
      showNotification(errorMsg, 'error');
    } finally {
      setRenewalLoading(null);
    }
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
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 animate-slide-in max-w-md">
          <div className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            notification.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
          } text-white`}>
            {notification.type === 'success' && <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />}
            {notification.type === 'error' && <XCircleIcon className="h-5 w-5 flex-shrink-0" />}
            {notification.type === 'warning' && <ExclamationCircleIcon className="h-5 w-5 flex-shrink-0" />}
            <div className="flex-1">
              <span className="font-medium">{notification.message}</span>
              {notification.action && (
                <button
                  onClick={() => {
                    notification.action.onClick();
                    setNotification(null);
                  }}
                  className="ml-2 underline hover:no-underline font-semibold"
                >
                  {notification.action.label}
                </button>
              )}
            </div>
            <button 
              onClick={() => setNotification(null)}
              className="ml-2 hover:bg-white/20 rounded p-1 flex-shrink-0"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
              <button
                onClick={() => setActiveTab('renewals')}
                className={`flex-1 px-6 py-4 text-sm font-semibold transition-colors ${
                  activeTab === 'renewals'
                    ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center justify-center gap-2 relative">
                  <ArrowPathIcon className="h-5 w-5" />
                  Solicitudes ({renewals.length})
                  {renewals.filter(r => r.status === 'pending').length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                      {renewals.filter(r => r.status === 'pending').length}
                    </span>
                  )}
                </span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Renewals Tab Content */}
            {activeTab === 'renewals' ? (
              renewals.length === 0 ? (
                <div className="text-center py-12">
                  <InboxIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    No hay solicitudes de renovación
                  </h3>
                  <p className="text-gray-600">
                    Cuando solicites una renovación de receta, aparecerá aquí.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {renewals.map((renewal) => (
                    <RenewalCard
                      key={renewal.id}
                      renewal={renewal}
                      formatDate={formatDate}
                      onCancel={() => cancelRenewal(renewal.id)}
                    />
                  ))}
                </div>
              )
            ) : (
              /* Prescriptions Tab Content */
              filteredPrescriptions.length === 0 ? (
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
                      getDisplayDuration={getDisplayDuration}
                      parseMedications={parseMedications}
                      getExpiryDate={getExpiryDate}
                      processLineBreaks={processLineBreaks}
                      onDownload={() => downloadPrescription(prescription)}
                      onRenew={() => renewPrescription(prescription)}
                      renewalLoading={renewalLoading === prescription.id}
                      hasPendingRenewal={hasPendingRenewal(prescription.id)}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {/* Modal de Solicitud de Renovación */}
      {showRenewalModal && renewalPrescription && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <ArrowPathIcon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Solicitar Renovación</h3>
                    <p className="text-purple-100 text-sm">
                      {renewalPrescription.diagnosis || 'Prescripción Médica'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setShowRenewalModal(false); setRenewalPrescription(null); }}
                  className="text-white/80 hover:text-white p-1 hover:bg-white/20 rounded-lg transition"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="text-xs font-semibold text-gray-500 mb-2">Información de la Receta</p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Doctor:</span> Dr. {renewalPrescription.doctor_first_name} {renewalPrescription.doctor_last_name}
                </p>
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Fecha original:</span> {formatDate(renewalPrescription.created_at)}
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  ¿Por qué necesitas renovar esta receta? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={renewalReason}
                  onChange={(e) => setRenewalReason(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                  placeholder="Ej: Necesito continuar el tratamiento porque aún no he completado la terapia..."
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Tu doctor recibirá esta solicitud y podrá aprobarla o rechazarla.
                </p>
              </div>
            </div>
            
            <div className="flex gap-3 p-4 bg-gray-50 rounded-b-2xl">
              <button
                onClick={() => { setShowRenewalModal(false); setRenewalPrescription(null); }}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium"
              >
                Cancelar
              </button>
              <button
                onClick={submitRenewalRequest}
                disabled={!renewalReason.trim()}
                className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Enviar Solicitud
              </button>
            </div>
          </div>
        </div>
      )}
    </PatientLayout>
  );
}

// Componente de tarjeta de renovación
function RenewalCard({ renewal, formatDate, onCancel }) {
  const statusConfig = {
    pending: { label: 'Pendiente', color: 'bg-yellow-100 border-yellow-300 text-yellow-800', icon: ClockIcon },
    approved: { label: 'Aprobada', color: 'bg-green-100 border-green-300 text-green-800', icon: CheckCircleIcon },
    rejected: { label: 'Rechazada', color: 'bg-red-100 border-red-300 text-red-800', icon: XCircleIcon },
    cancelled: { label: 'Cancelada', color: 'bg-gray-100 border-gray-300 text-gray-800', icon: XMarkIcon },
  };

  const config = statusConfig[renewal.status] || statusConfig.pending;
  const StatusIcon = config.icon;

  return (
    <div className="border-2 border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all bg-white">
      <div className="p-5 bg-gradient-to-r from-orange-50 to-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 flex-1">
            <div className="bg-orange-500 p-3 rounded-xl">
              <ArrowPathIcon className="h-7 w-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Solicitud de Renovación
              </h3>
              <p className="text-sm text-gray-600">
                Dr. {renewal.doctor_first_name} {renewal.doctor_last_name}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {renewal.specialty_name || 'Medicina General'}
              </p>
            </div>
          </div>

          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold border-2 ${config.color}`}>
            <StatusIcon className="h-4 w-4" />
            {config.label}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-1">Diagnóstico Original</p>
            <p className="text-sm font-medium text-gray-900">{renewal.original_diagnosis || 'N/A'}</p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 mb-1">Fecha de Solicitud</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(renewal.requested_at)}</p>
          </div>
        </div>

        {renewal.request_reason && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-blue-700 mb-1">Razón de Solicitud</p>
            <p className="text-sm text-gray-700">{renewal.request_reason}</p>
          </div>
        )}

        {renewal.status === 'rejected' && renewal.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-red-700 mb-1">Razón del Rechazo</p>
            <p className="text-sm text-gray-700">{renewal.rejection_reason}</p>
          </div>
        )}

        {renewal.status === 'approved' && renewal.doctor_response && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <p className="text-xs font-semibold text-green-700 mb-1">Respuesta del Doctor</p>
            <p className="text-sm text-gray-700">{renewal.doctor_response}</p>
          </div>
        )}

        {renewal.status === 'pending' && (
          <div className="flex gap-3 mt-4">
            <button
              onClick={onCancel}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-red-300 text-red-600 hover:bg-red-50 transition-colors font-semibold"
            >
              <XMarkIcon className="h-5 w-5" />
              Cancelar Solicitud
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Componente de tarjeta de receta
function PrescriptionCard({ prescription, formatDate, getDisplayDuration, parseMedications, getExpiryDate, processLineBreaks, onDownload, onRenew, renewalLoading, hasPendingRenewal }) {
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
  const medications = parseMedications(prescription.medications);
  const expiryDate = getExpiryDate(prescription);

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
              {getDisplayDuration(prescription)}
            </p>
          </div>

          {prescription.isActive && prescription.daysUntilExpiry !== undefined && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <ClockIcon className="h-4 w-4" />
                <p className="text-xs font-semibold">Días restantes</p>
              </div>
              <p className="text-sm font-bold text-gray-900">{prescription.daysUntilExpiry} días</p>
            </div>
          )}

          {!prescription.isActive && expiryDate && (
            <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
              <div className="flex items-center gap-2 text-red-600 mb-1">
                <XCircleIcon className="h-4 w-4" />
                <p className="text-xs font-semibold">Venció el</p>
              </div>
              <p className="text-sm font-bold text-gray-900">
                {formatDate(expiryDate)}
              </p>
            </div>
          )}
        </div>

        {/* Medicamentos - Formatted display */}
        {medications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
              <BeakerIcon className="h-5 w-5 text-blue-600" />
              Medicamentos
            </h4>
            <div className="space-y-3">
              {medications.map((med, index) => {
                const medName = med.medication || med.name || String(med);
                return (
                  <div key={index} className="bg-white p-3 rounded-lg border border-blue-100">
                    <div className="flex items-start justify-between">
                      <p className="font-semibold text-gray-800">
                        {index + 1}. {medName}
                      </p>
                      {med.dosage && (
                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded">
                          {med.dosage}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 text-sm text-gray-600 flex flex-wrap gap-3">
                      {med.frequency && <span>📅 {med.frequency}</span>}
                      {med.duration && <span>⏱ {med.duration}</span>}
                    </div>
                    {med.instructions && (
                      <p className="text-sm text-gray-500 mt-2 italic border-l-2 border-blue-300 pl-2">
                        {med.instructions}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Instrucciones generales */}
        {prescription.instructions && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <DocumentTextIcon className="h-5 w-5 text-green-600" />
              Indicaciones Generales
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
            hasPendingRenewal ? (
              <div className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-orange-400 bg-orange-50 text-orange-600 font-semibold">
                <ClockIcon className="h-5 w-5" />
                Renovación Pendiente
              </div>
            ) : (
              <button
                onClick={onRenew}
                disabled={renewalLoading}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-purple-600 text-purple-600 transition-colors font-semibold ${
                  renewalLoading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-purple-50'
                }`}
              >
                {renewalLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </>
                ) : (
                  <>
                    <ArrowPathIcon className="h-5 w-5" />
                    Solicitar Renovación
                  </>
                )}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
