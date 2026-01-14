import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PatientLayout from '../../layouts/PatientLayout';
import { appointmentAPI } from '../../services/api';
import {
  CalendarIcon,
  ClockIcon,
  XMarkIcon,
  PencilIcon,
  PlusIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentAPI.getPatientAppointments();
      setAppointments(response.data);
    } catch (error) {
      showNotification('Error al cargar las citas', 'error');
      console.error('Error loading appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelAppointment = async () => {
    try {
      await appointmentAPI.cancel(selectedAppointment.id);
      showNotification('Cita cancelada exitosamente', 'success');
      setShowCancelModal(false);
      setSelectedAppointment(null);
      loadAppointments();
    } catch (error) {
      showNotification(
        error.response?.data?.error || 'Error al cancelar la cita',
        'error'
      );
    }
  };

  const openCancelModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-blue-100 text-blue-800',
      confirmed: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };

    const labels = {
      scheduled: 'Programada',
      confirmed: 'Confirmada',
      completed: 'Completada',
      cancelled: 'Cancelada',
      pending: 'Pendiente',
    };

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('es-EC', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredAppointments = appointments.filter((apt) => {
    const matchesStatus = !statusFilter || apt.status === statusFilter;
    const matchesSearch =
      !searchTerm ||
      `${apt.doctor?.first_name} ${apt.doctor?.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      apt.specialty?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const upcomingAppointments = filteredAppointments.filter(
    (apt) => new Date(apt.date) >= new Date() && apt.status !== 'cancelled'
  );

  const pastAppointments = filteredAppointments.filter(
    (apt) => new Date(apt.date) < new Date() || apt.status === 'cancelled'
  );

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
        {notification && (
          <div
            className={`p-4 rounded-lg ${
              notification.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
            }`}
          >
            {notification.message}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Mis Citas</h1>
              <p className="text-gray-600 mt-1">
                Gestiona tus citas médicas programadas
              </p>
            </div>
            <Link
              to="/patient/new-appointment"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <PlusIcon className="h-5 w-5" />
              Nueva Cita
            </Link>
          </div>

          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por doctor o especialidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los Estados</option>
              <option value="scheduled">Programada</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
              <option value="pending">Pendiente</option>
            </select>
          </div>

          <div className="space-y-6">
            {upcomingAppointments.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Próximas Citas
                </h2>
                <div className="space-y-4">
                  {upcomingAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-gradient-to-r from-white to-blue-50"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Dr. {appointment.doctor?.first_name}{' '}
                                {appointment.doctor?.last_name}
                              </h3>
                              <p className="text-gray-600 text-sm">
                                {appointment.specialty?.name}
                              </p>
                            </div>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-gray-700">
                              <CalendarIcon className="h-5 w-5 text-blue-600" />
                              <span className="text-sm">
                                {formatDateTime(appointment.date)}
                              </span>
                            </div>
                            {appointment.reason && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <ClockIcon className="h-5 w-5 text-blue-600" />
                                <span className="text-sm">
                                  {appointment.reason}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {appointment.status !== 'cancelled' &&
                            appointment.status !== 'completed' && (
                              <button
                                onClick={() => openCancelModal(appointment)}
                                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium text-sm"
                              >
                                Cancelar
                              </button>
                            )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pastAppointments.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Historial de Citas
                </h2>
                <div className="space-y-4">
                  {pastAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-gray-50"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">
                                Dr. {appointment.doctor?.first_name}{' '}
                                {appointment.doctor?.last_name}
                              </h3>
                              <p className="text-gray-600 text-sm">
                                {appointment.specialty?.name}
                              </p>
                            </div>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="flex items-center gap-2 text-gray-700">
                              <CalendarIcon className="h-5 w-5 text-gray-600" />
                              <span className="text-sm">
                                {formatDateTime(appointment.date)}
                              </span>
                            </div>
                            {appointment.reason && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <ClockIcon className="h-5 w-5 text-gray-600" />
                                <span className="text-sm">
                                  {appointment.reason}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredAppointments.length === 0 && (
              <div className="text-center py-12">
                <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  No hay citas
                </h3>
                <p className="text-gray-600 mb-6">
                  No se encontraron citas con los filtros aplicados
                </p>
                <Link
                  to="/patient/new-appointment"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  <PlusIcon className="h-5 w-5" />
                  Agendar Nueva Cita
                </Link>
              </div>
            )}
          </div>
        </div>

        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">
                  Confirmar Cancelación
                </h3>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <p className="text-gray-600 mb-6">
                ¿Está seguro que desea cancelar la cita con{' '}
                <strong>
                  Dr. {selectedAppointment?.doctor?.first_name}{' '}
                  {selectedAppointment?.doctor?.last_name}
                </strong>{' '}
                programada para el{' '}
                <strong>
                  {selectedAppointment && formatDateTime(selectedAppointment.date)}
                </strong>
                ?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  No, mantener cita
                </button>
                <button
                  onClick={handleCancelAppointment}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Sí, cancelar cita
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
