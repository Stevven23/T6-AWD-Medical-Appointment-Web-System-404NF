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
  ChevronLeftIcon,
  ChevronRightIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  ExclamationTriangleIcon,
  UserIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolidIcon } from '@heroicons/react/24/solid';

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

const STATUS_COLORS = {
  scheduled: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300', icon: ClockIcon },
  confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', icon: CheckCircleIcon },
  completed: { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300', icon: CheckCircleSolidIcon },
  cancelled: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: XCircleIcon },
  checked_in: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300', icon: UserPlusIcon },
  no_show: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', icon: ExclamationTriangleIcon },
};

export default function AdminCalendar() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [consultationRooms, setConsultationRooms] = useState([]);
  const [filters, setFilters] = useState({ doctor_id: '', specialty_id: '', status: '' });
  const [showFilters, setShowFilters] = useState(false);
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
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    fetchDoctors();
    fetchSpecialties();
    fetchRooms();
    loadAppointments();
  }, []);

  // Fetch available slots when reschedule date changes
  useEffect(() => {
    if (rescheduleDate && selectedAppointment?.doctor_id) {
      fetchAvailableSlots(selectedAppointment.doctor_id, rescheduleDate);
    }
  }, [rescheduleDate, selectedAppointment?.doctor_id]);

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

  const fetchAvailableSlots = async (doctorId, date) => {
    try {
      setLoadingSlots(true);
      const response = await businessApi.get(`/availability/doctor/${doctorId}/date/${date}`);
      const slots = response.data?.data?.slots || response.data?.slots || response.data || [];
      setAvailableSlots(Array.isArray(slots) ? slots : []);
    } catch (err) {
      console.error('Error loading slots:', err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
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
    setDayAppointments(appts.sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start)));
  };

  // Admin actions
  const confirmAppointment = async (apt) => {
    try {
      setActionLoading(true);
      await crudApi.patch(`/appointments/${apt.id}/confirm`);
      showNotification('Cita confirmada exitosamente');
      refreshDayAppointments();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error al confirmar cita', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const checkInPatient = async (apt) => {
    try {
      setActionLoading(true);
      await crudApi.patch(`/appointments/${apt.id}/check-in`);
      showNotification('Check-in registrado exitosamente');
      refreshDayAppointments();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error al registrar check-in', 'error');
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
      showNotification('Cita cancelada exitosamente');
      setShowCancelModal(false);
      setCancelReason('');
      setSelectedAppointment(null);
      refreshDayAppointments();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error al cancelar cita', 'error');
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
      showNotification(err.response?.data?.message || 'Error al reasignar doctor', 'error');
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
      showNotification('Consultorio asignado exitosamente');
      setShowRoomModal(false);
      setNewRoomId('');
      setSelectedAppointment(null);
      refreshDayAppointments();
    } catch (err) {
      showNotification(err.response?.data?.message || 'Error al asignar consultorio', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const rescheduleAppointment = async () => {
    if (!selectedAppointment || !rescheduleDate || !rescheduleTime) return;
    try {
      setActionLoading(true);
      const originalStart = new Date(selectedAppointment.scheduled_start);
      const originalEnd = new Date(selectedAppointment.scheduled_end);
      const durationMs = originalEnd - originalStart;
      
      const newStart = new Date(`${rescheduleDate}T${rescheduleTime}:00`);
      const newEnd = new Date(newStart.getTime() + durationMs);
      
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
      setAvailableSlots([]);
      setSelectedAppointment(null);
      refreshDayAppointments();
    } catch (err) {
      showNotification(err.response?.data?.message || err.message || 'Error al reagendar cita', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const refreshDayAppointments = async () => {
    await loadAppointments();
    if (selectedDay) {
      setTimeout(() => {
        const key = selectedDay.toISOString().split('T')[0];
        setDayAppointments(prev => {
          const filtered = appointments.filter(a => {
            const d = new Date(a.scheduled_start);
            return d.toISOString().split('T')[0] === key;
          });
          return filtered.sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
        });
      }, 500);
    }
  };

  const downloadReport = () => {
    const csvHeader = 'ID,Fecha,Hora Inicio,Hora Fin,Paciente,Doctor,Especialidad,Estado,Motivo,Consultorio\n';
    const csvRows = appointments.map(a => {
      const start = new Date(a.scheduled_start);
      const end = new Date(a.scheduled_end);
      return [
        a.id,
        start.toLocaleDateString('es-EC'),
        start.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
        end.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
        (a.patient_name || 'N/A').replace(/,/g, ';'),
        (a.doctor_name || 'N/A').replace(/,/g, ';'),
        (a.specialty_name || 'N/A').replace(/,/g, ';'),
        a.status_label || a.status_code || 'N/A',
        (a.reason || '').replace(/,/g, ';'),
        (a.room_name || 'Sin asignar').replace(/,/g, ';')
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

  // Calculate summary properly checking all possible status values
  const summary = appointments.reduce((acc, a) => {
    const code = a.status_code?.toLowerCase() || '';
    if (code === 'confirmed') acc.confirmed++;
    else if (code === 'scheduled' || code === 'pending') acc.pending++;
    else if (code === 'cancelled' || code === 'canceled') acc.cancelled++;
    else if (code === 'completed') acc.completed++;
    else if (code === 'checked_in') acc.checked_in++;
    else if (code === 'no_show') acc.no_show++;
    return acc;
  }, { confirmed: 0, pending: 0, cancelled: 0, completed: 0, checked_in: 0, no_show: 0 });

  const getStatusStyle = (statusCode) => {
    const code = statusCode?.toLowerCase() || 'scheduled';
    return STATUS_COLORS[code] || STATUS_COLORS.scheduled;
  };

  // Get appointments by status for a specific day
  const getAppointmentsByStatusForDay = (dayKey) => {
    const dayAppts = appointments.filter(a => {
      const d = new Date(a.scheduled_start);
      return d.toISOString().split('T')[0] === dayKey;
    });
    const result = { scheduled: 0, confirmed: 0, completed: 0, cancelled: 0, checked_in: 0 };
    dayAppts.forEach(a => {
      const code = a.status_code?.toLowerCase() || '';
      if (code === 'scheduled' || code === 'pending') result.scheduled++;
      else if (code === 'confirmed') result.confirmed++;
      else if (code === 'completed') result.completed++;
      else if (code === 'cancelled' || code === 'canceled') result.cancelled++;
      else if (code === 'checked_in') result.checked_in++;
    });
    return result;
  };

  return (
    <AdminLayout>
      <div className="bg-slate-50">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600 rounded-xl shadow-md flex-shrink-0">
                <CalendarDaysIcon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Calendario de Citas</h1>
                <p className="text-gray-500 text-sm">Gestión y seguimiento de citas médicas</p>
              </div>
            </div>
            <button 
              onClick={downloadReport}
              disabled={appointments.length === 0}
              style={{ backgroundColor: '#059669' }}
              className="flex items-center gap-2 px-5 py-2.5 text-white rounded-lg shadow-md hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Descargar Reporte
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-3 md:p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="p-2 bg-blue-100 rounded-lg mb-2">
                <CheckCircleIcon className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-blue-700">{summary.confirmed}</p>
              <p className="text-xs font-medium text-blue-600 mt-1">Confirmadas</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-amber-100 p-3 md:p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="p-2 bg-amber-100 rounded-lg mb-2">
                <ClockIcon className="w-5 h-5 text-amber-600" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-amber-700">{summary.pending}</p>
              <p className="text-xs font-medium text-amber-600 mt-1">Pendientes</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-purple-100 p-3 md:p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="p-2 bg-purple-100 rounded-lg mb-2">
                <UserPlusIcon className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-purple-700">{summary.checked_in}</p>
              <p className="text-xs font-medium text-purple-600 mt-1">Check-in</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-emerald-100 p-3 md:p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="p-2 bg-emerald-100 rounded-lg mb-2">
                <CheckCircleSolidIcon className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-emerald-700">{summary.completed}</p>
              <p className="text-xs font-medium text-emerald-600 mt-1">Completadas</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-red-100 p-3 md:p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="p-2 bg-red-100 rounded-lg mb-2">
                <XCircleIcon className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-red-700">{summary.cancelled}</p>
              <p className="text-xs font-medium text-red-600 mt-1">Canceladas</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 md:p-4 hover:shadow-md transition-shadow">
            <div className="flex flex-col items-center text-center">
              <div className="p-2 bg-slate-100 rounded-lg mb-2">
                <CalendarDaysIcon className="w-5 h-5 text-slate-600" />
              </div>
              <p className="text-2xl md:text-3xl font-bold text-slate-700">{appointments.length}</p>
              <p className="text-xs font-medium text-slate-600 mt-1">Total</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 overflow-hidden">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <FunnelIcon className="w-5 h-5 text-gray-500" />
              <span className="font-medium text-gray-700">Filtros</span>
              {(filters.doctor_id || filters.specialty_id || filters.status) && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                  Activos
                </span>
              )}
            </div>
            <ChevronRightIcon className={`w-5 h-5 text-gray-400 transition-transform ${showFilters ? 'rotate-90' : ''}`} />
          </button>
          
          {showFilters && (
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <div className="flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Doctor</label>
                  <select 
                    value={filters.doctor_id} 
                    onChange={(e) => setFilters((s) => ({ ...s, doctor_id: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Todos los doctores</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.first_name || d.users?.first_name} {d.last_name || d.users?.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Especialidad</label>
                  <select 
                    value={filters.specialty_id} 
                    onChange={(e) => setFilters((s) => ({ ...s, specialty_id: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Todas las especialidades</option>
                    {specialties.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-gray-600 mb-1.5">Estado</label>
                  <select 
                    value={filters.status} 
                    onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))} 
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  >
                    <option value="">Todos los estados</option>
                    <option value="scheduled">Programada</option>
                    <option value="confirmed">Confirmada</option>
                    <option value="checked_in">Check-in</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={applyFilters} 
                    className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors"
                  >
                    Aplicar
                  </button>
                  <button 
                    onClick={() => {
                      setFilters({ doctor_id: '', specialty_id: '', status: '' });
                      loadAppointments();
                    }}
                    className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 font-medium transition-colors"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Cargando citas...</span>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl mb-6 flex items-center gap-3">
            <ExclamationTriangleIcon className="w-6 h-6 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Calendar */}
        {!loading && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))} 
                className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                <ChevronLeftIcon className="w-5 h-5" />
                <span className="hidden md:inline">Anterior</span>
              </button>
              
              <div className="text-center">
                <h3 className="text-xl md:text-2xl font-bold text-gray-800">
                  {MONTHS[current.getMonth()]} {current.getFullYear()}
                </h3>
                <button 
                  onClick={() => setCurrent(new Date())}
                  className="text-xs text-blue-600 hover:text-blue-700 mt-0.5"
                >
                  Ir a hoy
                </button>
              </div>
              
              <button 
                onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))} 
                className="flex items-center gap-1 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors text-sm"
              >
                <span className="hidden md:inline">Siguiente</span>
                <ChevronRightIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((d, i) => (
                <div key={i} className="text-center font-semibold text-gray-400 text-xs py-2 uppercase">{d}</div>
              ))}

              {days.map((day) => {
                const key = day.toISOString().split('T')[0];
                const count = countsByDay[key] || 0;
                const isCurrentMonth = day.getMonth() === current.getMonth();
                const isToday = day.toDateString() === new Date().toDateString();
                const isSelected = selectedDay && day.toDateString() === selectedDay.toDateString();
                
                return (
                  <div 
                    key={key} 
                    onClick={() => handleDayClick(day)}
                    className={`p-1.5 md:p-2 min-h-[70px] md:min-h-[90px] border rounded-lg transition-all cursor-pointer ${
                      isCurrentMonth ? 'bg-white hover:bg-blue-50' : 'bg-gray-50/50 opacity-50'
                    } ${isToday ? 'ring-2 ring-blue-500 ring-offset-1' : 'border-gray-100'} ${
                      isSelected ? 'bg-blue-50 border-blue-300' : ''
                    } ${count > 0 ? 'hover:shadow-md' : ''}`}
                  >
                    <div className={`text-xs md:text-sm font-semibold mb-1 ${
                      isToday ? 'w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full mx-auto md:mx-0' : 
                      isCurrentMonth ? 'text-gray-700' : 'text-gray-400'
                    }`}>
                      {day.getDate()}
                    </div>
                    {count > 0 && (
                      <div className="mt-1 md:mt-2 text-xs font-semibold px-2 py-1 rounded-md text-center bg-blue-500 text-white">
                        {count} {count === 1 ? 'cita' : 'citas'}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Day Detail Modal */}
        {selectedDay && (
          <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-4 flex flex-col max-h-[calc(100vh-2rem)]">
              <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center rounded-t-2xl flex-shrink-0">
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedDay.toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </h3>
                  <p className="text-blue-100 text-sm mt-0.5">{dayAppointments.length} cita(s) programada(s)</p>
                </div>
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <XCircleIcon className="w-7 h-7" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                {dayAppointments.length === 0 ? (
                  <div className="text-center py-16">
                    <CalendarDaysIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No hay citas para este día</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dayAppointments.map((apt) => {
                      const start = new Date(apt.scheduled_start);
                      const end = new Date(apt.scheduled_end);
                      const statusStyle = getStatusStyle(apt.status_code);
                      const StatusIcon = statusStyle.icon;
                      
                      return (
                        <div key={apt.id} className={`border-2 ${statusStyle.border} rounded-2xl p-5 hover:shadow-lg transition-all bg-white`}>
                          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-3 flex-wrap">
                                <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                                  <ClockIcon className="w-4 h-4 text-gray-600" />
                                  <span className="font-bold text-gray-800">
                                    {start.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })} - {end.toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                </div>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                                  <StatusIcon className="w-4 h-4" />
                                  {apt.status_label || apt.status_code}
                                </span>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="flex items-start gap-2">
                                  <UserIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Paciente</p>
                                    <p className="font-semibold text-gray-800">{apt.patient_name || 'N/A'}</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start gap-2">
                                  <UserPlusIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                                  <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Doctor</p>
                                    <p className="font-semibold text-gray-800">{apt.doctor_name || 'N/A'}</p>
                                    <p className="text-sm text-gray-500">{apt.specialty_name || 'N/A'}</p>
                                  </div>
                                </div>
                                
                                {apt.room_name && (
                                  <div className="flex items-start gap-2">
                                    <MapPinIcon className="w-5 h-5 text-gray-400 mt-0.5" />
                                    <div>
                                      <p className="text-xs text-gray-500 uppercase tracking-wide">Consultorio</p>
                                      <p className="font-semibold text-gray-800">{apt.room_name} {apt.room_number ? `- ${apt.room_number}` : ''}</p>
                                    </div>
                                  </div>
                                )}
                                
                                {apt.reason && (
                                  <div className="md:col-span-2">
                                    <p className="text-xs text-gray-500 uppercase tracking-wide">Motivo</p>
                                    <p className="text-gray-700">{apt.reason}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {apt.status_code !== 'completed' && apt.status_code !== 'cancelled' && (
                              <div className="flex flex-wrap lg:flex-col gap-2 lg:min-w-[140px]">
                                <button
                                  onClick={() => { setSelectedAppointment(apt); setShowRoomModal(true); }}
                                  className="flex-1 lg:w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
                                >
                                  <BuildingOffice2Icon className="w-4 h-4" />
                                  Sala
                                </button>
                                
                                <button
                                  onClick={() => { setSelectedAppointment(apt); setShowReassignModal(true); }}
                                  className="flex-1 lg:w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
                                >
                                  <ArrowPathIcon className="w-4 h-4" />
                                  Reasignar
                                </button>
                                
                                <button
                                  onClick={() => {
                                    setSelectedAppointment(apt);
                                    setRescheduleDate(new Date(apt.scheduled_start).toISOString().split('T')[0]);
                                    setRescheduleTime('');
                                    setShowRescheduleModal(true);
                                  }}
                                  className="flex-1 lg:w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                  <CalendarDaysIcon className="w-4 h-4" />
                                  Reagendar
                                </button>
                                
                                <button
                                  onClick={() => { setSelectedAppointment(apt); setShowCancelModal(true); }}
                                  className="flex-1 lg:w-full inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                  Cancelar
                                </button>
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
              <div className="bg-red-600 text-white px-6 py-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <XCircleIcon className="w-6 h-6" />
                  Cancelar Cita
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">
                  ¿Está seguro que desea cancelar la cita de <strong>{selectedAppointment.patient_name}</strong>?
                </p>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Motivo de cancelación</label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    placeholder="Ingrese el motivo..."
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => { setShowCancelModal(false); setSelectedAppointment(null); setCancelReason(''); }}
                    className="flex-1 px-5 py-2.5 text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 font-medium transition-colors"
                  >
                    Volver
                  </button>
                  <button
                    onClick={cancelAppointment}
                    disabled={actionLoading}
                    className="flex-1 px-5 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium disabled:opacity-50 transition-colors"
                  >
                    {actionLoading ? 'Cancelando...' : 'Confirmar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reassign Doctor Modal */}
        {showReassignModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full my-auto">
              <div className="bg-amber-500 text-white px-6 py-4 rounded-t-xl">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ArrowPathIcon className="w-6 h-6" />
                  Reasignar Doctor
                </h3>
              </div>
              <div className="p-6">
                <p className="text-gray-600 mb-4">Doctor actual: <strong>{selectedAppointment.doctor_name}</strong></p>
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nuevo doctor</label>
                  <select
                    value={newDoctorId}
                    onChange={(e) => setNewDoctorId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  >
                    <option value="">Seleccione un doctor</option>
                    {doctors.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.first_name || d.users?.first_name} {d.last_name || d.users?.last_name} - {d.specialty_name || d.specialties?.name || ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setShowReassignModal(false); setSelectedAppointment(null); setNewDoctorId(''); }}
                    className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={reassignDoctor}
                    disabled={actionLoading || !newDoctorId}
                    className="flex-1 px-4 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading ? 'Reasignando...' : 'Reasignar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Room Modal */}
        {showRoomModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full my-auto">
              <div className="bg-teal-600 text-white px-6 py-4 rounded-t-xl">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <BuildingOffice2Icon className="w-6 h-6" />
                  Asignar Consultorio
                </h3>
              </div>
              <div className="p-6">
                {selectedAppointment.room_name && (
                  <p className="text-gray-600 mb-4">Actual: <strong>{selectedAppointment.room_name}</strong></p>
                )}
                <div className="mb-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Seleccionar consultorio</label>
                  <select
                    value={newRoomId}
                    onChange={(e) => setNewRoomId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  >
                    <option value="">Seleccione un consultorio</option>
                    {consultationRooms.filter(r => r.is_available).map(r => (
                      <option key={r.id} value={r.id}>{r.name} - {r.room_number} (Piso {r.floor})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setShowRoomModal(false); setSelectedAppointment(null); setNewRoomId(''); }}
                    className="flex-1 px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={assignRoom}
                    disabled={actionLoading || !newRoomId}
                    className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading ? 'Asignando...' : 'Asignar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reschedule Modal */}
        {showRescheduleModal && selectedAppointment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
              <div className="bg-indigo-600 text-white px-6 py-4">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <CalendarDaysIcon className="w-6 h-6" />
                  Reagendar Cita
                </h3>
              </div>
              <div className="p-6">
                <div className="bg-gray-50 rounded-lg p-4 mb-5">
                  <p className="text-sm text-gray-500">Cita actual</p>
                  <p className="font-semibold text-gray-800">{selectedAppointment.patient_name} con {selectedAppointment.doctor_name}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(selectedAppointment.scheduled_start).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long' })} - {new Date(selectedAppointment.scheduled_start).toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                
                <div className="space-y-4 mb-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nueva fecha</label>
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(e) => setRescheduleDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Horario disponible</label>
                    {loadingSlots ? (
                      <div className="flex items-center justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                        <span className="ml-2 text-gray-500">Cargando horarios...</span>
                      </div>
                    ) : availableSlots.length > 0 ? (
                      <div className="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                        {availableSlots.map((slot) => (
                          <button
                            key={slot.time}
                            type="button"
                            onClick={() => setRescheduleTime(slot.time)}
                            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                              rescheduleTime === slot.time
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-indigo-100'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    ) : rescheduleDate ? (
                      <div className="text-center py-4 bg-red-50 rounded-lg border border-red-200">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-500 mx-auto mb-2" />
                        <p className="text-red-700 text-sm">No hay horarios disponibles para esta fecha.</p>
                        <p className="text-red-600 text-xs mt-1">Por favor seleccione otra fecha.</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-sm text-center py-4">Seleccione una fecha para ver los horarios disponibles</p>
                    )}
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Motivo (opcional)</label>
                    <textarea
                      value={rescheduleReason}
                      onChange={(e) => setRescheduleReason(e.target.value)}
                      rows={2}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                      placeholder="Ej: Solicitud del paciente..."
                    />
                  </div>
                </div>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowRescheduleModal(false);
                      setSelectedAppointment(null);
                      setRescheduleDate('');
                      setRescheduleTime('');
                      setRescheduleReason('');
                      setAvailableSlots([]);
                    }}
                    className="flex-1 px-5 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={rescheduleAppointment}
                    disabled={actionLoading || !rescheduleDate || !rescheduleTime || availableSlots.length === 0}
                    className="flex-1 px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {actionLoading ? 'Reagendando...' : 'Reagendar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Toast */}
        {notification && (
          <div className={`fixed bottom-6 right-6 z-[70] p-4 rounded-2xl shadow-2xl flex items-center gap-3 ${
            notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}>
            {notification.type === 'success' ? <CheckCircleSolidIcon className="w-6 h-6" /> : <ExclamationTriangleIcon className="w-6 h-6" />}
            <span className="font-medium">{notification.message}</span>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
