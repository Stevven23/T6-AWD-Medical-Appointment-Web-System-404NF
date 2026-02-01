import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { crudApi } from '../../services/httpClient';
import {
  BellIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  PaperAirplaneIcon,
  CalendarIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function NotificationsManagement() {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    target: 'all', // all, patients, doctors
    channels: ['email'],
  });

  useEffect(() => {
    loadReminders();
  }, [statusFilter, typeFilter]);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter !== 'all') params.status = statusFilter;
      if (typeFilter !== 'all') params.type = typeFilter;
      
      const response = await crudApi.get('/reminders', { params });
      setReminders(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error loading reminders:', error);
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const retryReminder = async (reminderId) => {
    try {
      await crudApi.post(`/reminders/${reminderId}/retry`);
      showNotificationMessage('Recordatorio reenviado', 'success');
      loadReminders();
    } catch (error) {
      console.error('Error retrying reminder:', error);
      showNotificationMessage('Error al reenviar', 'error');
    }
  };

  const cancelReminder = async (reminderId) => {
    try {
      await crudApi.patch(`/reminders/${reminderId}`, { status: 'cancelled' });
      showNotificationMessage('Recordatorio cancelado', 'success');
      loadReminders();
    } catch (error) {
      console.error('Error cancelling reminder:', error);
      showNotificationMessage('Error al cancelar', 'error');
    }
  };

  const sendAnnouncement = async () => {
    try {
      await crudApi.post('/notifications/broadcast', announcementForm);
      showNotificationMessage('Anuncio enviado exitosamente', 'success');
      setShowAnnouncementModal(false);
      setAnnouncementForm({
        title: '',
        message: '',
        target: 'all',
        channels: ['email'],
      });
    } catch (error) {
      console.error('Error sending announcement:', error);
      showNotificationMessage('Error al enviar anuncio', 'error');
    }
  };

  const showNotificationMessage = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      sent: { bg: 'bg-green-100', text: 'text-green-800', label: 'Enviado' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Fallido' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelado' },
    };
    const style = styles[status] || styles.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        {style.label}
      </span>
    );
  };

  const getReminderTypeIcon = (type) => {
    switch (type) {
      case 'email':
        return <EnvelopeIcon className="w-4 h-4" />;
      case 'sms':
        return <DevicePhoneMobileIcon className="w-4 h-4" />;
      default:
        return <BellIcon className="w-4 h-4" />;
    }
  };

  const filteredReminders = reminders.filter(reminder => {
    const search = searchTerm.toLowerCase();
    const patientName = `${reminder.patient?.first_name || ''} ${reminder.patient?.last_name || ''}`.toLowerCase();
    return patientName.includes(search);
  });

  const stats = {
    total: reminders.length,
    pending: reminders.filter(r => r.status === 'pending').length,
    sent: reminders.filter(r => r.status === 'sent').length,
    failed: reminders.filter(r => r.status === 'failed').length,
  };

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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Notificaciones y Recordatorios</h2>
            <p className="text-gray-600">Gestión de recordatorios de citas y anuncios del sistema</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadReminders}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <ArrowPathIcon className="w-5 h-5" />
              Actualizar
            </button>
            <button
              onClick={() => setShowAnnouncementModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              <PaperAirplaneIcon className="w-5 h-5" />
              Enviar Anuncio
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <BellIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Recordatorios</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-full">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pendientes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Enviados</p>
                <p className="text-2xl font-bold text-green-600">{stats.sent}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Fallidos</p>
                <p className="text-2xl font-bold text-red-600">{stats.failed}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-400" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
          </div>
          
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="sent">Enviados</option>
            <option value="failed">Fallidos</option>
            <option value="cancelled">Cancelados</option>
          </select>
          
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">Todos los tipos</option>
            <option value="email">Email</option>
            <option value="sms">SMS</option>
            <option value="push">Push</option>
          </select>
        </div>

        {/* Reminders Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
            </div>
          ) : filteredReminders.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <BellIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron recordatorios</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paciente</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cita</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Programado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enviado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredReminders.map((reminder) => (
                    <tr key={reminder.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="p-1 bg-gray-100 rounded">
                            {getReminderTypeIcon(reminder.reminder_type)}
                          </span>
                          <span className="text-sm text-gray-700 capitalize">
                            {reminder.reminder_type}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900">
                          {reminder.patient?.first_name} {reminder.patient?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {reminder.patient?.email}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="w-4 h-4 text-gray-400" />
                          #{reminder.appointment_id}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {formatDate(reminder.scheduled_time)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">
                        {reminder.sent_at ? formatDate(reminder.sent_at) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(reminder.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {reminder.status === 'failed' && (
                            <button
                              onClick={() => retryReminder(reminder.id)}
                              className="p-1 text-gray-400 hover:text-green-600 rounded"
                              title="Reintentar"
                            >
                              <ArrowPathIcon className="w-5 h-5" />
                            </button>
                          )}
                          {reminder.status === 'pending' && (
                            <button
                              onClick={() => cancelReminder(reminder.id)}
                              className="p-1 text-gray-400 hover:text-red-600 rounded"
                              title="Cancelar"
                            >
                              <XCircleIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Announcement Modal */}
        {showAnnouncementModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-xl font-bold text-gray-800">Enviar Anuncio del Sistema</h3>
                <p className="text-sm text-gray-500">Envía una notificación masiva a usuarios</p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Título
                  </label>
                  <input
                    type="text"
                    value={announcementForm.title}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    placeholder="Título del anuncio"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mensaje
                  </label>
                  <textarea
                    value={announcementForm.message}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                    placeholder="Contenido del mensaje..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Destinatarios
                  </label>
                  <select
                    value={announcementForm.target}
                    onChange={(e) => setAnnouncementForm(prev => ({ ...prev, target: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="all">Todos los usuarios</option>
                    <option value="patients">Solo pacientes</option>
                    <option value="doctors">Solo doctores</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Canales
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={announcementForm.channels.includes('email')}
                        onChange={(e) => {
                          const channels = e.target.checked
                            ? [...announcementForm.channels, 'email']
                            : announcementForm.channels.filter(c => c !== 'email');
                          setAnnouncementForm(prev => ({ ...prev, channels }));
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <EnvelopeIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Email</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={announcementForm.channels.includes('sms')}
                        onChange={(e) => {
                          const channels = e.target.checked
                            ? [...announcementForm.channels, 'sms']
                            : announcementForm.channels.filter(c => c !== 'sms');
                          setAnnouncementForm(prev => ({ ...prev, channels }));
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <DevicePhoneMobileIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">SMS</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={announcementForm.channels.includes('push')}
                        onChange={(e) => {
                          const channels = e.target.checked
                            ? [...announcementForm.channels, 'push']
                            : announcementForm.channels.filter(c => c !== 'push');
                          setAnnouncementForm(prev => ({ ...prev, channels }));
                        }}
                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      />
                      <BellIcon className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-700">Push</span>
                    </label>
                  </div>
                </div>
              </div>
              
              <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                <button
                  onClick={() => setShowAnnouncementModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={sendAnnouncement}
                  disabled={!announcementForm.title || !announcementForm.message}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <PaperAirplaneIcon className="w-5 h-5" />
                  Enviar Anuncio
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
