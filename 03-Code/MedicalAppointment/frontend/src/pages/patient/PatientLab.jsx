import { useState, useEffect } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { MedicalRecordModel } from '../../models';
import {
  BeakerIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  ShareIcon,
  PlusIcon,
  XMarkIcon,
  TrashIcon,
  ArrowUpTrayIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import jsPDF from 'jspdf';

export default function PatientLab() {
  const [loading, setLoading] = useState(true);
  const [labResults, setLabResults] = useState([]);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  
  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [uploadData, setUploadData] = useState({
    lab_name: '',
    notes: '',
    results: []
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLabResults();
  }, []);

  const loadLabResults = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await MedicalRecordModel.getLabReports();
      const data = response.data || response;
      setLabResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error loading lab results:', err);
      setError('Error al cargar los resultados de laboratorio');
      setLabResults([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusConfig = (status) => {
    const configs = {
      completed: {
        badge: 'bg-green-100 text-green-800',
        label: 'Normal',
        icon: CheckCircleIcon,
      },
      needs_review: {
        badge: 'bg-yellow-100 text-yellow-800',
        label: 'Revisar',
        icon: ExclamationTriangleIcon,
      },
      pending: {
        badge: 'bg-blue-100 text-blue-800',
        label: 'Pendiente',
        icon: ClockIcon,
      },
    };
    return configs[status] || configs['pending'];
  };

  const getParameterStatusClass = (status) => {
    const normalizedStatus = (status || '').toLowerCase();
    if (normalizedStatus === 'alto' || normalizedStatus === 'high') {
      return 'text-red-700 bg-red-50 font-bold';
    }
    if (normalizedStatus === 'bajo' || normalizedStatus === 'low') {
      return 'text-yellow-700 bg-yellow-50 font-bold';
    }
    if (normalizedStatus === 'normal') {
      return 'text-green-700 bg-green-50 font-bold';
    }
    return 'text-gray-700 bg-gray-50';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const downloadLabResult = (report) => {
    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let y = 20;

      // Corporate colors
      const primaryColor = [41, 128, 185];
      const secondaryColor = [52, 73, 94];
      const accentColor = [46, 204, 113];
      const warningColor = [241, 196, 15];
      const dangerColor = [231, 76, 60];

      const checkPageBreak = (space) => {
        if (y + space > pageHeight - 25) {
          pdf.addPage();
          y = 20;
          return true;
        }
        return false;
      };

      // ===== HEADER =====
      pdf.setFillColor(...primaryColor);
      pdf.rect(0, 0, pageWidth, 50, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(24);
      pdf.setFont(undefined, 'bold');
      pdf.text('CLÍNICA SAN MIGUEL', margin, 20);

      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text('Laboratorio Clínico', margin, 28);
      pdf.text('Tel: (02) 2XXX-XXXX | Email: laboratorio@clinicasanmiguel.ec', margin, 34);
      pdf.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`, margin, 40);

      y = 60;

      // ===== TITLE =====
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(18);
      pdf.setFont(undefined, 'bold');
      pdf.text('RESULTADO DE LABORATORIO', margin, y);

      y += 3;
      pdf.setDrawColor(...accentColor);
      pdf.setLineWidth(1);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // ===== TEST INFORMATION =====
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, y, pageWidth - 2 * margin, 30, 'F');

      y += 8;
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text('INFORMACIÓN DEL EXAMEN', margin + 5, y);

      y += 7;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(...secondaryColor);
      pdf.text(`Examen: ${report.test_name || 'N/A'}`, margin + 5, y);

      y += 6;
      pdf.text(`Fecha de Orden: ${formatDate(report.order_date)}`, margin + 5, y);

      y += 6;
      pdf.text(`Ordenado por: ${report.doctor_full_name || 'Dr. Desconocido'}`, margin + 5, y);

      y += 15;

      // ===== RESULTS =====
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(...primaryColor);
      pdf.text('RESULTADOS', margin, y);
      y += 8;

      if (report.lab_results && report.lab_results.length > 0) {
        // Table header
        pdf.setFillColor(...primaryColor);
        pdf.rect(margin, y, pageWidth - 2 * margin, 10, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'bold');

        const col1 = margin + 3;
        const col2 = margin + 50;
        const col3 = margin + 85;
        const col4 = margin + 130;

        pdf.text('Parámetro', col1, y + 7);
        pdf.text('Resultado', col2, y + 7);
        pdf.text('Rango Normal', col3, y + 7);
        pdf.text('Estado', col4, y + 7);

        y += 10;

        // Result rows
        pdf.setFont(undefined, 'normal');
        pdf.setFontSize(9);

        report.lab_results.forEach((param, index) => {
          checkPageBreak(12);

          // Alternating background
          if (index % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
          }

          // Status color
          let statusColor = secondaryColor;
          const normalizedStatus = (param.status || '').toLowerCase();
          if (normalizedStatus === 'alto' || normalizedStatus === 'high') {
            statusColor = dangerColor;
          } else if (normalizedStatus === 'bajo' || normalizedStatus === 'low') {
            statusColor = warningColor;
          } else if (normalizedStatus === 'normal') {
            statusColor = accentColor;
          }

          pdf.setTextColor(...secondaryColor);
          pdf.text(param.parameter_name || 'N/A', col1, y + 7);

          pdf.setFont(undefined, 'bold');
          pdf.text(`${param.result_value || 'N/A'} ${param.unit || ''}`, col2, y + 7);

          pdf.setFont(undefined, 'normal');
          pdf.text(param.reference_range || 'N/A', col3, y + 7);

          pdf.setTextColor(...statusColor);
          pdf.setFont(undefined, 'bold');
          pdf.text(param.status || 'N/A', col4, y + 7);

          pdf.setFont(undefined, 'normal');
          y += 10;
        });
      } else {
        pdf.setTextColor(...secondaryColor);
        pdf.setFontSize(10);
        pdf.text('No hay resultados detallados disponibles', margin + 5, y);
        y += 10;
      }

      // ===== DOCTOR NOTES =====
      if (report.doctor_notes) {
        y += 5;
        checkPageBreak(25);

        pdf.setDrawColor(...warningColor);
        pdf.setLineWidth(0.5);
        pdf.setFillColor(255, 250, 230);
        pdf.rect(margin, y, pageWidth - 2 * margin, 20, 'FD');

        y += 7;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...warningColor);
        pdf.text('NOTA DEL MÉDICO:', margin + 5, y);

        y += 6;
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(...secondaryColor);
        const notesLines = pdf.splitTextToSize(report.doctor_notes, pageWidth - 2 * margin - 10);
        notesLines.forEach((line) => {
          checkPageBreak(6);
          pdf.text(line, margin + 5, y);
          y += 5;
        });
      }

      // ===== FOOTER =====
      pdf.setFontSize(8);
      pdf.setTextColor(150, 150, 150);
      pdf.text(
        'Clínica San Miguel - Resultados de Laboratorio',
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
      );
      pdf.text(
        'Este documento es confidencial y está dirigido únicamente al paciente',
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' }
      );

      // Open in new tab
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('Error al generar el PDF');
    }
  };

  const downloadAllResults = () => {
    if (labResults.length === 0) {
      alert('No hay resultados para descargar');
      return;
    }

    try {
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let y = 20;

      const primaryColor = [41, 128, 185];
      const secondaryColor = [52, 73, 94];
      const accentColor = [46, 204, 113];

      const checkPageBreak = (space) => {
        if (y + space > pageHeight - 25) {
          addFooter();
          pdf.addPage();
          y = 20;
          return true;
        }
        return false;
      };

      const addFooter = () => {
        const pageNum = pdf.internal.getCurrentPageInfo().pageNumber;
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
        pdf.text('Clínica San Miguel - Laboratorio Clínico', pageWidth / 2, pageHeight - 10, {
          align: 'center',
        });
      };

      // ===== COVER PAGE =====
      pdf.setFillColor(...primaryColor);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(32);
      pdf.setFont(undefined, 'bold');
      pdf.text('RESULTADOS DE', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
      pdf.text('LABORATORIO', pageWidth / 2, pageHeight / 2 - 5, { align: 'center' });

      pdf.setFontSize(14);
      pdf.setFont(undefined, 'normal');
      pdf.text('CLÍNICA SAN MIGUEL', pageWidth / 2, pageHeight / 2 + 20, { align: 'center' });
      pdf.text(
        `Generado: ${new Date().toLocaleDateString('es-ES')}`,
        pageWidth / 2,
        pageHeight / 2 + 35,
        { align: 'center' }
      );

      // ===== RESULTS PAGES =====
      labResults.forEach((report, index) => {
        pdf.addPage();
        y = 20;

        // Section header
        pdf.setFillColor(...primaryColor);
        pdf.rect(0, y - 5, pageWidth, 15, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.text(`${index + 1}. ${report.test_name || 'N/A'}`, margin, y + 6);

        y += 20;

        // Basic info
        pdf.setTextColor(...secondaryColor);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Fecha: ${formatDate(report.order_date)}`, margin, y);
        y += 6;
        pdf.text(`Doctor: ${report.doctor_full_name || 'N/A'}`, margin, y);
        y += 10;

        // Results
        if (report.lab_results && report.lab_results.length > 0) {
          report.lab_results.forEach((param) => {
            checkPageBreak(10);

            pdf.setFont(undefined, 'bold');
            pdf.text(`${param.parameter_name || 'N/A'}:`, margin + 5, y);
            pdf.setFont(undefined, 'normal');
            pdf.text(
              `${param.result_value || 'N/A'} ${param.unit || ''} (${param.reference_range || 'N/A'})`,
              margin + 60,
              y
            );

            // Status color
            const normalizedStatus = (param.status || '').toLowerCase();
            if (normalizedStatus === 'alto' || normalizedStatus === 'high') {
              pdf.setTextColor(231, 76, 60);
            } else if (normalizedStatus === 'normal') {
              pdf.setTextColor(46, 204, 113);
            } else {
              pdf.setTextColor(...secondaryColor);
            }
            pdf.text(param.status || 'N/A', margin + 130, y);
            pdf.setTextColor(...secondaryColor);

            y += 7;
          });
        }

        if (report.doctor_notes) {
          y += 5;
          checkPageBreak(15);
          pdf.setFont(undefined, 'bold');
          pdf.text('Notas:', margin, y);
          y += 6;
          pdf.setFont(undefined, 'normal');
          const notes = pdf.splitTextToSize(report.doctor_notes, pageWidth - 2 * margin - 5);
          notes.forEach((line) => {
            checkPageBreak(6);
            pdf.text(line, margin + 5, y);
            y += 5;
          });
        }

        addFooter();
      });

      // Download
      const fileName = `Resultados_Laboratorio_Completos_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (err) {
      console.error('Error generating complete PDF:', err);
      alert('Error al generar el PDF completo');
    }
  };

  const handleShare = (reportId) => {
    alert('Función de compartir próximamente');
    console.log('Share result:', reportId);
  };

  // Upload functions
  const openUploadModal = (report) => {
    setSelectedReport(report);
    setUploadData({
      lab_name: '',
      notes: '',
      results: [{ parameter_name: '', result_value: '', unit: '', reference_range: '', status: 'normal' }]
    });
    setShowUploadModal(true);
  };

  const addParameter = () => {
    setUploadData(prev => ({
      ...prev,
      results: [...prev.results, { 
        parameter_name: '', 
        result_value: '', 
        unit: '', 
        reference_range: '', 
        status: 'normal' 
      }]
    }));
  };

  const removeParameter = (index) => {
    setUploadData(prev => ({
      ...prev,
      results: prev.results.filter((_, i) => i !== index)
    }));
  };

  const updateParameter = (index, field, value) => {
    setUploadData(prev => ({
      ...prev,
      results: prev.results.map((p, i) => i === index ? { ...p, [field]: value } : p)
    }));
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const submitUpload = async () => {
    if (!selectedReport) {
      showNotification('No hay examen seleccionado', 'error');
      return;
    }

    const validResults = uploadData.results.filter(r => r.parameter_name && r.result_value);
    if (validResults.length === 0) {
      showNotification('Ingrese al menos un resultado', 'error');
      return;
    }

    try {
      setSubmitting(true);
      
      // Upload results to existing pending exam using patient endpoint
      await MedicalRecordModel.patientUploadResults(selectedReport.id, {
        results: validResults,
        interpretation: uploadData.lab_name 
          ? `Laboratorio: ${uploadData.lab_name}. ${uploadData.notes || ''}` 
          : uploadData.notes || '',
        status: 'completed'
      });

      setShowUploadModal(false);
      setSelectedReport(null);
      showNotification('Resultados subidos exitosamente', 'success');
      loadLabResults();
    } catch (err) {
      console.error('Error uploading lab results:', err);
      showNotification('Error al subir los resultados', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600">Cargando resultados...</p>
          </div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            notification.type === 'success' 
              ? 'bg-green-100 text-green-800 border border-green-300' 
              : 'bg-red-100 text-red-800 border border-red-300'
          }`}>
            {notification.type === 'success' 
              ? <CheckCircleIcon className="h-5 w-5" />
              : <ExclamationTriangleIcon className="h-5 w-5" />
            }
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl shadow-lg p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-xl">
                <BeakerIcon className="h-10 w-10" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Resultados de Laboratorio</h1>
                <p className="text-blue-100 mt-1">
                  Consulta y descarga tus exámenes médicos
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              {labResults.filter(r => r.status !== 'pending').length > 0 && (
                <button
                  onClick={downloadAllResults}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 rounded-lg hover:bg-blue-50 transition-colors font-semibold shadow-lg"
                >
                  <DocumentArrowDownIcon className="h-5 w-5" />
                  Descargar Todos
                </button>
              )}
              <button
                onClick={loadLabResults}
                className="p-3 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                title="Actualizar"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-800 text-center">{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!error && labResults.length === 0 && (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-200">
            <div className="bg-blue-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BeakerIcon className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay resultados de laboratorio
            </h3>
            <p className="text-gray-600">
              Aún no tienes resultados de laboratorio disponibles
            </p>
          </div>
        )}

        {/* Lab results cards */}
        {labResults.length > 0 && (
          <div className="space-y-4">
            {labResults.map((report) => {
              const statusConfig = getStatusConfig(report.status);
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={report.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  {/* Card Header */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 border-b border-blue-200">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-600 p-3 rounded-lg">
                          <BeakerIcon className="h-7 w-7 text-white" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-gray-900">
                            {report.test_name || 'Examen de Laboratorio'}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-gray-600">
                            <CalendarIcon className="h-4 w-4" />
                            <span className="text-sm">{formatDate(report.order_date)}</span>
                          </div>
                        </div>
                      </div>
                      <span
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${statusConfig.badge}`}
                      >
                        <StatusIcon className="h-5 w-5" />
                        {statusConfig.label}
                      </span>
                    </div>
                    <p className="text-gray-700 text-sm">
                      <span className="font-medium">Ordenado por:</span>{' '}
                      {report.doctor_full_name || 'Dr. Desconocido'}
                    </p>
                  </div>

                  {/* Results Table */}
                  <div className="p-6">
                    {report.lab_results && report.lab_results.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-blue-600">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Parámetro
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Resultado
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Rango Normal
                              </th>
                              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                Estado
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {report.lab_results.map((param, idx) => (
                              <tr
                                key={idx}
                                className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                              >
                                <td className="px-4 py-3 text-sm text-gray-900">
                                  {param.parameter_name || 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm font-bold text-gray-900">
                                  {param.result_value || 'N/A'} {param.unit || ''}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                  {param.reference_range || 'N/A'}
                                </td>
                                <td className="px-4 py-3 text-sm">
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold ${getParameterStatusClass(param.status)}`}
                                  >
                                    {param.status || 'N/A'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">
                        Resultados detallados no disponibles
                      </p>
                    )}

                    {/* Doctor Notes */}
                    {report.doctor_notes && (
                      <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-semibold text-yellow-800 mb-1">
                              NOTA DEL MÉDICO:
                            </p>
                            <p className="text-sm text-yellow-900">{report.doctor_notes}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="bg-gray-50 px-6 py-4 flex flex-col sm:flex-row gap-3">
                    {report.status === 'pending' ? (
                      <button
                        onClick={() => openUploadModal(report)}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                      >
                        <ArrowUpTrayIcon className="h-5 w-5" />
                        Subir Mis Resultados
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => downloadLabResult(report)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                        >
                          <DocumentArrowDownIcon className="h-5 w-5" />
                          Descargar PDF
                        </button>
                        <button
                          onClick={() => handleShare(report.id)}
                          className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                        >
                          <ShareIcon className="h-5 w-5" />
                          Compartir
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">Subir Resultados de Laboratorio</h3>
                  <p className="text-green-100 text-sm">{selectedReport.test_name}</p>
                </div>
                <button 
                  onClick={() => { setShowUploadModal(false); setSelectedReport(null); }}
                  className="text-white/80 hover:text-white p-2"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Exam Info */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Examen:</span>
                      <span className="ml-2 font-semibold text-gray-900">{selectedReport.test_name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Ordenado por:</span>
                      <span className="ml-2 font-semibold text-gray-900">{selectedReport.doctor_full_name || 'Dr. Desconocido'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Fecha de orden:</span>
                      <span className="ml-2 font-semibold text-gray-900">{formatDate(selectedReport.order_date)}</span>
                    </div>
                  </div>
                </div>

                {/* Lab Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre del Laboratorio (opcional)
                  </label>
                  <input
                    type="text"
                    value={uploadData.lab_name}
                    onChange={(e) => setUploadData({ ...uploadData, lab_name: e.target.value })}
                    placeholder="Ej: Laboratorio San José"
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>

                {/* Parameters Table */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-800">Resultados del Examen *</h4>
                    <button
                      onClick={addParameter}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                    >
                      <PlusIcon className="w-4 h-4" />
                      Agregar parámetro
                    </button>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-gray-50 text-left">
                          <th className="px-3 py-3 font-medium text-gray-700">Parámetro</th>
                          <th className="px-3 py-3 font-medium text-gray-700">Resultado</th>
                          <th className="px-3 py-3 font-medium text-gray-700">Unidad</th>
                          <th className="px-3 py-3 font-medium text-gray-700">Rango</th>
                          <th className="px-3 py-3 font-medium text-gray-700">Estado</th>
                          <th className="px-3 py-3 w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadData.results.map((param, index) => (
                          <tr key={index} className="border-t">
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={param.parameter_name}
                                onChange={(e) => updateParameter(index, 'parameter_name', e.target.value)}
                                placeholder="Hemoglobina"
                                className="w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={param.result_value}
                                onChange={(e) => updateParameter(index, 'result_value', e.target.value)}
                                placeholder="14.5"
                                className="w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none font-medium"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={param.unit}
                                onChange={(e) => updateParameter(index, 'unit', e.target.value)}
                                placeholder="g/dL"
                                className="w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <input
                                type="text"
                                value={param.reference_range}
                                onChange={(e) => updateParameter(index, 'reference_range', e.target.value)}
                                placeholder="12-16"
                                className="w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none"
                              />
                            </td>
                            <td className="px-3 py-2">
                              <select
                                value={param.status}
                                onChange={(e) => updateParameter(index, 'status', e.target.value)}
                                className={`w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-green-500 focus:outline-none ${
                                  param.status === 'alto' ? 'bg-red-50 text-red-700' :
                                  param.status === 'bajo' ? 'bg-yellow-50 text-yellow-700' :
                                  'bg-green-50 text-green-700'
                                }`}
                              >
                                <option value="normal">Normal</option>
                                <option value="alto">Alto</option>
                                <option value="bajo">Bajo</option>
                              </select>
                            </td>
                            <td className="px-3 py-2">
                              {uploadData.results.length > 1 && (
                                <button
                                  onClick={() => removeParameter(index)}
                                  className="p-1 text-gray-400 hover:text-red-600 transition"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas adicionales
                  </label>
                  <textarea
                    value={uploadData.notes}
                    onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                    placeholder="Cualquier información adicional sobre el examen..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    rows={2}
                  />
                </div>
              </div>
              
              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex justify-end gap-3">
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  onClick={submitUpload}
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <ArrowUpTrayIcon className="w-5 h-5" />
                      Subir Examen
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
