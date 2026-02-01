import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EyeIcon,
  BanknotesIcon,
  PrinterIcon,
} from '@heroicons/react/24/outline';
import { BillingModel } from '../../models';

export default function BillingManagement() {
  const [billings, setBillings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [notification, setNotification] = useState(null);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    paid: 0,
    totalAmount: 0,
    pendingAmount: 0,
  });

  // Modal states
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedBilling, setSelectedBilling] = useState(null);
  
  // Payment form
  const [paymentData, setPaymentData] = useState({
    payment_method: 'cash',
    reference_number: '',
    notes: '',
    insurance_provider_id: '',
    insurance_claim_number: '',
  });

  useEffect(() => {
    loadBillings();
  }, [statusFilter]);

  const loadBillings = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const response = await BillingModel.getAll(params);
      const data = response.data || response || [];
      setBillings(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading billings:', error);
      showNotification('Error al cargar facturas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const pending = data.filter(b => b.status === 'pending');
    const paid = data.filter(b => b.status === 'paid');
    
    setStats({
      total: data.length,
      pending: pending.length,
      paid: paid.length,
      totalAmount: data.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0),
      pendingAmount: pending.reduce((sum, b) => sum + (parseFloat(b.amount) || 0), 0),
    });
  };

  const handleProcessPayment = async () => {
    if (!selectedBilling) return;

    try {
      await BillingModel.processPayment(selectedBilling.id, paymentData);
      showNotification('Pago procesado exitosamente', 'success');
      setShowPaymentModal(false);
      setPaymentData({ payment_method: 'cash', reference_number: '', notes: '' });
      loadBillings();
    } catch (error) {
      console.error('Error processing payment:', error);
      showNotification('Error al procesar el pago', 'error');
    }
  };

  const openPaymentModal = (billing) => {
    setSelectedBilling(billing);
    setShowPaymentModal(true);
  };

  const openDetailModal = (billing) => {
    setSelectedBilling(billing);
    setShowDetailModal(true);
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
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
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendiente', icon: ClockIcon },
      paid: { color: 'bg-green-100 text-green-800', label: 'Pagado', icon: CheckCircleIcon },
      cancelled: { color: 'bg-red-100 text-red-800', label: 'Cancelado', icon: XCircleIcon },
      overdue: { color: 'bg-red-100 text-red-800', label: 'Vencido', icon: XCircleIcon },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    );
  };

  const filteredBillings = billings.filter(billing => {
    const searchLower = searchTerm.toLowerCase();
    const patientName = `${billing.patient?.first_name || ''} ${billing.patient?.last_name || ''}`.toLowerCase();
    const invoiceNumber = billing.invoice_number?.toLowerCase() || '';
    return patientName.includes(searchLower) || invoiceNumber.includes(searchLower);
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Gestión de Facturación</h2>
            <p className="text-gray-600">Administra facturas y pagos</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Facturas</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-gray-800">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pagados</p>
                <p className="text-2xl font-bold text-gray-800">{stats.paid}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <CurrencyDollarIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Por Cobrar</p>
                <p className="text-2xl font-bold text-gray-800">{formatCurrency(stats.pendingAmount)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por paciente o número de factura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos</option>
                <option value="pending">Pendientes</option>
                <option value="paid">Pagados</option>
                <option value="overdue">Vencidos</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
          </div>
        </div>

        {/* Billings Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredBillings.length === 0 ? (
            <div className="text-center py-12">
              <DocumentTextIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-600">No hay facturas</h3>
              <p className="text-gray-400">Las facturas aparecerán aquí</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Factura
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paciente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredBillings.map((billing) => (
                  <tr key={billing.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {billing.invoice_number || `#${billing.id?.slice(0, 8)}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {billing.patient?.first_name} {billing.patient?.last_name}
                      </div>
                      <div className="text-xs text-gray-500">{billing.patient?.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(billing.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {formatCurrency(billing.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(billing.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDetailModal(billing)}
                          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          title="Ver detalle"
                        >
                          <EyeIcon className="w-5 h-5" />
                        </button>
                        {billing.status === 'pending' && (
                          <button
                            onClick={() => openPaymentModal(billing)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                            title="Registrar pago"
                          >
                            <BanknotesIcon className="w-5 h-5" />
                          </button>
                        )}
                        <button
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Imprimir"
                        >
                          <PrinterIcon className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Payment Modal */}
        {showPaymentModal && selectedBilling && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="p-6 border-b">
                <h3 className="text-lg font-semibold text-gray-800">Registrar Pago</h3>
                <p className="text-sm text-gray-500">
                  Factura: {selectedBilling.invoice_number || `#${selectedBilling.id?.slice(0, 8)}`}
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600">Monto a Pagar</p>
                  <p className="text-2xl font-bold text-blue-800">
                    {formatCurrency(selectedBilling.amount)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Método de Pago
                  </label>
                  <select
                    value={paymentData.payment_method}
                    onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Efectivo</option>
                    <option value="card">Tarjeta de Crédito/Débito</option>
                    <option value="transfer">Transferencia Bancaria</option>
                    <option value="insurance">Seguro Médico</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Número de Referencia (opcional)
                  </label>
                  <input
                    type="text"
                    value={paymentData.reference_number}
                    onChange={(e) => setPaymentData({...paymentData, reference_number: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Ej: Número de transacción"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={paymentData.notes}
                    onChange={(e) => setPaymentData({...paymentData, notes: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleProcessPayment}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Confirmar Pago
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedBilling && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Detalle de Factura</h3>
                  <p className="text-sm text-gray-500">
                    {selectedBilling.invoice_number || `#${selectedBilling.id?.slice(0, 8)}`}
                  </p>
                </div>
                {getStatusBadge(selectedBilling.status)}
              </div>
              
              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Paciente</p>
                    <p className="font-medium">
                      {selectedBilling.patient?.first_name} {selectedBilling.patient?.last_name}
                    </p>
                    <p className="text-sm text-gray-500">{selectedBilling.patient?.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Fecha de Emisión</p>
                    <p className="font-medium">{formatDate(selectedBilling.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Fecha de Vencimiento</p>
                    <p className="font-medium">{formatDate(selectedBilling.due_date) || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Método de Pago</p>
                    <p className="font-medium">{selectedBilling.payment_method || 'N/A'}</p>
                  </div>
                </div>

                {/* Desglose de Montos */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">{formatCurrency(selectedBilling.subtotal || selectedBilling.base_amount)}</span>
                  </div>
                  {selectedBilling.insurance_discount_percentage > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Descuento Seguro ({selectedBilling.insurance_discount_percentage}%)</span>
                      <span>-{formatCurrency(selectedBilling.insurance_discount_amount)}</span>
                    </div>
                  )}
                  {selectedBilling.tax_amount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Impuestos ({selectedBilling.tax_percentage || 0}%)</span>
                      <span className="font-medium">{formatCurrency(selectedBilling.tax_amount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-gray-200">
                    <span className="font-semibold text-gray-800">Total</span>
                    <span className="font-bold text-xl">{formatCurrency(selectedBilling.total_amount || selectedBilling.amount)}</span>
                  </div>
                </div>

                {/* Información del Seguro */}
                {(selectedBilling.insurance_provider_id || selectedBilling.insurance_provider) && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-800 mb-2">Información del Seguro</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-blue-600">Aseguradora</p>
                        <p className="font-medium text-blue-900">{selectedBilling.insurance_provider?.name || selectedBilling.insurance_provider || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">% Descuento</p>
                        <p className="font-medium text-blue-900">{selectedBilling.insurance_discount_percentage || 0}%</p>
                      </div>
                      <div>
                        <p className="text-blue-600">N° de Claim</p>
                        <p className="font-medium text-blue-900">{selectedBilling.insurance_claim_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-blue-600">Monto Descuento</p>
                        <p className="font-medium text-blue-900">{formatCurrency(selectedBilling.insurance_discount_amount)}</p>
                      </div>
                    </div>
                  </div>
                )}

                {selectedBilling.paid_at && (
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-sm text-green-600">Pagado el</p>
                    <p className="font-medium text-green-800">{formatDate(selectedBilling.paid_at)}</p>
                    {selectedBilling.payment_method && (
                      <p className="text-sm text-green-700 mt-1">Método: {selectedBilling.payment_method}</p>
                    )}
                  </div>
                )}

                {selectedBilling.notes && (
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Notas</p>
                    <p className="text-gray-700">{selectedBilling.notes}</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t bg-gray-50 flex gap-3 justify-end">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  <PrinterIcon className="w-4 h-4" />
                  Imprimir
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
