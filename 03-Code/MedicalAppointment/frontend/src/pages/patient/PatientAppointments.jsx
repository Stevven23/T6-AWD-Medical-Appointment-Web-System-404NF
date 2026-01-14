import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PatientLayout from '../../layouts/PatientLayout';
import { appointmentAPI } from '../../services/api';
import {
  CalendarIcon,
  ClockIcon,
  XMarkIcon,
  PlusIcon,
  MapPinIcon,
  UserIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

export default function PatientAppointments() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [notification, setNotification] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    loadAppointments();
  }, []);

  useEffect(() => {
    if (rescheduleDate && selectedAppointment) {
      loadAvailableSlots();
    }
  }, [rescheduleDate]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentAPI.getPatientAppointments();
      setAppointments(Array.isArray(response.data) ? response.data : []);
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

  const openRescheduleModal = (appointment) => {
    setSelectedAppointment(appointment);
    setShowRescheduleModal(true);
    setRescheduleDate('');
    setAvailableSlots([]);
    setSelectedSlot(null);
  };

  const loadAvailableSlots = async () => {
    if (!rescheduleDate || !selectedAppointment) return;

    try {
      setLoadingSlots(true);
      const response = await appointmentAPI.getAvailableSlots(
        selectedAppointment.doctor_id,
        rescheduleDate
      );
      // El backend devuelve { slots: [...] }
      const slots = Array.isArray(response.data?.slots) 
        ? response.data.slots 
        : Array.isArray(response.data) 
        ? response.data 
        : [];
      setAvailableSlots(slots);
    } catch (error) {
      showNotification('Error al cargar horarios disponibles', 'error');
      console.error('Error loading slots:', error);
      setAvailableSlots([]); // Resetear a array vacío en caso de error
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleReschedule = async () => {
    if (!selectedSlot) {
      showNotification('Por favor seleccione un horario', 'error');
      return;
    }

    try {
      // Construir la fecha y hora en formato ISO con zona horaria local
      // Asegurar formato correcto: YYYY-MM-DDTHH:MM:SS
      const timeString = selectedSlot.start.length === 5 
        ? `${selectedSlot.start}:00` 
        : selectedSlot.start;
      
      // Crear fecha en zona horaria local (Ecuador: UTC-5)
      const localDateTime = `${rescheduleDate}T${timeString}`;
      const date = new Date(localDateTime);
      
      // Convertir a ISO string para el backend (incluye zona horaria)
      const newScheduledStart = date.toISOString();
      
      console.log('Reagendando:', {
        fecha: rescheduleDate,
        hora: selectedSlot.start,
        fecha_local: localDateTime,
        fecha_iso: newScheduledStart
      });

      await appointmentAPI.reschedule(selectedAppointment.id, {
        new_scheduled_start: newScheduledStart,
      });
      showNotification('Cita reagendada exitosamente', 'success');
      setShowRescheduleModal(false);
      setSelectedAppointment(null);
      setRescheduleDate('');
      setAvailableSlots([]);
      setSelectedSlot(null);
      loadAppointments();
    } catch (error) {
      showNotification(
        error.response?.data?.error || 'Error al reagendar la cita',
        'error'
      );
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getStatusBadge = (status) => {
    const styles = {
      scheduled: 'bg-blue-500 text-white',
      confirmed: 'bg-green-500 text-white',
      completed: 'bg-gray-500 text-white',
      cancelled: 'bg-red-500 text-white',
      pending: 'bg-yellow-500 text-white',
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
        className={`px-3 py-1 rounded-md text-xs font-bold ${
          styles[status] || 'bg-gray-500 text-white'
        }`}
      >
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('es-EC', { month: 'short' }).toUpperCase(),
      time: date.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      fullDate: date.toLocaleDateString('es-EC', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    };
  };

  const filterAppointments = () => {
    const now = new Date();
    let filtered = appointments;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (apt) =>
          `${apt.doctor_first_name} ${apt.doctor_last_name}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          apt.specialty_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by tab
    switch (activeTab) {
      case 'upcoming':
        filtered = filtered.filter(
          (apt) => new Date(apt.scheduled_start) >= now && apt.status_code !== 'cancelled'
        );
        break;
      case 'past':
        filtered = filtered.filter(
          (apt) => new Date(apt.scheduled_start) < now && apt.status_code !== 'cancelled'
        );
        break;
      case 'cancelled':
        filtered = filtered.filter((apt) => apt.status_code === 'cancelled');
        break;
      default:
        break;
    }

    // Sort by date: newest first for 'all' tab, oldest first for others
    if (activeTab === 'all') {
      return filtered.sort((a, b) => new Date(b.scheduled_start) - new Date(a.scheduled_start));
    }
    return filtered.sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
  };

  const filteredAppointments = filterAppointments();

  const tabs = [
    { id: 'all', label: 'Todas' },
    { id: 'upcoming', label: 'Próximas' },
    { id: 'past', label: 'Pasadas' },
    { id: 'cancelled', label: 'Canceladas' },
  ];

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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Mis Citas</h1>
                <p className="text-gray-600 mt-1">Gestiona tus citas médicas programadas</p>
              </div>
              <Link
                to="/patient/new-appointment"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
              >
                <PlusIcon className="h-5 w-5" />
                Nueva Cita
              </Link>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-gray-200 bg-gray-50">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-semibold text-sm transition-colors`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Buscar por doctor o especialidad..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Appointments List */}
          <div className="p-6">
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay citas</h3>
                <p className="text-gray-600 mb-6">
                  {activeTab === 'all'
                    ? 'No tienes citas programadas'
                    : `No hay citas ${tabs.find((t) => t.id === activeTab)?.label.toLowerCase()}`}
                </p>
                <Link
                  to="/patient/new-appointment"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  <PlusIcon className="h-5 w-5" />
                  Agendar Nueva Cita
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => {
                  const dateInfo = formatDate(appointment.scheduled_start);
                  const isPast = new Date(appointment.scheduled_start) < new Date();

                  return (
                    <div
                      key={appointment.id}
                      className="border border-gray-200 rounded-xl hover:shadow-md transition-all overflow-hidden bg-white"
                    >
                      <div className="flex flex-col md:flex-row">
                        {/* Calendar Date Box */}
                        <div className={`flex-shrink-0 w-full md:w-32 flex md:flex-col items-center justify-center p-6 md:border-r border-gray-200 ${
                          isPast ? 'bg-gray-100' : 'bg-gradient-to-br from-green-100 to-green-200'
                        }`}>
                          <div className="text-center">
                            <div className={`text-5xl font-bold ${isPast ? 'text-gray-600' : 'text-green-700'}`}>
                              {dateInfo.day}
                            </div>
                            <div className={`text-sm font-semibold mt-1 ${isPast ? 'text-gray-500' : 'text-green-600'}`}>
                              {dateInfo.month}
                            </div>
                          </div>
                        </div>

                        {/* Appointment Details */}
                        <div className="flex-1 p-6">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="bg-gray-100 p-2 rounded-full">
                                <UserIcon className="h-6 w-6 text-gray-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-bold text-gray-900">
                                  Dr. {appointment.doctor_first_name} {appointment.doctor_last_name}
                                </h3>
                                <p className="text-sm text-gray-600">
                                  {appointment.specialty_name}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(appointment.status_code)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2 text-gray-700">
                              <div className="bg-blue-100 p-2 rounded-lg">
                                <ClockIcon className="h-4 w-4 text-blue-600" />
                              </div>
                              <div>
                                <p className="text-xs text-gray-500">Hora</p>
                                <p className="font-semibold text-sm">{dateInfo.time}</p>
                              </div>
                            </div>

                            {appointment.location && (
                              <div className="flex items-center gap-2 text-gray-700">
                                <div className="bg-purple-100 p-2 rounded-lg">
                                  <MapPinIcon className="h-4 w-4 text-purple-600" />
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Consultorio</p>
                                  <p className="font-semibold text-sm">{appointment.location}</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {appointment.reason && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                              <p className="text-xs text-gray-600 mb-1">
                                <span className="font-semibold">Motivo:</span>
                              </p>
                              <p className="text-sm text-gray-800">{appointment.reason}</p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          {appointment.status_code !== 'cancelled' &&
                            appointment.status_code !== 'completed' &&
                            !isPast && (
                              <div className="mt-4 flex gap-3">
                                <button
                                  onClick={() => openRescheduleModal(appointment)}
                                  className="px-4 py-2 border-2 border-blue-500 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-semibold text-sm flex items-center gap-2"
                                >
                                  <ArrowPathIcon className="h-4 w-4" />
                                  Reagendar
                                </button>
                                <button
                                  onClick={() => openCancelModal(appointment)}
                                  className="px-4 py-2 border-2 border-red-500 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-semibold text-sm"
                                >
                                  Cancelar Cita
                                </button>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Confirmar Cancelación</h3>
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
                  Dr. {selectedAppointment?.doctor_first_name}{' '}
                  {selectedAppointment?.doctor_last_name}
                </strong>
                ?
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  No, mantener
                </button>
                <button
                  onClick={handleCancelAppointment}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Sí, cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Reagendar Cita</h3>
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-gray-700">
                  <strong>Cita actual:</strong> Dr. {selectedAppointment?.doctor_first_name}{' '}
                  {selectedAppointment?.doctor_last_name}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Fecha actual:</strong>{' '}
                  {new Date(selectedAppointment?.scheduled_start).toLocaleString('es-EC', {
                    dateStyle: 'full',
                    timeStyle: 'short',
                  })}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Seleccione una nueva fecha
                  </label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => {
                      setRescheduleDate(e.target.value);
                      setSelectedSlot(null);
                    }}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {rescheduleDate && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Horarios Disponibles
                    </label>
                    {loadingSlots ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-gray-600 mt-4">Cargando horarios...</p>
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 rounded-lg">
                        <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600">No hay horarios disponibles para esta fecha</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-60 overflow-y-auto p-2">
                        {Array.isArray(availableSlots) && availableSlots.map((slot, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedSlot(slot)}
                            className={`px-4 py-3 rounded-lg text-sm font-semibold transition-all ${
                              selectedSlot?.start === slot.start
                                ? 'bg-blue-600 text-white shadow-lg scale-105'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {slot.start.substring(0, 5)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowRescheduleModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleReschedule}
                  disabled={!selectedSlot}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium ${
                    selectedSlot
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  Confirmar Reagendamiento
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
