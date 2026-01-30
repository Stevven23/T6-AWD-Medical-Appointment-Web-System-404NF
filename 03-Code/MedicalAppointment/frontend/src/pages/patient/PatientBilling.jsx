import React, { useState, useEffect } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { BillingModel } from '../../models';

export default function PatientBilling() {
  const { user } = useAuth();
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedBilling, setSelectedBilling] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadBillings();
  }, []);

  const loadBillings = async () => {
    try {
      setLoading(true);
      const response = await BillingModel.getMyBillings();
      setBillings(response.data || response || []);
    } catch (error) {
      console.error('Error loading billings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-EC', {
      style: 'currency',
      currency: 'USD',
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusInfo = (status) => {
    const statusConfig = {
      pending: { 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        label: 'Pendiente',
        icon: ClockIcon,
        iconColor: 'text-yellow-600'
      },
      paid: { 
        color: 'bg-green-100 text-green-800 border-green-200', 
        label: 'Pagado',
        icon: CheckCircleIcon,
        iconColor: 'text-green-600'
      },
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const filteredBillings = billings.filter(b => {
    if (filter === 'all') return true;
    return b.status === filter;
  });

  const pendingTotal = billings
    .filter(b => b.status === 'pending')
    .reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

  const paidTotal = billings
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0);

  const openDetail = (billing) => {
    setSelectedBilling(billing);
    setShowDetailModal(true);
  };

  // Generate PDF for a billing
  const downloadBillingPDF = (billing) => {
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
    const accentColor = [46, 204, 113];

    // Header
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

    // Title
    y = 55;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text('FACTURA', margin, y);
    
    y += 3;
    pdf.setDrawColor(...accentColor);
    pdf.setLineWidth(1);
    pdf.line(margin, y, pageWidth - margin, y);

    // Invoice info
    y += 12;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, pageWidth - 2 * margin, 35, 'F');
    
    y += 8;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text('INFORMACIÓN DE LA FACTURA', margin + 5, y);
    
    y += 8;
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Número de Factura: ${billing.invoice_number || `FAC-${billing.id?.slice(0, 8)}`}`, margin + 5, y);
    y += 6;
    pdf.text(`Fecha de Emisión: ${formatDate(billing.created_at)}`, margin + 5, y);
    y += 6;
    pdf.text(`Estado: ${billing.status === 'paid' ? 'PAGADO' : 'PENDIENTE'}`, margin + 5, y);

    // Patient info
    y += 15;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
    
    y += 8;
    pdf.setFont(undefined, 'bold');
    pdf.text('DATOS DEL PACIENTE', margin + 5, y);
    
    y += 8;
    pdf.setFont(undefined, 'normal');
    pdf.text(`Paciente: ${user?.first_name || ''} ${user?.last_name || ''}`, margin + 5, y);

    // Doctor info (if available)
    if (billing.doctor_first_name || billing.specialty_name) {
      y += 15;
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
      
      y += 8;
      pdf.setFont(undefined, 'bold');
      pdf.text('SERVICIO MÉDICO', margin + 5, y);
      
      y += 8;
      pdf.setFont(undefined, 'normal');
      if (billing.doctor_first_name) {
        pdf.text(`Doctor: Dr. ${billing.doctor_first_name} ${billing.doctor_last_name}`, margin + 5, y);
        y += 6;
      }
      if (billing.specialty_name) {
        pdf.text(`Especialidad: ${billing.specialty_name}`, margin + 5, y);
      }
    }

    // Billing details
    y += 20;
    pdf.setFillColor(240, 248, 255);
    pdf.rect(margin, y, pageWidth - 2 * margin, 50, 'F');
    
    y += 10;
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(12);
    pdf.setTextColor(...primaryColor);
    pdf.text('DETALLE DE FACTURACIÓN', margin + 5, y);

    y += 10;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    
    // Table header
    pdf.setFont(undefined, 'bold');
    pdf.text('Concepto', margin + 5, y);
    pdf.text('Monto', pageWidth - margin - 30, y);
    y += 6;
    pdf.setLineWidth(0.5);
    pdf.line(margin + 5, y, pageWidth - margin - 5, y);
    
    // Table content
    y += 8;
    pdf.setFont(undefined, 'normal');
    pdf.text('Consulta Médica', margin + 5, y);
    pdf.text(formatCurrency(billing.subtotal || billing.amount), pageWidth - margin - 30, y);
    
    if (billing.discount_amount > 0) {
      y += 8;
      pdf.text('Descuento Seguro', margin + 5, y);
      pdf.text(`-${formatCurrency(billing.discount_amount)}`, pageWidth - margin - 30, y);
    }
    
    y += 12;
    pdf.setLineWidth(0.5);
    pdf.line(margin + 5, y, pageWidth - margin - 5, y);
    
    y += 8;
    pdf.setFont(undefined, 'bold');
    pdf.setFontSize(12);
    pdf.text('TOTAL', margin + 5, y);
    pdf.text(formatCurrency(billing.amount), pageWidth - margin - 30, y);

    // Payment info if paid
    if (billing.status === 'paid') {
      y += 20;
      pdf.setFillColor(220, 252, 231);
      pdf.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
      
      y += 10;
      pdf.setFontSize(11);
      pdf.setTextColor(22, 101, 52);
      pdf.text('✓ FACTURA PAGADA', pageWidth / 2, y, { align: 'center' });
      y += 8;
      pdf.setFontSize(10);
      if (billing.payment_date) {
        pdf.text(`Fecha de pago: ${formatDate(billing.payment_date)}`, pageWidth / 2, y, { align: 'center' });
      }
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('Este documento es un comprobante oficial de facturación', pageWidth / 2, 280, { align: 'center' });
    pdf.text('Clínica San Miguel - Todos los derechos reservados', pageWidth / 2, 285, { align: 'center' });

    // Open in new tab
    const pdfBlob = pdf.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  if (loading) {
    return (
      <PatientLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </PatientLayout>
    );
  }

  return (
    <PatientLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Mis Facturas</h2>
          <p className="text-gray-600">Historial de pagos y facturas pendientes</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Facturas</p>
                <p className="text-2xl font-bold text-gray-800">{billings.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Por Pagar</p>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingTotal)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pagado</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(paidTotal)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-xl shadow-md p-2 inline-flex gap-2">
          {[
            { value: 'all', label: 'Todas' },
            { value: 'pending', label: 'Pendientes' },
            { value: 'paid', label: 'Pagadas' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === tab.value
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Billings List */}
        <div className="space-y-4">
          {filteredBillings.length === 0 ? (
            <div className="bg-white rounded-xl shadow-md p-12 text-center">
              <CurrencyDollarIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600">No hay facturas</h3>
              <p className="text-gray-400">Tus facturas aparecerán aquí</p>
            </div>
          ) : (
            filteredBillings.map((billing) => {
              const statusInfo = getStatusInfo(billing.status);
              const StatusIcon = statusInfo.icon;
              
              return (
                <div key={billing.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                            <StatusIcon className={`w-4 h-4 ${statusInfo.iconColor}`} />
                            {statusInfo.label}
                          </span>
                          <span className="text-sm text-gray-500">
                            {billing.invoice_number || `Factura #${billing.id?.slice(0, 8)}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="w-4 h-4" />
                            {formatDate(billing.created_at)}
                          </div>
                          {billing.doctor && (
                            <span>
                              Dr(a). {billing.doctor?.users?.first_name} {billing.doctor?.users?.last_name}
                            </span>
                          )}
                        </div>

                        {billing.description && (
                          <p className="text-gray-600 mt-2">{billing.description}</p>
                        )}
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold text-gray-800">
                          {formatCurrency(billing.amount)}
                        </p>
                        {billing.status === 'paid' && billing.paid_at && (
                          <p className="text-xs text-green-600 mt-1">
                            Pagado el {formatDate(billing.paid_at)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-4 pt-4 border-t">
                      <button
                        onClick={() => openDetail(billing)}
                        className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      >
                        <EyeIcon className="w-5 h-5" />
                        Ver Detalle
                      </button>
                      <button
                        onClick={() => downloadBillingPDF(billing)}
                        className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                      >
                        <ArrowDownTrayIcon className="w-5 h-5" />
                        Descargar PDF
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail Modal */}
        {showDetailModal && selectedBilling && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold">Detalle de Factura</h3>
                    <p className="opacity-90">
                      {selectedBilling.invoice_number || `FAC-${selectedBilling.id?.slice(0, 8)}`}
                    </p>
                  </div>
                  {selectedBilling.status === 'paid' ? (
                    <div className="bg-green-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                      <CheckCircleIcon className="w-5 h-5" />
                      <span className="font-medium">Pagado</span>
                    </div>
                  ) : (
                    <div className="bg-yellow-500 text-white px-4 py-2 rounded-full flex items-center gap-2">
                      <ClockIcon className="w-5 h-5" />
                      <span className="font-medium">Pendiente</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Patient Info */}
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <UserCircleIcon className="w-5 h-5 text-blue-600" />
                    Datos del Paciente
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Nombre</span>
                      <p className="font-medium">{user?.first_name} {user?.last_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Correo</span>
                      <p className="font-medium">{user?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Medical Service Info */}
                {(selectedBilling.doctor_first_name || selectedBilling.specialty_name || selectedBilling.appointments) && (
                  <div className="bg-purple-50 rounded-xl p-4 border border-purple-200">
                    <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <DocumentTextIcon className="w-5 h-5 text-purple-600" />
                      Servicio Médico
                    </h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selectedBilling.doctor_first_name && (
                        <div>
                          <span className="text-gray-500">Doctor</span>
                          <p className="font-medium">Dr. {selectedBilling.doctor_first_name} {selectedBilling.doctor_last_name}</p>
                        </div>
                      )}
                      {selectedBilling.specialty_name && (
                        <div>
                          <span className="text-gray-500">Especialidad</span>
                          <p className="font-medium">{selectedBilling.specialty_name}</p>
                        </div>
                      )}
                      {selectedBilling.appointments?.scheduled_start && (
                        <div>
                          <span className="text-gray-500">Fecha de Consulta</span>
                          <p className="font-medium">{formatDate(selectedBilling.appointments.scheduled_start)}</p>
                        </div>
                      )}
                      {selectedBilling.appointments?.reason && (
                        <div className="col-span-2">
                          <span className="text-gray-500">Motivo de Consulta</span>
                          <p className="font-medium">{selectedBilling.appointments.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Billing Breakdown */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CurrencyDollarIcon className="w-5 h-5 text-green-600" />
                    Desglose de Facturación
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Consulta Médica</span>
                      <span className="font-medium">{formatCurrency(selectedBilling.subtotal || selectedBilling.amount)}</span>
                    </div>
                    {selectedBilling.discount_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Descuento Seguro</span>
                        <span className="font-medium text-green-600">-{formatCurrency(selectedBilling.discount_amount)}</span>
                      </div>
                    )}
                    {selectedBilling.tax_amount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Impuestos</span>
                        <span className="font-medium">{formatCurrency(selectedBilling.tax_amount)}</span>
                      </div>
                    )}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between">
                        <span className="font-bold text-gray-900">Total</span>
                        <span className="font-bold text-xl text-gray-900">{formatCurrency(selectedBilling.amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Details */}
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-blue-600" />
                    Información de Factura
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-500">Fecha de Emisión</span>
                      <p className="font-medium">{formatDate(selectedBilling.created_at)}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">N° Factura</span>
                      <p className="font-medium">{selectedBilling.invoice_number || `FAC-${selectedBilling.id?.slice(0, 8)}`}</p>
                    </div>
                    {selectedBilling.status === 'paid' && (
                      <>
                        {selectedBilling.payment_date && (
                          <div>
                            <span className="text-gray-500">Fecha de Pago</span>
                            <p className="font-medium text-green-600">{formatDate(selectedBilling.payment_date)}</p>
                          </div>
                        )}
                        {selectedBilling.payment_method && (
                          <div>
                            <span className="text-gray-500">Método de Pago</span>
                            <p className="font-medium capitalize">{selectedBilling.payment_method}</p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Pending Payment Alert */}
                {selectedBilling.status === 'pending' && (
                  <div className="bg-yellow-50 border-2 border-yellow-300 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <ClockIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-yellow-800">Factura Pendiente de Pago</p>
                        <p className="text-sm text-yellow-700 mt-1">
                          Para realizar el pago, puede acercarse a la recepción de la clínica 
                          o contactarnos al teléfono (02) 2XXX-XXXX.
                        </p>
                        <p className="text-sm text-yellow-600 mt-2">
                          Aceptamos efectivo, tarjeta de crédito/débito y transferencia bancaria.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Paid Success */}
                {selectedBilling.status === 'paid' && (
                  <div className="bg-green-50 border-2 border-green-300 rounded-xl p-4">
                    <div className="flex items-center gap-3">
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                      <div>
                        <p className="font-bold text-green-800">Factura Pagada</p>
                        <p className="text-sm text-green-700">
                          Este pago ha sido procesado correctamente. Gracias por su confianza.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3 justify-between rounded-b-2xl">
                <button
                  onClick={() => downloadBillingPDF(selectedBilling)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Descargar PDF
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
