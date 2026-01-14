import { useState, useEffect } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { appointmentAPI, medicalRecordAPI, prescriptionAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  BeakerIcon,
  ChatBubbleLeftRightIcon,
  ArrowRightIcon,
  HeartIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export default function PatientDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    upcomingAppointments: 0,
    completedAppointments: 0,
    pendingResults: 0,
    activePrescriptions: 0,
  });
  const [nextAppointment, setNextAppointment] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [healthSummary, setHealthSummary] = useState(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Solo cargar las citas, el resto calcular desde ellas o dejar vacío
      const appointmentsRes = await appointmentAPI.getPatientAppointments();
      
      const appointments = appointmentsRes.data || [];
      const now = new Date();

      const upcoming = appointments
        .filter(
          (apt) => new Date(apt.scheduled_start) >= now && apt.status_code !== 'cancelled'
        )
        .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));

      const completed = appointments.filter(
        (apt) => apt.status_code === 'completed'
      );

      setStats({
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
        pendingResults: 0,
        activePrescriptions: 0,
      });

      if (upcoming.length > 0) {
        setNextAppointment(upcoming[0]);
      }

      // Dejar history vacío por ahora
      setRecentHistory([]);
      setHealthSummary(null);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('es-EC', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const StatCard = ({ title, value, icon: Icon, color, bgColor, link }) => (
    <Link
      to={link}
      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all duration-200 border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className={`text-4xl font-bold ${color}`}>{value}</p>
        </div>
        <div className={`${bgColor} p-4 rounded-full`}>
          <Icon className={`h-8 w-8 ${color}`} />
        </div>
      </div>
    </Link>
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
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Bienvenido/a, {user?.first_name} 👋</h1>
          <p className="text-blue-100">Gestiona tus citas médicas y consulta tu historial de salud</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Citas Próximas"
            value={stats.upcomingAppointments}
            icon={CalendarIcon}
            color="text-blue-600"
            bgColor="bg-blue-50"
            link="/patient/appointments"
          />
          <StatCard
            title="Citas Completadas"
            value={stats.completedAppointments}
            icon={CheckCircleIcon}
            color="text-green-600"
            bgColor="bg-green-50"
            link="/patient/history"
          />
          <StatCard
            title="Resultados Pendientes"
            value={stats.pendingResults}
            icon={BeakerIcon}
            color="text-yellow-600"
            bgColor="bg-yellow-50"
            link="/patient/lab"
          />
          <StatCard
            title="Recetas Activas"
            value={stats.activePrescriptions}
            icon={DocumentTextIcon}
            color="text-purple-600"
            bgColor="bg-purple-50"
            link="/patient/prescriptions"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Next Appointment */}
            {nextAppointment ? (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Próxima Cita</h2>
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-600">
                    <p className="text-sm text-gray-600 mb-2">📅 Fecha y Hora</p>
                    <p className="font-bold text-gray-900 text-lg">
                      {formatDateTime(nextAppointment.scheduled_start)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">Doctor</p>
                      <p className="font-semibold text-gray-900">
                        Dr. {nextAppointment.doctor_first_name} {nextAppointment.doctor_last_name}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">Especialidad</p>
                      <p className="font-semibold text-gray-900">{nextAppointment.specialty_name}</p>
                    </div>
                  </div>
                  {nextAppointment.reason && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-xs text-gray-600 mb-1">Motivo</p>
                      <p className="text-gray-900">{nextAppointment.reason}</p>
                    </div>
                  )}
                  <Link
                    to="/patient/appointments"
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    Ver Detalles
                    <ArrowRightIcon className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Próxima Cita</h2>
                <div className="text-center py-8">
                  <CalendarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">No tienes citas programadas</p>
                  <Link
                    to="/patient/new-appointment"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                  >
                    📅 Agendar Nueva Cita
                  </Link>
                </div>
              </div>
            )}

            {/* Recent History */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Historial Reciente</h2>
                <Link to="/patient/history" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Ver →
                </Link>
              </div>
              {recentHistory.length > 0 ? (
                <div className="space-y-3">
                  {recentHistory.map((record, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-200"
                    >
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <ClockIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {new Date(record.date).toLocaleDateString('es-EC', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </div>
                        <p className="font-semibold text-gray-900">{record.diagnosis || 'Consulta General'}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          Dr. {record.doctor?.first_name} - {record.specialty?.name}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <DocumentTextIcon className="h-12 w-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600 text-sm">No hay historial disponible</p>
                </div>
              )}
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Notificaciones</h2>
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="bg-green-100 rounded-full p-4 inline-flex mb-3">
                    <CheckCircleIcon className="h-8 w-8 text-green-600" />
                  </div>
                  <p className="text-gray-600">No tienes notificaciones pendientes</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                  to="/patient/new-appointment"
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all border border-blue-200 group"
                >
                  <div className="bg-blue-600 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <CalendarIcon className="h-8 w-8 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">Agendar Cita</span>
                </Link>

                <Link
                  to="/patient/prescriptions"
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all border border-purple-200 group"
                >
                  <div className="bg-purple-600 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <DocumentTextIcon className="h-8 w-8 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">Ver Recetas</span>
                </Link>

                <Link
                  to="/patient/lab"
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl hover:from-yellow-100 hover:to-yellow-200 transition-all border border-yellow-200 group"
                >
                  <div className="bg-yellow-600 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <BeakerIcon className="h-8 w-8 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">Resultados Lab</span>
                </Link>

                <Link
                  to="/patient/history"
                  className="flex flex-col items-center justify-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all border border-green-200 group"
                >
                  <div className="bg-green-600 p-4 rounded-full mb-3 group-hover:scale-110 transition-transform">
                    <ClockIcon className="h-8 w-8 text-white" />
                  </div>
                  <span className="font-bold text-gray-900">Historial Médico</span>
                </Link>
              </div>
            </div>

            {/* Health Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-red-100 p-2 rounded-lg">
                  <HeartIcon className="h-6 w-6 text-red-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Resumen de Salud</h2>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Tipo de Sangre</span>
                  <span className="font-bold text-gray-900">{healthSummary?.blood_type || 'O+'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Alergias</span>
                  <span className="font-bold text-gray-900">
                    {healthSummary?.allergies || 'Penicilina'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Condiciones</span>
                  <span className="font-bold text-gray-900">
                    {healthSummary?.conditions || 'Hipertensión Leve'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Medicamentos</span>
                  <span className="font-bold text-gray-900">
                    {healthSummary?.medications || 'Losartan 50mg'}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Última Consulta</span>
                  <span className="font-bold text-gray-900">{healthSummary?.lastVisit || '--'}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Citas Completadas</span>
                  <span className="font-bold text-gray-900">{stats.completedAppointments}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Citas Próximas</span>
                  <span className="font-bold text-gray-900">{stats.upcomingAppointments}</span>
                </div>
              </div>
            </div>

            {/* Recordatorios */}
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl shadow-sm p-6 border border-yellow-200">
              <div className="flex items-center gap-3 mb-4">
                <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" />
                <h2 className="text-lg font-bold text-gray-900">Recordatorios</h2>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-yellow-600 font-bold">•</span>
                  <span>Complete su perfil médico para un mejor servicio</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-yellow-600 font-bold">•</span>
                  <span>Recuerde llevar sus documentos a la próxima cita</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
