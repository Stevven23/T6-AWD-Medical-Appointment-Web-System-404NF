import React, { useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { doctorAPI, reportAPI } from '../../services/api';
import { 
  ChartBarIcon, 
  CalendarIcon, 
  UserGroupIcon, 
  CheckCircleIcon,
  ClockIcon,
  ArrowDownTrayIcon,
  DocumentArrowDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function DoctorReports() {
  const [reportType, setReportType] = useState('appointments');
  const [dateRange, setDateRange] = useState('month');
  const [reportData, setReportData] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      // Calcular fechas según el rango seleccionado
      const { startDate, endDate } = getDateRange(dateRange);
      
      const [appointmentsRes, statsRes] = await Promise.all([
        reportAPI.getAppointments({ startDate, endDate }),
        reportAPI.getStatistics({ startDate, endDate }),
      ]);

      console.log('📥 Response completa:', { appointmentsRes, statsRes });

      // Extraer datos de citas - manejar múltiples formatos posibles
      let appointmentsData = [];
      
      if (appointmentsRes) {
        // Intenta extraer de diferentes caminos posibles
        if (appointmentsRes.data?.appointments) {
          appointmentsData = appointmentsRes.data.appointments;
        } else if (appointmentsRes.appointments) {
          appointmentsData = appointmentsRes.appointments;
        } else if (Array.isArray(appointmentsRes.data)) {
          appointmentsData = appointmentsRes.data;
        } else if (Array.isArray(appointmentsRes)) {
          appointmentsData = appointmentsRes;
        }
      }

      // LOG DETALLADO
      if (appointmentsData.length > 0) {
        console.log('📋 Primer objeto de cita (ESTRUCTURA):', JSON.stringify(appointmentsData[0], null, 2));
        console.log('🔑 Claves del objeto:', Object.keys(appointmentsData[0]));
      }

      console.log('✅ Citas extraídas:', appointmentsData);

      const rawStatistics = statsRes?.data || statsRes;

      // Convertir estadísticas a formato esperado
      const statisticsData = {
        total_appointments: rawStatistics?.totalAppointments || appointmentsData?.length || 0,
        completed_appointments: rawStatistics?.completedAppointments || 0,
        pending_appointments: (rawStatistics?.totalAppointments || 0) - (rawStatistics?.completedAppointments || 0) - (rawStatistics?.cancelledAppointments || 0) || 0,
        patients_treated: new Set((appointmentsData || []).map(a => a.patient_user_id || a.patient_id)).size || 0,
        average_rating: 4.8,
        total_revenue: 0,
      };

      setReportData(Array.isArray(appointmentsData) ? appointmentsData : []);
      setStatistics(statisticsData);
      console.log('✅ Reportes cargados', { 
        appointments: appointmentsData?.length || 0, 
        stats: statisticsData 
      });
    } catch (err) {
      console.error('❌ Error fetching report:', err);
      setReportData(getMockReportData());
      setStatistics(getMockStatistics());
      showNotification('Usando datos de demostración', 'info');
    } finally {
      setLoading(false);
    }
  };

  const getDateRange = (range) => {
    const today = new Date();
    let startDate, endDate;
    
    endDate = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    switch(range) {
      case 'today':
        startDate = endDate;
        break;
      case 'week': {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        break;
      }
      case 'month': {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
        break;
      }
      case 'year': {
        const yearAgo = new Date(today);
        yearAgo.setFullYear(yearAgo.getFullYear() - 1);
        startDate = yearAgo.toISOString().split('T')[0];
        break;
      }
      case 'all':
        startDate = '2020-01-01'; // Rango muy amplio
        break;
      default: {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        startDate = monthAgo.toISOString().split('T')[0];
      }
    }
    
    return { startDate, endDate };
  };

  const getMockStatistics = () => {
    return {
      total_appointments: 45,
      completed_appointments: 42,
      pending_appointments: 3,
      patients_treated: 28,
      average_rating: 4.8,
      total_revenue: 2100,
    };
  };

  const getMockReportData = () => {
    return [
      { id: 1, patient: 'María Rodríguez', patient_name: 'María Rodríguez', appointment_date: '2025-01-20', appointment_time: '09:00', status: 'completed', reason: 'Consulta General', duration_minutes: 30 },
      { id: 2, patient: 'Juan Pérez', patient_name: 'Juan Pérez', appointment_date: '2025-01-21', appointment_time: '10:30', status: 'completed', reason: 'Seguimiento', duration_minutes: 25 },
      { id: 3, patient: 'Ana López', patient_name: 'Ana López', appointment_date: '2025-01-22', appointment_time: '14:00', status: 'completed', reason: 'Valoración', duration_minutes: 45 },
      { id: 4, patient: 'Carlos Mendoza', patient_name: 'Carlos Mendoza', appointment_date: '2025-01-23', appointment_time: '15:30', status: 'pending', reason: 'Consulta General', duration_minutes: 30 },
    ];
  };

  // Función para mapear datos de cita desde múltiples formatos
  const mapAppointmentData = (apt) => {
    // Extraer nombre del paciente
    let pacienteName = apt.paciente ||      // Formato del servidor actual
                       apt.patient_name || 
                       apt.patient || 
                       (apt.users?.first_name && apt.users?.last_name ? `${apt.users.first_name} ${apt.users.last_name}` : null) ||
                       (apt.first_name && apt.last_name ? `${apt.first_name} ${apt.last_name}` : null) ||
                       'N/A';

    // Extraer fecha - ya viene formateada en algunos casos
    let fecha = apt.fecha ||                // Formato del servidor actual (YYYY-MM-DD)
                apt.appointment_date || 
                apt.scheduled_start || 
                apt.date || 
                apt.start_time;

    // Extraer hora - ya viene formateada en algunos casos
    let hora = apt.hora ||                  // Formato del servidor actual (HH:MM)
               apt.appointment_time || 
               apt.time;
    
    // Si la hora no está y tenemos scheduled_start, extraerla
    if (!hora && apt.scheduled_start) {
      hora = apt.scheduled_start.split('T')[1]?.slice(0, 5);
    }
    hora = hora || '---';

    // Extraer tipo/razón
    let tipo = apt.tipo ||                  // Formato del servidor actual
               apt.reason || 
               apt.type || 
               '---';

    // Extraer duración
    let duracion = apt.duration_minutes || 
                   apt.duration || 
                   apt.duration_in_minutes;

    // Extraer estado
    let estado = String(apt.estado ||       // Formato del servidor actual
                       apt.status || 
                       apt.status_id || 
                       'unknown').toLowerCase();

    return {
      id: apt.id,
      pacienteName,
      fecha,
      hora,
      tipo,
      duracion,
      estado,
      originalStatus: apt.estado || apt.status || apt.status_id
    };
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const downloadReport = async (format) => {
    try {
      setLoading(true);
      if (format === 'csv') {
        const response = await reportAPI.exportToCSV({ range: dateRange });
        const url = window.URL.createObjectURL(new Blob([response]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `reporte_doctor_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        link.parentNode.removeChild(link);
      }
      showNotification(`Reporte descargado en ${format.toUpperCase()}`, 'success');
    } catch (error) {
      console.error('Error downloading report:', error);
      showNotification('Error al descargar el reporte', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-800">📊 Reportes y Estadísticas</h2>
            <p className="text-gray-600 mt-1">Analiza tu desempeño y actividad médica</p>
          </div>
        </div>

        {/* Notification */}
        {notification && (
          <div
            className={`p-4 rounded-lg ${
              notification.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-400'
                : notification.type === 'error'
                ? 'bg-red-100 text-red-800 border border-red-400'
                : 'bg-blue-100 text-blue-800 border border-blue-400'
            }`}
          >
            {notification.message}
          </div>
        )}

        {/* Filters Card */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6 border border-blue-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5 text-blue-600" />
            Filtros de Reporte
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="appointments">📅 Citas y Consultas</option>
                <option value="patients">👥 Pacientes Atendidos</option>
                <option value="revenue">💰 Ingresos</option>
                <option value="treatments">💊 Tratamientos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de Fechas
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="today">📆 Hoy</option>
                <option value="week">📈 Esta Semana</option>
                <option value="month">📊 Este Mes</option>
                <option value="year">📅 Este Año</option>
                <option value="all">♾️ Todos los Datos</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => fetchReportData()}
                disabled={loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 font-medium"
              >
                {loading ? '⏳ Cargando...' : '🔄 Actualizar'}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Cargando datos de reportes...</p>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total Appointments */}
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-blue-600">Total de Citas</p>
                  <CalendarIcon className="w-6 h-6 text-blue-400" />
                </div>
                <p className="text-3xl font-bold text-blue-900">
                  {Array.isArray(reportData) && reportData.length > 0 ? reportData.length : (statistics?.total_appointments || 0)}
                </p>
                <p className="text-xs text-blue-600 mt-2">En el período seleccionado</p>
              </div>

              {/* Completed Appointments */}
              <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-green-600">Citas Completadas</p>
                  <CheckCircleIcon className="w-6 h-6 text-green-400" />
                </div>
                <p className="text-3xl font-bold text-green-900">
                  {Array.isArray(reportData) ? reportData.filter(a => a.status === 'completed' || a.status === 2 || a.status === '2').length : (statistics?.completed_appointments || 0)}
                </p>
                <p className="text-xs text-green-600 mt-2">Consultadas exitosamente</p>
              </div>

              {/* Pending Appointments */}
              <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-yellow-600">Pendientes</p>
                  <ClockIcon className="w-6 h-6 text-yellow-400" />
                </div>
                <p className="text-3xl font-bold text-yellow-900">
                  {Array.isArray(reportData) ? reportData.filter(a => a.status === 'pending' || a.status === 'scheduled' || a.status === 1 || a.status === '1').length : (statistics?.pending_appointments || 0)}
                </p>
                <p className="text-xs text-yellow-600 mt-2">Por realizar</p>
              </div>

              {/* Patients Treated */}
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg shadow-md p-6 hover:shadow-lg transition">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-purple-600">Pacientes</p>
                  <UserGroupIcon className="w-6 h-6 text-purple-400" />
                </div>
                <p className="text-3xl font-bold text-purple-900">
                  {Array.isArray(reportData) ? new Set(reportData.map(a => a.patient_user_id || a.patient_id || a.patient_name)).size : (statistics?.patients_treated || 0)}
                </p>
                <p className="text-xs text-purple-600 mt-2">Pacientes distintos</p>
              </div>
            </div>

            {/* Secondary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Average Rating */}
              <div className="bg-white border border-amber-200 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Calificación Promedio</p>
                    <p className="text-2xl font-bold text-amber-600 mt-2">
                      {statistics?.average_rating || 4.8}⭐ / 5
                    </p>
                  </div>
                  <div className="text-5xl opacity-10">⭐</div>
                </div>
              </div>

              {/* Revenue */}
              <div className="bg-white border border-green-200 rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Ingresos Totales</p>
                    <p className="text-2xl font-bold text-green-600 mt-2">
                      ${statistics?.total_revenue || 0}
                    </p>
                  </div>
                  <div className="text-5xl opacity-10">💰</div>
                </div>
              </div>
            </div>

            {/* Detailed Appointments Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <ChartBarIcon className="w-5 h-5 text-blue-600" />
                  Historial de Citas
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Paciente</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Fecha</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Hora</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Tipo</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Duración</th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {Array.isArray(reportData) && reportData.length > 0 ? (
                      reportData.slice(0, 15).map((apt, idx) => {
                        const mapped = mapAppointmentData(apt);
                        
                        return (
                          <tr key={apt.id || idx} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                              {mapped.pacienteName}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {mapped.fecha ? new Date(mapped.fecha).toLocaleDateString('es-ES') : '---'}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {mapped.hora}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {mapped.tipo}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-600">
                              {mapped.duracion !== undefined && mapped.duracion !== null && mapped.duracion !== '---' ? `${mapped.duracion} min` : '---'}
                            </td>
                            <td className="px-6 py-4 text-sm">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                mapped.estado === 'completed' || mapped.estado === 'finished' || mapped.estado === '2' || mapped.originalStatus === 2
                                  ? 'bg-green-100 text-green-800'
                                  : mapped.estado === 'pending' || mapped.estado === 'scheduled' || mapped.estado === '1' || mapped.originalStatus === 1
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : mapped.estado === 'cancelled' || mapped.estado === 'canceled' || mapped.estado === '3' || mapped.originalStatus === 3
                                  ? 'bg-red-100 text-red-800'
                                  : mapped.estado === '4' || mapped.originalStatus === 4
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {mapped.estado === 'completed' || mapped.estado === '2' || mapped.originalStatus === 2 
                                  ? '✓ Completada' 
                                  : mapped.estado === 'finished' 
                                  ? '✓ Finalizada' 
                                  : mapped.estado === 'pending' || mapped.estado === 'scheduled' || mapped.estado === '1' || mapped.originalStatus === 1
                                  ? '⏳ Pendiente' 
                                  : mapped.estado === 'cancelled' || mapped.estado === 'canceled' || mapped.estado === '3' || mapped.originalStatus === 3 
                                  ? '✕ Cancelada' 
                                  : mapped.estado === '4' || mapped.originalStatus === 4 
                                  ? '🚫 No Show' 
                                  : `${mapped.estado}`}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          No hay datos de citas disponibles
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {Array.isArray(reportData) && reportData.length > 15 && (
                <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600">
                    Mostrando 15 de {reportData.length} citas
                  </p>
                </div>
              )}
            </div>

            {/* Export Options */}
            <div className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-lg shadow-md p-6 border border-indigo-100">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <DocumentArrowDownIcon className="w-5 h-5 text-indigo-600" />
                Opciones de Exportación
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <button
                  onClick={() => downloadReport('csv')}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:bg-gray-400 font-medium"
                >
                  <ArrowDownTrayIcon className="w-5 h-5" />
                  Descargar CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Imprimir
                </button>
                <button
                  onClick={() => showNotification('Función de email aún en desarrollo', 'info')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition font-medium"
                >
                  📧 Email
                </button>
                <button
                  onClick={() => showNotification('Copiar al portapapeles', 'success')}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition font-medium"
                >
                  📋 Copiar
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </DoctorLayout>
  );
}
