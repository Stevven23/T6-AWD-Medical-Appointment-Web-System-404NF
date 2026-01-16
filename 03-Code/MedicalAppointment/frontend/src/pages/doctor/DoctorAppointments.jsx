import React, { useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { appointmentAPI } from '../../services/api';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

export default function DoctorAppointments() {
  const [currentDate, setCurrentDate] = useState(new Date(new Date().setDate(new Date().getDate() - new Date().getDay() + 1)));
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAppointmentDetail, setSelectedAppointmentDetail] = useState(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      fetchWeekAppointments();
    }
  }, [initialized]);

  const fetchWeekAppointments = async () => {
    try {
      setLoading(true);
      const response = await appointmentAPI.getDoctorAppointments();
      const appointmentsData = Array.isArray(response) ? response : response.data || [];
      
      // Filtrar citas con el mismo criterio que "Citas Agendadas Recientemente"
      // Próximas 7 días + últimas 24h
      const now = new Date();
      const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      
      const filteredAppointments = appointmentsData.filter(apt => {
        const aptDate = new Date(apt.scheduled_start);
        return (aptDate >= now && aptDate <= sevenDaysFromNow) || 
               (aptDate >= oneDayAgo && aptDate < now);
      });
      
      setAppointments(filteredAppointments);

      // Buscar la próxima cita más cercana para ir a esa semana
      const upcomingAppointments = filteredAppointments
        .filter(apt => new Date(apt.scheduled_start) >= now)
        .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));

      // Si hay citas futuras, ir a la semana de la primera
      if (upcomingAppointments.length > 0) {
        const nextAppointmentDate = new Date(upcomingAppointments[0].scheduled_start);
        const weekStart = new Date(nextAppointmentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        setCurrentDate(weekStart);
      }

      setInitialized(true);
    } catch (err) {
      setError('Error al cargar las citas');
      console.error(err);
      setInitialized(true);
    } finally {
      setLoading(false);
    }
  };

  const getWeekDays = () => {
    const week = [];
    const current = new Date(currentDate);
    for (let i = 0; i < 7; i++) {
      week.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return week;
  };

  const getAppointmentsForDay = (date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_start);
      return (
        aptDate.getDate() === date.getDate() &&
        aptDate.getMonth() === date.getMonth() &&
        aptDate.getFullYear() === date.getFullYear()
      );
    }).sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
  };

  const goToPreviousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const formatTime = (dateTime) => {
    return new Date(dateTime).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, // Forzar formato 24 horas
    });
  };

  const formatDayName = (date) => {
    return date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
  };

  const formatDate = (date) => {
    return date.getDate();
  };

  const weekDays = getWeekDays();
  const weekStart = weekDays[0];
  const weekEnd = weekDays[6];

  const workingHours = Array.from({ length: 10 }, (_, i) => i + 8); // 8 AM to 5 PM

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Agenda Semanal</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={goToPreviousWeek}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 min-w-48 text-center">
              {weekStart.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} -{' '}
              {weekEnd.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <button
              onClick={goToNextWeek}
              className="p-2 hover:bg-gray-200 rounded-lg transition"
            >
              <ChevronRightIcon className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <div className="min-w-max">
                {/* Day Headers */}
                <div className="flex">
                  <div className="w-16 bg-gray-50 border-b border-gray-200 p-2 font-semibold text-gray-700"></div>
                  {weekDays.map((day, idx) => (
                    <div
                      key={idx}
                      className={`flex-1 min-w-32 text-center p-2 border-b border-gray-200 ${
                        new Date().toDateString() === day.toDateString()
                          ? 'bg-blue-50 border-b-2 border-blue-600'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="font-medium text-xs text-gray-700">{formatDayName(day)}</div>
                      <div className={`text-base font-bold ${
                        new Date().toDateString() === day.toDateString()
                          ? 'text-blue-600'
                          : 'text-gray-600'
                      }`}>
                        {formatDate(day)}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Time Slots and Appointments */}
                {workingHours.map((hour) => (
                  <div key={hour} className="flex border-b border-gray-200">
                    <div className="w-16 bg-gray-50 p-2 text-center text-xs font-medium text-gray-600 border-r border-gray-200">
                      {hour}:00
                    </div>
                    {weekDays.map((day, dayIdx) => {
                      const dayAppointments = getAppointmentsForDay(day);
                      const hourAppointments = dayAppointments.filter(apt => {
                        const aptHour = new Date(apt.scheduled_start).getHours();
                        return aptHour === hour;
                      });

                      return (
                        <div
                          key={dayIdx}
                          className={`flex-1 min-w-32 p-1 relative min-h-12 ${
                            new Date().toDateString() === day.toDateString()
                              ? 'bg-blue-50'
                              : 'bg-white'
                          } hover:bg-gray-50 transition`}
                        >
                          {hourAppointments.map((apt, idx) => (
                            <div
                              key={idx}
                              onClick={() => setSelectedAppointmentDetail(apt)}
                              className={`mb-0.5 p-1 rounded text-xs font-semibold text-white truncate cursor-pointer hover:shadow-md transition ${
                                apt.status_code === 'completed'
                                  ? 'bg-green-500'
                                  : apt.status_code === 'cancelled'
                                  ? 'bg-red-500'
                                  : 'bg-blue-600'
                              }`}
                              title={`${apt.patient_name} - ${apt.reason || 'Consulta'}`}
                            >
                              <div className="font-bold text-xs">{formatTime(apt.scheduled_start)}</div>
                              <div className="truncate text-xs">
                                {apt.patient_name}
                              </div>
                            </div>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Modal de detalles de cita */}
        {selectedAppointmentDetail && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg p-6 max-w-sm w-full mx-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Detalles de la cita</h3>
                <button
                  onClick={() => setSelectedAppointmentDetail(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase">Paciente</label>
                  <p className="text-gray-900 font-semibold">{selectedAppointmentDetail.patient_name}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase">Motivo</label>
                  <p className="text-gray-900">{selectedAppointmentDetail.reason || 'Consulta general'}</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase">Fecha y hora</label>
                  <p className="text-gray-900">
                    {new Date(selectedAppointmentDetail.scheduled_start).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })} a las {formatTime(selectedAppointmentDetail.scheduled_start)}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 uppercase">Estado</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                    selectedAppointmentDetail.status_code === 'completed'
                      ? 'bg-green-100 text-green-800'
                      : selectedAppointmentDetail.status_code === 'cancelled'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {selectedAppointmentDetail.status_label || 'Pendiente'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedAppointmentDetail(null)}
                className="w-full mt-6 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
