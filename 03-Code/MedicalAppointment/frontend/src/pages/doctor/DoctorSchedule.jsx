import React, { useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { doctorAPI } from '../../services/api';

export default function DoctorSchedule() {
  const [selectedDay, setSelectedDay] = useState(1); // 1 = Monday
  const [schedule, setSchedule] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);

  const days = [
    { id: 1, name: 'Lunes', label: 'MON' },
    { id: 2, name: 'Martes', label: 'TUE' },
    { id: 3, name: 'Miércoles', label: 'WED' },
    { id: 4, name: 'Jueves', label: 'THU' },
    { id: 5, name: 'Viernes', label: 'FRI' },
    { id: 6, name: 'Sábado', label: 'SAT' },
    { id: 0, name: 'Domingo', label: 'SUN' },
  ];

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await doctorAPI.getSchedule();
      setSchedule(response.schedule || {});
    } catch (err) {
      setError('Error al cargar el horario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleChange = (field, value) => {
    const daySchedule = schedule[selectedDay] || {};
    const updated = { ...daySchedule, [field]: value };
    setSchedule({ ...schedule, [selectedDay]: updated });
  };

  const saveSchedule = async () => {
    try {
      setLoading(true);
      await doctorAPI.updateSchedule(schedule);
      showNotification('Horario guardado exitosamente', 'success');
    } catch (err) {
      showNotification('Error al guardar el horario', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const currentDaySchedule = schedule[selectedDay] || {};
  const currentDay = days.find(d => d.id === selectedDay);

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Mi Horario Laboral</h2>

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

        {loading && !schedule[selectedDay] ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Day Selector */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Seleccionar Día</h3>
              <div className="space-y-2">
                {days.map(day => (
                  <button
                    key={day.id}
                    onClick={() => setSelectedDay(day.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      selectedDay === day.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {day.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Schedule Editor */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold text-gray-800 mb-6">
                Horario - {currentDay?.name}
              </h3>

              <div className="space-y-6">
                {/* Work Status */}
                <div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={currentDaySchedule.is_working_day !== false}
                      onChange={(e) => handleScheduleChange('is_working_day', e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300"
                    />
                    <span className="font-medium text-gray-700">Trabajar este día</span>
                  </label>
                </div>

                {/* Working Hours */}
                {currentDaySchedule.is_working_day !== false && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora de Inicio
                      </label>
                      <input
                        type="time"
                        value={currentDaySchedule.start_time || '09:00'}
                        onChange={(e) => handleScheduleChange('start_time', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Hora de Término
                      </label>
                      <input
                        type="time"
                        value={currentDaySchedule.end_time || '17:00'}
                        onChange={(e) => handleScheduleChange('end_time', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duración de la Cita (minutos)
                      </label>
                      <select
                        value={currentDaySchedule.appointment_duration || 30}
                        onChange={(e) => handleScheduleChange('appointment_duration', parseInt(e.target.value))}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={15}>15 minutos</option>
                        <option value={30}>30 minutos</option>
                        <option value={45}>45 minutos</option>
                        <option value={60}>1 hora</option>
                      </select>
                    </div>

                    {/* Break Time */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-700 mb-4">Tiempo de Descanso</h4>
                      <div>
                        <label className="flex items-center gap-3 mb-4">
                          <input
                            type="checkbox"
                            checked={currentDaySchedule.has_break || false}
                            onChange={(e) => handleScheduleChange('has_break', e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">Tengo descanso este día</span>
                        </label>
                      </div>

                      {currentDaySchedule.has_break && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Inicio del Descanso
                              </label>
                              <input
                                type="time"
                                value={currentDaySchedule.break_start || '12:00'}
                                onChange={(e) => handleScheduleChange('break_start', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fin del Descanso
                              </label>
                              <input
                                type="time"
                                value={currentDaySchedule.break_end || '13:00'}
                                onChange={(e) => handleScheduleChange('break_end', e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={saveSchedule}
                disabled={loading}
                className="mt-6 w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {loading ? 'Guardando...' : 'Guardar Horario'}
              </button>
            </div>
          </div>
        )}

        {/* Weekly Summary */}
        {!loading && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Resumen Semanal</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {days.map(day => {
                const daySchedule = schedule[day.id];
                const isWorking = daySchedule?.is_working_day !== false;
                return (
                  <div
                    key={day.id}
                    className={`p-4 rounded-lg ${
                      isWorking
                        ? 'bg-green-50 border border-green-200'
                        : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <h4 className="font-semibold text-gray-800">{day.name}</h4>
                    {isWorking ? (
                      <p className="text-sm text-gray-600 mt-2">
                        {daySchedule.start_time} - {daySchedule.end_time}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-600 mt-2">No trabaja</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
