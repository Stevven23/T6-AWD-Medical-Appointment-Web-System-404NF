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
    .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

  const paidTotal = billings
    .filter(b => b.status === 'paid')
    .reduce((sum, b) => sum + (parseFloat(b.total_amount) || 0), 0);

  const openDetail = (billing) => {
    setSelectedBilling(billing);
    setShowDetailModal(true);
  };

  // Generate PDF for a billing using jsPDF
  const downloadBillingPDF = (billing) => {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    const patientName = `${user?.first_name || ''} ${user?.last_name || ''}`.trim();
    const patientEmail = user?.email || '';
    const doctorName = billing.doctor_first_name 
      ? `Dr. ${billing.doctor_first_name} ${billing.doctor_last_name}`
      : billing.doctor?.users?.first_name
        ? `Dr. ${billing.doctor.users.first_name} ${billing.doctor.users.last_name}`
        : 'N/A';
    const specialty = billing.specialty_name || billing.doctor?.specialties?.name || 'Consulta General';
    const paymentMethodLabels = {
      cash: 'Efectivo',
      card: 'Tarjeta de Crédito/Débito',
      transfer: 'Transferencia Bancaria',
      insurance: 'Seguro Médico'
    };
    
    // Calculate correct amounts
    const subtotal = parseFloat(billing.subtotal) || parseFloat(billing.base_amount) || parseFloat(billing.total_amount) || 0;
    const discount = parseFloat(billing.insurance_discount_amount) || 0;
    const total = parseFloat(billing.total_amount) || (subtotal - discount);

    // Colors
    const primaryColor = [59, 130, 246]; // blue-500
    const textDark = [31, 41, 55]; // gray-800
    const textLight = [107, 114, 128]; // gray-500
    const greenColor = [22, 163, 74]; // green-600
    const yellowColor = [202, 138, 4]; // yellow-600

    // Header background
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    // Logo and clinic name
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont(undefined, 'bold');
    pdf.text('Clínica Médica', margin, 18);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('Sistema de Facturación', margin, 26);
    pdf.text('Tel: (02) 2XXX-XXXX | info@clinicamedica.com', margin, 32);

    // Invoice number on the right
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text(billing.invoice_number || 'BORRADOR', pageWidth - margin, 18, { align: 'right' });
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Emitida: ${formatDate(billing.created_at)}`, pageWidth - margin, 26, { align: 'right' });

    // Status badge
    y = 50;
    if (billing.status === 'paid') {
      pdf.setFillColor(220, 252, 231);
      pdf.roundedRect(pageWidth - margin - 35, y - 6, 35, 10, 2, 2, 'F');
      pdf.setTextColor(...greenColor);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text('PAGADA', pageWidth - margin - 17.5, y + 1, { align: 'center' });
    } else {
      pdf.setFillColor(254, 243, 199);
      pdf.roundedRect(pageWidth - margin - 35, y - 6, 35, 10, 2, 2, 'F');
      pdf.setTextColor(...yellowColor);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'bold');
      pdf.text('PENDIENTE', pageWidth - margin - 17.5, y + 1, { align: 'center' });
    }

    // Patient and Doctor sections
    y = 55;
    
    // Patient section
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y, (pageWidth - margin * 2 - 5) / 2, 35, 'F');
    pdf.setTextColor(...textDark);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('DATOS DEL PACIENTE', margin + 5, y + 8);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...textLight);
    pdf.text('Nombre:', margin + 5, y + 16);
    pdf.text('Correo:', margin + 5, y + 24);
    pdf.setTextColor(...textDark);
    pdf.text(patientName, margin + 25, y + 16);
    pdf.text(patientEmail, margin + 25, y + 24);

    // Doctor section
    const rightColX = margin + (pageWidth - margin * 2 - 5) / 2 + 5;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(rightColX, y, (pageWidth - margin * 2 - 5) / 2, 35, 'F');
    pdf.setTextColor(...textDark);
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'bold');
    pdf.text('SERVICIO MÉDICO', rightColX + 5, y + 8);
    pdf.setFont(undefined, 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...textLight);
    pdf.text('Médico:', rightColX + 5, y + 16);
    pdf.text('Especialidad:', rightColX + 5, y + 24);
    pdf.setTextColor(...textDark);
    pdf.text(doctorName, rightColX + 30, y + 16);
    pdf.text(specialty, rightColX + 30, y + 24);

    // Billing breakdown
    y = 100;
    pdf.setTextColor(...textDark);
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text('DESGLOSE DE FACTURACIÓN', margin, y);
    
    y += 8;
    pdf.setDrawColor(229, 231, 235);
    pdf.setLineWidth(0.5);
    pdf.line(margin, y, pageWidth - margin, y);

    // Table header
    y += 8;
    pdf.setFillColor(248, 250, 252);
    pdf.rect(margin, y - 4, pageWidth - margin * 2, 10, 'F');
    pdf.setFontSize(9);
    pdf.setFont(undefined, 'bold');
    pdf.text('Concepto', margin + 5, y + 2);
    pdf.text('Monto', pageWidth - margin - 5, y + 2, { align: 'right' });

    // Consultation row
    y += 14;
    pdf.setFont(undefined, 'normal');
    pdf.text(`Consulta Médica (${specialty})`, margin + 5, y);
    pdf.text(formatCurrency(subtotal), pageWidth - margin - 5, y, { align: 'right' });

    // Discount row
    if (discount > 0) {
      y += 10;
      pdf.setTextColor(...greenColor);
      pdf.text(`Descuento Seguro (${billing.insurance_discount_percentage || 0}%)`, margin + 5, y);
      pdf.text(`-${formatCurrency(discount)}`, pageWidth - margin - 5, y, { align: 'right' });
    }

    // Total row
    y += 12;
    pdf.setDrawColor(...primaryColor);
    pdf.setLineWidth(0.8);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 10;
    pdf.setTextColor(...textDark);
    pdf.setFontSize(12);
    pdf.setFont(undefined, 'bold');
    pdf.text('TOTAL A PAGAR', margin + 5, y);
    pdf.setTextColor(...primaryColor);
    pdf.setFontSize(16);
    pdf.text(formatCurrency(total), pageWidth - margin - 5, y, { align: 'right' });

    // Payment info section
    y += 20;
    if (billing.status === 'paid') {
      pdf.setFillColor(220, 252, 231);
      pdf.roundedRect(margin, y, pageWidth - margin * 2, 30, 3, 3, 'F');
      pdf.setTextColor(...greenColor);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('✓ PAGO REGISTRADO', margin + 10, y + 12);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Fecha de pago: ${formatDate(billing.payment_date)}`, margin + 10, y + 20);
      pdf.text(`Método: ${paymentMethodLabels[billing.payment_method] || billing.payment_method || 'N/A'}`, margin + 80, y + 20);
    } else {
      pdf.setFillColor(254, 243, 199);
      pdf.roundedRect(margin, y, pageWidth - margin * 2, 45, 3, 3, 'F');
      pdf.setTextColor(...yellowColor);
      pdf.setFontSize(11);
      pdf.setFont(undefined, 'bold');
      pdf.text('FACTURA PENDIENTE DE PAGO', margin + 10, y + 12);
      pdf.setFontSize(9);
      pdf.setFont(undefined, 'normal');
      pdf.setTextColor(120, 80, 20);
      pdf.text('Para realizar el pago, acérquese a la recepción de la clínica con esta factura.', margin + 10, y + 22);
      pdf.text('Métodos aceptados: Efectivo, Tarjeta de Crédito/Débito, Transferencia Bancaria', margin + 10, y + 30);
      pdf.text('Horario: Lunes a Viernes 8:00-18:00 | Sábados 8:00-13:00', margin + 10, y + 38);
    }

    // Footer
    pdf.setTextColor(...textLight);
    pdf.setFontSize(8);
    pdf.text('Este documento es un comprobante oficial de facturación médica', pageWidth / 2, 280, { align: 'center' });
    pdf.text('Clínica Médica - Gracias por su confianza', pageWidth / 2, 285, { align: 'center' });

    // Open PDF in new tab
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
                          {formatCurrency(billing.total_amount)}
                        </p>
                        {billing.status === 'paid' && billing.payment_date && (
                          <p className="text-xs text-green-600 mt-1">
                            Pagado el {formatDate(billing.payment_date)}
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
                    {(() => {
                      const subtotal = parseFloat(selectedBilling.subtotal) || parseFloat(selectedBilling.base_amount) || parseFloat(selectedBilling.total_amount) || 0;
                      const discount = parseFloat(selectedBilling.insurance_discount_amount) || 0;
                      const total = parseFloat(selectedBilling.total_amount) || (subtotal - discount);
                      
                      return (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Consulta Médica</span>
                            <span className="font-medium">{formatCurrency(subtotal)}</span>
                          </div>
                          {discount > 0 && (
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Descuento Seguro ({selectedBilling.insurance_discount_percentage || 0}%)</span>
                              <span className="font-medium text-green-600">-{formatCurrency(discount)}</span>
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
                              <span className="font-bold text-xl text-gray-900">{formatCurrency(total)}</span>
                            </div>
                          </div>
                        </>
                      );
                    })()}
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
