import React, { useEffect, useState } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { DoctorModel, SpecialtyModel, AppointmentModel } from '../../models';
import { crudApi, businessApi } from '../../services/httpClient';
import {
  CheckCircleIcon,
  UserPlusIcon,
  XCircleIcon,
  ArrowPathIcon,
  BuildingOffice2Icon,
  ClockIcon,
  CalendarDaysIcon,
} from '@heroicons/react/24/outline';

const getMonthDays = (year, month) => {
  const date = new Date(year, month, 1);
  const days = [];
  const firstDayIndex = date.getDay();
  date.setDate(date.getDate() - firstDayIndex);
  for (let i = 0; i < 42; i++) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
};

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export default function AdminCalendar() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [consultationRooms, setConsultationRooms] = useState([]);
  const [filters, setFilters] = useState({ doctor_id: '', specialty_id: '', status: '' });
  const [current, setCurrent] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [dayAppointments, setDayAppointments] = useState([]);
  const [notification, setNotification] = useState(null);
  
  // Action modals
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Action forms
  const [cancelReason, setCancelReason] = useState('');
  const [newDoctorId, setNewDoctorId] = useState('');
  const [newRoomId, setNewRoomId] = useState('');
  // Reschedule form
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleReason, setRescheduleReason] = useState('');

  useEffect(() => {
    fetchDoctors();
    fetchSpecialties();
    fetchRooms();
    loadAppointments();
  }, []);

  const fetchDoctors = async () => {
    try {
      const response = await DoctorModel.getAll();
      setDoctors(response.data || response || []);
    } catch (err) {
      console.error('Error loading doctors:', err);
      setDoctors([]);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const response = await SpecialtyModel.getActive();
      setSpecialties(response.data || response || []);
    } catch (err) {
      console.error('Error loading specialties:', err);
      setSpecialties([]);
    }
  };
  
  const fetchRooms = async () => {
    try {
      const response = await crudApi.get('/consultation-rooms');
      setConsultationRooms(response.data.data || response.data || []);
    } catch (err) {
      console.error('Error loading rooms:', err);
      setConsultationRooms([]);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const loadAppointments = async (extraParams = {}) => {
    setLoading(true);
    setError('');
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (user.role !== 'admin') {
        setError('Solo los administradores pueden ver todas las citas');
        setAppointments([]);
        setLoading(false);
        return;
      }

      const response = await AppointmentModel.getAll(extraParams);
      setAppointments(response.data || response || []);
    } catch (err) {
      console.error('Error loading appointments:', err);
      if (err.response?.status === 501) {
        setAppointments([]);
        setError('');
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        setError('No tienes permisos para ver las citas.');
        setAppointments([]);
      } else {
        setError(err.response?.data?.message || err.message || 'Error cargando citas');
        setAppointments([]);
      }
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const q = {};
    if (filters.doctor_id) q.doctorId = filters.doctor_id;
    if (filters.specialty_id) q.specialtyId = filters.specialty_id;
    if (filters.status) q.status = filters.status;
    loadAppointments(q);
  };

  const handleDayClick = (day) => {
    const key = day.toISOString().split('T')[0];
    const appts = appointments.filter(a => {
      const d = new Date(a.scheduled_start);
      return d.toISOString().split('T')[0] === key;
    });
    setSelectedDay(day);
    setDayAppointments(appts);
  };

  // Admin actions
  const confirmAppointment = async (apt) => {
    try {
      setActionLoading(true);
      await crudApi.patch(`/appointments/${apt.id}/confirm`);
      showNotification('Cita confirmada exitosamente');
      refreshDayAppointments();
    } catch (err) {
      showNotification('Error al confirmar cita', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const checkInPatient = async (apt) => {
    try {
      setActionLoading(true);
      await crudApi.patch(`/appointments/${apt.id}/check-in`);
      showNotification('Check-in registrado');
      refreshDayAppointments();
    } catch (err) {
      showNotification('Error al registrar check-in', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelAppointment = async () => {
    if (!selectedAppointment) return;
    try {
      setActionLoading(true);
      await crudApi.patch(`/appointments/${selectedAppointment.id}/cancel`, { 
        reason: cancelReason || 'Cancelada por administración' 
      });
      showNotification('Cita cancelada');
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedAppointment(null);
      refreshDayAppointments();
    } catch (err) {
      showNotification('Error al cancelar cita', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const reassignDoctor = async () => {
    if (!selectedAppointment || !newDoctorId) return;
    try {
      setActionLoading(true);
      await crudApi.patch(`/appointments/${selectedAppointment.id}`, { 
        doctor_id: newDoctorId 
      });
      showNotification('Doctor reasignado exitosamente');
      setShowReassignModal(false);
      setNewDoctorId('');
      setSelectedAppointment(null);
      refreshDayAppointments();
    } catch (err) {
      showNotification('Error al reasignar doctor', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const assignRoom = async () => {
    if (!selectedAppointment || !newRoomId) return;
    try {
      setActionLoading(true);
      await crudApi.patch(`/appointments/${selectedAppointment.id}`, { 
        consultation_room_id: newRoomId 
      });
      showNotification('Consultorio asignado');
      setShowRoomModal(false);
      setNewRoomId('');
      setSelectedAppointment(null);
      refreshDayAppointments();
    } catch (err) {
      showNotification('Error al asignar consultorio', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const rescheduleAppointment = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return;
    try {
      setActionLoading(true);
      // Calculate new scheduled_start and scheduled_end (preserve original duration)
      const originalStart = new Date(selectedAppointment.scheduled_start);
      const originalEnd = new Date(selectedAppointment.scheduled_end);
      const durationMs = originalEnd - originalStart;
      
      const newStart = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
      const newEnd = new Date(newStart.getTime() + durationMs);
      
      // Use business API endpoint for reschedule
      await businessApi.put(`/scheduling/reschedule/${selectedAppointment.id}`, { 
        scheduled_start: newStart.toISOString(),
        scheduled_end: newEnd.toISOString(),
        reason: rescheduleReason || 'Reagendado por administración'
      });
      showNotification('Cita reagendada exitosamente');
      setShowRescheduleModal(false);
      setRescheduleDate('');
      setRescheduleTime('');
      setRescheduleReason('');
      setSelectedAppointment(null);
      refreshDayAppointments();
    } catch (err) {
      showNotification(err.message || 'Error al reagendar cita', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const refreshDayAppointments = () => {
    loadAppointments();
    if (selectedDay) {
      setTimeout(() => {
        const key = selectedDay.toISOString().split('T')[0];
        const appts = appointments.filter(a => {
          const d = new Date(a.scheduled_start);
          return d.toISOString().split('T')[0] === key;
        });
        setDayAppointments(appts);
      }, 500);
    }
  };

  const downloadReport = () => {
    const csvHeader = 'ID,Fecha,Hora Inicio,Hora Fin,Paciente,Doctor,Especialidad,Estado,Motivo\n';
    const csvRows = appointments.map(a => {
      const start = new Date(a.scheduled_start);
      const end = new Date(a.scheduled_end);
      return [
        a.id,
        start.toLocaleDateString('es-EC'),
        start.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
        end.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
        a.patient_name || 'N/A',
        a.doctor_name || 'N/A',
        a.specialty_name || 'N/A',
        a.status_label || a.status_code || 'N/A',
        (a.reason || '').replace(/,/g, ';')
      ].join(',');
    }).join('\n');

    const csv = csvHeader + csvRows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-citas-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const days = getMonthDays(current.getFullYear(), current.getMonth());
  const countsByDay = {};
  appointments.forEach((a) => {
    const d = new Date(a.scheduled_start);
    const key = d.toISOString().split('T')[0];
    countsByDay[key] = (countsByDay[key] || 0) + 1;
  });

  const summary = appointments.reduce((acc, a) => {
    acc[a.status_code] = (acc[a.status_code] || 0) + 1;
    return acc;
  }, {});

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold">Calendario de Citas</h2>
            <p className="text-gray-600 text-sm mt-1">Gestión administrativa de citas médicas</p>
          </div>
          <button 
            onClick={downloadReport}
            disabled={appointments.length === 0}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Descargar Reporte
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-lg shadow">
            <div className="text-sm text-blue-600 font-medium">Confirmadas</div>
            <div className="text-3xl font-bold text-blue-700 mt-1">{summary.confirmed || 0}</div>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg shadow">
            <div className="text-sm text-yellow-600 font-medium">Pendientes</div>
            <div className="text-3xl font-bold text-yellow-700 mt-1">{summary.pending || summary.scheduled || 0}</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg shadow">
            <div className="text-sm text-red-600 font-medium">Canceladas</div>
            <div className="text-3xl font-bold text-red-700 mt-1">{summary.cancelled || summary.canceled || 0}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg shadow">
            <div className="text-sm text-gray-600 font-medium">Total</div>
            <div className="text-3xl font-bold text-gray-700 mt-1">{appointments.length}</div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow mb-6">
          <div className="flex gap-3 items-center flex-wrap">
            <select 
              value={filters.doctor_id} 
              onChange={(e) => setFilters((s) => ({ ...s, doctor_id: e.target.value }))} 
              className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los doctores</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.users?.first_name} {d.users?.last_name}</option>
              ))}
            </select>

            <select 
              value={filters.specialty_id} 
              onChange={(e) => setFilters((s) => ({ ...s, specialty_id: e.target.value }))} 
              className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las especialidades</option>
              {specialties.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>

            <select 
              value={filters.status} 
              onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))} 
              className="border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los estados</option>
              <option value="scheduled">Programada</option>
              <option value="confirmed">Confirmada</option>
              <option value="completed">Completada</option>
              <option value="cancelled">Cancelada</option>
            </select>

            <button 
              onClick={applyFilters} 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Aplicar Filtros
            </button>

            <button 
              onClick={() => {
                setFilters({ doctor_id: '', specialty_id: '', status: '' });
                loadAppointments();
              }}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
            >
              Limpiar
            </button>
          </div>
        </div>

        {loading && <div className="text-center py-8 text-gray-600">Cargando citas...</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center justify-between mb-6">
            <button 
              onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))} 
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Anterior
            </button>
            
            <h3 className="text-xl font-bold text-gray-800">
              {MONTHS[current.getMonth()]} {current.getFullYear()}
            </h3>
            
            <button 
              onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))} 
              className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 flex items-center gap-2"
            >
              Siguiente
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
              <div key={d} className="text-center font-semibold text-gray-700 py-2">{d}</div>
            ))}

            {days.map((day) => {
              const key = day.toISOString().split('T')[0];
              const count = countsByDay[key] || 0;
              const isCurrentMonth = day.getMonth() === current.getMonth();
              const isToday = day.toDateString() === new Date().toDateString();
              
              return (
                <div 
                  key={key} 
                  onClick={() => count > 0 && handleDayClick(day)}
                  className={`p-2 h-24 border rounded transition-all ${
                    isCurrentMonth ? 'bg-white' : 'bg-gray-50 opacity-50'
                  } ${isToday ? 'border-blue-500 border-2' : 'border-gray-200'} ${
                    count > 0 ? 'cursor-pointer hover:bg-blue-50 hover:shadow' : ''
                  }`}
                >
                  <div className={`text-sm ${isToday ? 'font-bold text-blue-600' : 'text-gray-600'}`}>
                    {day.getDate()}
                  </div>
                  {count > 0 && (
                    <div className="mt-2 bg-blue-500 text-white text-xs px-2 py-1 rounded text-center font-medium">
                      {count} {count === 1 ? 'cita' : 'citas'}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {selectedDay && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[80vh] overflow-auto">
              <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
                <h3 className="text-xl font-bold text-gray-800">
                  Citas del {selectedDay.toLocaleDateString('es-EC', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </h3>
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="p-6">
                {dayAppointments.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No hay citas para este día</p>
                ) : (
                  <div className="space-y-4">
                    {dayAppointments.map((apt) => {
                      const start = new Date(apt.scheduled_start);
                      const end = new Date(apt.scheduled_end);
                      
                      return (
                        <div key={apt.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="font-semibold text-lg text-gray-800">
                                {start.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                <span className="font-medium">Paciente:</span> {apt.patient_name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Doctor:</span> {apt.doctor_name || 'N/A'}
                              </div>
                              <div className="text-sm text-gray-600">
                                <span className="font-medium">Especialidad:</span> {apt.specialty_name || 'N/A'}
                              </div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              apt.status_code === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                              apt.status_code === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                              apt.status_code === 'completed' ? 'bg-green-100 text-green-700' :
                              apt.status_code === 'cancelled' ? 'bg-red-100 text-red-700' :
                              apt.status_code === 'checked_in' ? 'bg-purple-100 text-purple-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {apt.status_label || apt.status_code}
                            </span>
                          </div>
                          {apt.reason && (
                            <div className="mt-3 text-sm text-gray-700">
                              <span className="font-medium">Motivo:</span> {apt.reason}
                            </div>
                          )}
                          {apt.room_name && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">Consultorio:</span> {apt.room_name} {apt.room_number ? `- ${apt.room_number}` : ''}
                            </div>
                          )}
                          
                          {/* Admin Action Buttons */}
                          {apt.status_code !== 'completed' && apt.status_code !== 'cancelled' && (
                            <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
                              {/* Confirm Button */}
                              {apt.status_code === 'scheduled' && (
                                <button
                                  onClick={() => confirmAppointment(apt)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
                                >
                                  <CheckCircleIcon className="w-4 h-4" />
                                  Confirmar
                                </button>
                              )}
                              
                              {/* Check-in Button */}
                              {(apt.status_code === 'confirmed' || apt.status_code === 'scheduled') && !apt.checked_in_at && (
                                <button
                                  onClick={() => checkInPatient(apt)}
                                  disabled={actionLoading}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 disabled:opacity-50"
                                >
                                  <UserPlusIcon className="w-4 h-4" />
                                  Check-in
                                </button>
                              )}
                              
                              {/* Assign Room Button */}
                              <button
                                onClick={() => {
                                  setSelectedAppointment(apt);
                                  setShowRoomModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
                              >
                                <BuildingOffice2Icon className="w-4 h-4" />
                                {apt.room_name ? 'Cambiar Sala' : 'Asignar Sala'}
                              </button>
                              
                              {/* Reassign Doctor Button */}
                              <button
                                onClick={() => {
                                  setSelectedAppointment(apt);
                                  setShowReassignModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100"
                              >
                                <ArrowPathIcon className="w-4 h-4" />
                                Reasignar Doctor
                              </button>
                              
                              {/* Reschedule Button */}
                              <button
                                onClick={() => {
                                  setSelectedAppointment(apt);
                                  // Pre-fill date and time from current appointment
                                  const start = new Date(apt.scheduled_start);
                                  setRescheduleDate(start.toISOString().split('T')[0]);
                                  setRescheduleTime(start.toTimeString().slice(0, 5));
                                  setShowRescheduleModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100"
                              >
                                <CalendarDaysIcon className="w-4 h-4" />
                                Reagendar
                              </button>
                              
                              {/* Cancel Button */}
                              <button
                                onClick={() => {
                                  setSelectedAppointment(apt);
                                  setShowCancelModal(true);
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                              >
                                <XCircleIcon className="w-4 h-4" />
                                Cancelar
                              </button>
                            </div>
                          )}
                          
                          {/* Timestamps Section */}
                          <div className="mt-3 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2 text-xs text-gray-500">
                            {apt.confirmed_at && (
                              <div className="flex items-center gap-1">
                                <CheckCircleIcon className="w-3 h-3 text-blue-500" />
                                <span>Confirmada: {new Date(apt.confirmed_at).toLocaleString('es-EC', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            )}
                            {apt.checked_in_at && (
                              <div className="flex items-center gap-1">
                                <UserPlusIcon className="w-3 h-3 text-purple-500" />
                                <span>Check-in: {new Date(apt.checked_in_at).toLocaleString('es-EC', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            )}
                            {apt.started_at && (
                              <div className="flex items-center gap-1">
                                <ClockIcon className="w-3 h-3 text-green-500" />
                                <span>Iniciada: {new Date(apt.started_at).toLocaleString('es-EC', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            )}
                            {apt.completed_at && (
                              <div className="flex items-center gap-1">
                                <CheckCircleIcon className="w-3 h-3 text-green-600" />
                                <span>Completada: {new Date(apt.completed_at).toLocaleString('es-EC', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            )}
                            {apt.cancelled_at && (
                              <div className="flex items-center gap-1 col-span-2">
                                <XCircleIcon className="w-3 h-3 text-red-500" />
                                <span>Cancelada: {new Date(apt.cancelled_at).toLocaleString('es-EC', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} - {apt.cancellation_reason || 'Sin motivo'}</span>
                              </div>
                            )}
                            {apt.rescheduled_at && (
                              <div className="flex items-center gap-1 col-span-2">
                                <CalendarDaysIcon className="w-3 h-3 text-indigo-500" />
                                <span>Reagendada: {new Date(apt.rescheduled_at).toLocaleString('es-EC', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })} - {apt.reschedule_reason || 'Sin motivo'}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Cancel Modal */}
        {showCancelModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Cancelar Cita</h3>
              <p className="text-sm text-gray-600 mb-4">
                ¿Está seguro que desea cancelar esta cita?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Motivo de cancelación</label>
                <textarea
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500"
                  placeholder="Ingrese el motivo..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCancelModal(false);
                    setSelectedAppointment(null);
                    setCancelReason('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={cancelAppointment}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  Confirmar Cancelación
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reassign Doctor Modal */}
        {showReassignModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Reasignar Doctor</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar nuevo doctor</label>
                <select
                  value={newDoctorId}
                  onChange={(e) => setNewDoctorId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un doctor</option>
                  {doctors.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.users?.first_name || d.first_name} {d.users?.last_name || d.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowReassignModal(false);
                    setSelectedAppointment(null);
                    setNewDoctorId('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={reassignDoctor}
                  disabled={actionLoading || !newDoctorId}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  Reasignar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Room Modal */}
        {showRoomModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Asignar Consultorio</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Seleccionar consultorio</label>
                <select
                  value={newRoomId}
                  onChange={(e) => setNewRoomId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Seleccione un consultorio</option>
                  {consultationRooms.filter(r => r.is_available).map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.room_number} (Piso {r.floor})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRoomModal(false);
                    setSelectedAppointment(null);
                    setNewRoomId('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={assignRoom}
                  disabled={actionLoading || !newRoomId}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  Asignar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Reagendar Cita</h3>
              <p className="text-sm text-gray-600 mb-4">
                Cita actual: {selectedAppointment.patient_name} con {selectedAppointment.doctor_name}
              </p>
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva fecha</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nueva hora</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Motivo administrativo</label>
                  <textarea
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej: Solicitud del paciente, cambio de disponibilidad del doctor..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRescheduleModal(false);
                    setSelectedAppointment(null);
                    setRescheduleDate('');
                    setRescheduleTime('');
                    setRescheduleReason('');
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={rescheduleAppointment}
                  disabled={actionLoading || !rescheduleDate || !rescheduleTime}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Reagendar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div className={`fixed bottom-4 right-4 z-[70] p-4 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.message}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}