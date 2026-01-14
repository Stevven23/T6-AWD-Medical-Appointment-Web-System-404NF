import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PatientLayout from '../../layouts/PatientLayout';
import { doctorAPI, specialtyAPI, appointmentAPI } from '../../services/api';
import {
  MagnifyingGlassIcon,
  CalendarIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
} from '@heroicons/react/24/outline';

export default function NewAppointment() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [notification, setNotification] = useState(null);

  const [specialties, setSpecialties] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);

  const [searchParams, setSearchParams] = useState({
    specialty_id: '',
    doctor_id: '',
    date: '',
  });

  const [selectedSlot, setSelectedSlot] = useState(null);
  const [appointmentDetails, setAppointmentDetails] = useState({
    reason: '',
    notes: '',
  });

  useEffect(() => {
    loadSpecialties();
  }, []);

  useEffect(() => {
    if (searchParams.specialty_id) {
      loadDoctorsBySpecialty(searchParams.specialty_id);
    }
  }, [searchParams.specialty_id]);

  useEffect(() => {
    if (searchParams.doctor_id && searchParams.date) {
      loadAvailableSlots();
    }
  }, [searchParams.doctor_id, searchParams.date]);

  const loadSpecialties = async () => {
    try {
      const response = await specialtyAPI.getAll();
      setSpecialties(response.data);
    } catch (error) {
      showNotification('Error al cargar especialidades', 'error');
    }
  };

  const loadDoctorsBySpecialty = async (specialtyId) => {
    try {
      setLoading(true);
      const response = await doctorAPI.getBySpecialty(specialtyId);
      setDoctors(response.data);
    } catch (error) {
      showNotification('Error al cargar doctores', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableSlots = async () => {
    try {
      setLoading(true);
      const response = await appointmentAPI.getAvailableSlots(
        searchParams.doctor_id,
        searchParams.date
      );
      // El backend devuelve { slots: [...] }
      const slots = response.data.slots || response.data || [];
      console.log('Available slots:', slots);
      setAvailableSlots(Array.isArray(slots) ? slots : []);
    } catch (error) {
      console.error('Error loading slots:', error);
      showNotification('Error al cargar horarios disponibles', 'error');
      setAvailableSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (field, value) => {
    setSearchParams((prev) => ({ ...prev, [field]: value }));
    if (field === 'specialty_id') {
      setSearchParams((prev) => ({ ...prev, doctor_id: '', date: '' }));
      setDoctors([]);
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
    if (field === 'doctor_id') {
      setSearchParams((prev) => ({ ...prev, date: '' }));
      setAvailableSlots([]);
      setSelectedSlot(null);
    }
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedSlot) {
      showNotification('Por favor seleccione un horario', 'error');
      return;
    }

    try {
      setLoading(true);
      
      // Construir scheduled_start combinando fecha y hora
      const scheduledStart = `${searchParams.date}T${selectedSlot.start}:00`;
      
      console.log('Creating appointment with:', {
        doctor_id: searchParams.doctor_id,
        scheduled_start: scheduledStart,
        reason: appointmentDetails.reason,
        notes: appointmentDetails.notes,
      });
      
      await appointmentAPI.create({
        doctor_id: searchParams.doctor_id,
        scheduled_start: scheduledStart,
        reason: appointmentDetails.reason,
        notes: appointmentDetails.notes,
      });
      
      showNotification('Cita agendada exitosamente', 'success');
      setTimeout(() => navigate('/patient/appointments'), 2000);
    } catch (error) {
      console.error('Error creating appointment:', error);
      showNotification(
        error.response?.data?.error || 'Error al agendar la cita',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('es-EC', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-EC', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="p-6 border-b border-gray-200">
            <button
              onClick={() => navigate('/patient/appointments')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
            >
              <ArrowLeftIcon className="h-5 w-5" />
              Volver a Mis Citas
            </button>
            <h1 className="text-2xl font-bold text-gray-900">
              Agendar Nueva Cita
            </h1>
            <p className="text-gray-600 mt-1">
              Busque por especialidad, doctor y seleccione un horario disponible
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    step >= 1
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  1
                </div>
                <div
                  className={`w-24 h-1 ${
                    step >= 2 ? 'bg-blue-600' : 'bg-gray-200'
                  }`}
                ></div>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full ${
                    step >= 2
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  2
                </div>
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especialidad *
                    </label>
                    <select
                      value={searchParams.specialty_id}
                      onChange={(e) =>
                        handleSearchChange('specialty_id', e.target.value)
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccione una especialidad</option>
                      {specialties.map((specialty) => (
                        <option key={specialty.id} value={specialty.id}>
                          {specialty.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Doctor *
                    </label>
                    <select
                      value={searchParams.doctor_id}
                      onChange={(e) =>
                        handleSearchChange('doctor_id', e.target.value)
                      }
                      disabled={!searchParams.specialty_id}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccione un doctor</option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.first_name} {doctor.last_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha *
                    </label>
                    <input
                      type="date"
                      value={searchParams.date}
                      onChange={(e) =>
                        handleSearchChange('date', e.target.value)
                      }
                      min={getTodayDate()}
                      disabled={!searchParams.doctor_id}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {loading && (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                )}

                {!loading &&
                  searchParams.doctor_id &&
                  searchParams.date &&
                  availableSlots.length === 0 && (
                    <div className="text-center py-12">
                      <CalendarIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        No hay horarios disponibles
                      </h3>
                      <p className="text-gray-600">
                        No se encontraron horarios disponibles para la fecha
                        seleccionada. Por favor intente con otra fecha.
                      </p>
                    </div>
                  )}

                {!loading && availableSlots.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Horarios Disponibles para {formatDate(searchParams.date)}
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                      {availableSlots.map((slot, index) => (
                        <button
                          key={index}
                          onClick={() => handleSlotSelect(slot)}
                          className="px-4 py-3 border-2 border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-all font-medium text-center"
                        >
                          <ClockIcon className="h-5 w-5 mx-auto mb-1" />
                          {formatTime(slot.start)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Resumen de la Cita
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Especialidad</p>
                      <p className="font-semibold text-gray-900">
                        {
                          specialties.find(
                            (s) => s.id === searchParams.specialty_id
                          )?.name
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Doctor</p>
                      <p className="font-semibold text-gray-900">
                        Dr.{' '}
                        {
                          doctors.find((d) => d.id === searchParams.doctor_id)
                            ?.first_name
                        }{' '}
                        {
                          doctors.find((d) => d.id === searchParams.doctor_id)
                            ?.last_name
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Fecha</p>
                      <p className="font-semibold text-gray-900">
                        {formatDate(searchParams.date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Hora</p>
                      <p className="font-semibold text-gray-900">
                        {selectedSlot && formatTime(selectedSlot.start)}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motivo de la Consulta *
                  </label>
                  <input
                    type="text"
                    value={appointmentDetails.reason}
                    onChange={(e) =>
                      setAppointmentDetails((prev) => ({
                        ...prev,
                        reason: e.target.value,
                      }))
                    }
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ej: Control de rutina, dolor de cabeza, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas Adicionales (Opcional)
                  </label>
                  <textarea
                    value={appointmentDetails.notes}
                    onChange={(e) =>
                      setAppointmentDetails((prev) => ({
                        ...prev,
                        notes: e.target.value,
                      }))
                    }
                    rows="4"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Información adicional que el doctor deba conocer..."
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setSelectedSlot(null);
                    }}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      'Agendando...'
                    ) : (
                      <>
                        <CheckCircleIcon className="h-5 w-5" />
                        Confirmar Cita
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
