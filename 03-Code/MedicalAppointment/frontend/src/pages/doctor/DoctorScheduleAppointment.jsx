import React, { useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { doctorAPI, appointmentAPI } from '../../services/api';

export default function DoctorScheduleAppointment() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [appointmentType, setAppointmentType] = useState('general');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [newRescheduleDate, setNewRescheduleDate] = useState('');
  const [newRescheduleTime, setNewRescheduleTime] = useState('');
  const [rescheduleSlots, setRescheduleSlots] = useState([]);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchPatients();
    fetchRecentAppointments();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      
      // Obtén TODOS los pacientes a través del endpoint del doctor
      const response = await doctorAPI.getAllPatients();
      const allPatients = response.data || (Array.isArray(response) ? response : []);
      
      console.log('✅ Todos los pacientes cargados:', allPatients.length);
      
      setPatients(allPatients);
    } catch (err) {
      console.error('❌ Error al cargar pacientes:', err);
      showNotification('Error al cargar los pacientes', 'error');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentAppointments = async () => {
    try {
      const response = await appointmentAPI.getDoctorAppointments();
      const appointments = Array.isArray(response) ? response : (response.data || []);
      
      // Filtrar citas: las más próximas en el futuro (próximas 7 días) + las pasadas recientes (últimas 24h)
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const recent = appointments
        .filter(apt => {
          const aptDate = new Date(apt.scheduled_start);
          // Mostrar: citas próximas (hasta 7 días) o pasadas recientes (últimas 24h)
          return (aptDate >= now && aptDate <= sevenDaysFromNow) || 
                 (aptDate >= oneDayAgo && aptDate < now);
        })
        .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start))
        .slice(0, 10); // Mostrar hasta 10 citas en lugar de 5
      
      console.log('✅ Citas recientes cargadas:', recent.length);
      setRecentAppointments(recent);
    } catch (err) {
      console.error('❌ Error al cargar citas recientes:', err);
    }
  };

  const fetchAvailableSlots = async (date) => {
    try {
      // Aquí irá la llamada a la API para obtener horarios disponibles
      // Por ahora, mostramos slots de ejemplo
      const mockSlots = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
      ];
      setAvailableSlots(mockSlots);
    } catch (err) {
      showNotification('Error al cargar horarios disponibles', 'error');
    }
  };

  const handleCreateAppointment = async (e) => {
    e.preventDefault();

    if (!selectedPatient || !selectedDate || !selectedTime) {
      showNotification('Por favor completa todos los campos', 'error');
      return;
    }

    try {
      setLoading(true);
      // Combinar fecha y hora
      const dateTime = new Date(`${selectedDate}T${selectedTime}`);
      
      await appointmentAPI.createByDoctor({
        patient_user_id: selectedPatient.id || selectedPatient.user_id,
        scheduled_start: dateTime.toISOString(),
        reason: reason || appointmentType,
      });

      showNotification('Cita agendada exitosamente', 'success');
      resetForm();
      
      // Recargar citas recientes después de agendar
      setTimeout(() => {
        fetchRecentAppointments();
      }, 500);
      
    } catch (err) {
      console.error('Error al agendar cita:', err);
      showNotification('Error al agendar la cita', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setSelectedDate('');
    setSelectedTime('');
    setAppointmentType('general');
    setReason('');
  };

  const handleRescheduleClick = async (appointment) => {
    setEditingAppointment(appointment);
    setShowRescheduleModal(true);
    setNewRescheduleDate('');
    setNewRescheduleTime('');
    setRescheduleSlots([]);
  };

  const handleRescheduleDate = (date) => {
    setNewRescheduleDate(date);
    // Cargar slots disponibles para la nueva fecha
    const mockSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ];
    setRescheduleSlots(mockSlots);
  };

  const handleRescheduleSubmit = async () => {
    if (!newRescheduleDate || !newRescheduleTime) {
      showNotification('Por favor selecciona fecha y hora', 'error');
      return;
    }

    try {
      setLoading(true);
      const newDateTime = new Date(`${newRescheduleDate}T${newRescheduleTime}`);
      
      await appointmentAPI.reschedule(editingAppointment.id, {
        scheduled_start: newDateTime.toISOString(),
      });

      showNotification('Cita reprogramada exitosamente', 'success');
      setShowRescheduleModal(false);
      setEditingAppointment(null);
      
      setTimeout(() => {
        fetchRecentAppointments();
      }, 500);
    } catch (err) {
      console.error('Error al reprogramar:', err);
      showNotification('Error al reprogramar la cita', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelClick = (appointment) => {
    setEditingAppointment(appointment);
    setShowCancelModal(true);
  };

  const handleCancelSubmit = async () => {
    try {
      setLoading(true);
      
      await appointmentAPI.cancel(editingAppointment.id);

      showNotification('Cita cancelada exitosamente', 'success');
      setShowCancelModal(false);
      setEditingAppointment(null);
      
      setTimeout(() => {
        fetchRecentAppointments();
      }, 500);
    } catch (err) {
      console.error('Error al cancelar:', err);
      showNotification('Error al cancelar la cita', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const getTodayDate = () => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Agendar Cita</h2>

        {notification && (
          <div
            className={`p-4 rounded-lg ${
              notification.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-400'
                : 'bg-red-100 text-red-800 border border-red-400'
            }`}
          >
            {notification.message}
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <form onSubmit={handleCreateAppointment} className="space-y-6">
            {/* Step 1: Select Patient */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Seleccionar Paciente
              </label>
              {loading && !patients.length ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              ) : patients.length === 0 ? (
                <div className="p-6 border-2 border-dashed border-yellow-300 rounded-lg bg-yellow-50">
                  <p className="text-yellow-800 font-medium mb-2">📋 No hay pacientes disponibles</p>
                  <p className="text-sm text-yellow-700 mb-3">
                    Los pacientes que agendes citas aparecerán aquí automáticamente. Para comenzar:
                  </p>
                  <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
                    <li>El paciente debe estar registrado en el sistema</li>
                    <li>Debe tener un perfil de paciente completado</li>
                    <li>Su cuenta debe estar activa</li>
                  </ul>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                  {patients.map(patient => (
                    <button
                      key={patient.id || patient.user_id}
                      type="button"
                      onClick={() => setSelectedPatient(patient)}
                      className={`p-4 rounded-lg border-2 text-left transition ${
                        selectedPatient?.id === patient.id || selectedPatient?.user_id === patient.user_id
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-400'
                      }`}
                    >
                      <h4 className="font-semibold text-gray-800">
                        {patient.first_name} {patient.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">{patient.cedula || 'Sin cédula'}</p>
                      <p className="text-xs text-gray-500">{patient.email || 'Sin email'}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedPatient && (
              <>
                {/* Step 2: Select Date and Time */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de la Cita
                    </label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      min={getTodayDate()}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Hora de la Cita
                    </label>
                    {selectedDate ? (
                      <select
                        value={selectedTime}
                        onChange={(e) => setSelectedTime(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      >
                        <option value="">Seleccionar hora...</option>
                        {availableSlots.map(slot => (
                          <option key={slot} value={slot}>
                            {slot}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="Selecciona una fecha primero"
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500"
                      />
                    )}
                  </div>
                </div>

                {/* Step 3: Appointment Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Consulta
                    </label>
                    <select
                      value={appointmentType}
                      onChange={(e) => setAppointmentType(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="general">Consulta General</option>
                      <option value="follow-up">Seguimiento</option>
                      <option value="evaluation">Evaluación</option>
                      <option value="procedure">Procedimiento</option>
                      <option value="emergency">Emergencia</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Motivo (Opcional)
                    </label>
                    <input
                      type="text"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Ej: Chequeo de presión"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Summary */}
                {selectedDate && selectedTime && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Resumen de la Cita</h3>
                    <div className="space-y-2 text-sm text-gray-700">
                      <p>
                        <strong>Paciente:</strong> {selectedPatient.first_name} {selectedPatient.last_name}
                      </p>
                      <p>
                        <strong>Fecha:</strong> {new Date(selectedDate).toLocaleDateString('es-ES')}
                      </p>
                      <p>
                        <strong>Hora:</strong> {selectedTime}
                      </p>
                      <p>
                        <strong>Tipo:</strong> {appointmentType === 'general' ? 'Consulta General' : appointmentType === 'follow-up' ? 'Seguimiento' : appointmentType === 'evaluation' ? 'Evaluación' : appointmentType === 'procedure' ? 'Procedimiento' : 'Emergencia'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Buttons */}
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 font-medium rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !selectedTime}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
                  >
                    {loading ? 'Agendando...' : 'Agendar Cita'}
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* Upcoming Scheduled Appointments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Citas Agendadas Recientemente</h3>
          {recentAppointments.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              <p>Las citas agendadas aparecerán aquí</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {new Date(appointment.scheduled_start).toLocaleTimeString('es-ES', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">
                      {appointment.patient_name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {appointment.reason || 'Consulta general'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(appointment.scheduled_start).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })} - {new Date(appointment.scheduled_start).toLocaleTimeString('es-ES', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </p>
                  </div>
                  <div className="flex-shrink-0 flex gap-2">
                    {appointment.status_code !== 'completed' && appointment.status_code !== 'cancelled' && new Date(appointment.scheduled_start) > new Date() && (
                      <>
                        <button
                          onClick={() => handleRescheduleClick(appointment)}
                          className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium transition"
                        >
                          Reprogramar
                        </button>
                        <button
                          onClick={() => handleCancelClick(appointment)}
                          className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium transition"
                        >
                          Cancelar
                        </button>
                      </>
                    )}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      appointment.status_code === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : appointment.status_code === 'cancelled'
                        ? 'bg-red-100 text-red-800'
                        : new Date(appointment.scheduled_start) < new Date()
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {appointment.status_label || (new Date(appointment.scheduled_start) < new Date() ? 'Completada' : 'Próxima')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reschedule Modal */}
        {showRescheduleModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Reprogramar Cita</h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>Paciente:</strong> {editingAppointment?.patient_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Cita actual:</strong> {editingAppointment && new Date(editingAppointment.scheduled_start).toLocaleString('es-ES')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Fecha
                  </label>
                  <input
                    type="date"
                    value={newRescheduleDate}
                    onChange={(e) => handleRescheduleDate(e.target.value)}
                    min={getTodayDate()}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {rescheduleSlots.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nueva Hora
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {rescheduleSlots.map((slot) => (
                        <button
                          key={slot}
                          onClick={() => setNewRescheduleTime(slot)}
                          className={`py-2 rounded-lg text-sm font-medium transition ${
                            newRescheduleTime === slot
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          }`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => setShowRescheduleModal(false)}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleRescheduleSubmit}
                    disabled={loading || !newRescheduleDate || !newRescheduleTime}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition font-medium"
                  >
                    {loading ? 'Guardando...' : 'Reprogramar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Cancelar Cita</h3>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 mb-2">
                  <strong>Advertencia:</strong> Esta acción no se puede deshacer.
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Paciente:</strong> {editingAppointment?.patient_name}
                </p>
                <p className="text-sm text-gray-700 mt-2">
                  <strong>Cita:</strong> {editingAppointment && new Date(editingAppointment.scheduled_start).toLocaleString('es-ES')}
                </p>
              </div>

              <p className="text-gray-600 mb-6">
                ¿Estás seguro de que deseas cancelar esta cita?
              </p>

              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition"
                >
                  No, mantener cita
                </button>
                <button
                  onClick={handleCancelSubmit}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-medium"
                >
                  {loading ? 'Cancelando...' : 'Sí, cancelar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
