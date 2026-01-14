import { useState, useEffect } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { appointmentAPI, medicalRecordAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  BeakerIcon,
  BellAlertIcon,
  ArrowRightIcon,
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
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [appointmentsRes, statsRes, activityRes] = await Promise.all([
        appointmentAPI.getPatientAppointments(),
        appointmentAPI.getPatientStats(),
        medicalRecordAPI.getRecentActivity(),
      ]);

      const upcoming = appointmentsRes.data.filter(
        apt => new Date(apt.date) >= new Date() && apt.status !== 'cancelled'
      );
      const completed = appointmentsRes.data.filter(
        apt => apt.status === 'completed'
      );

      setStats({
        upcomingAppointments: upcoming.length,
        completedAppointments: completed.length,
        pendingResults: statsRes.data.pendingResults || 0,
        activePrescriptions: statsRes.data.activePrescriptions || 0,
      });

      if (upcoming.length > 0) {
        setNextAppointment(upcoming[0]);
      }

      setRecentActivity(activityRes.data);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
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

  const StatCard = ({ title, value, icon: Icon, color, link }) => (
    <Link
      to={link}
      className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-all duration-200 border border-gray-100"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className={`text-3xl font-bold mt-2 ${color}`}>{value}</p>
        </div>
        <div className={`${color} bg-opacity-10 p-4 rounded-xl`}>
          <Icon className="h-8 w-8" />
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
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl shadow-lg p-8 text-white">
          <h1 className="text-3xl font-bold mb-2">
            Bienvenido/a, {user?.first_name} 👋
          </h1>
          <p className="text-blue-100">
            Gestiona tus citas médicas y consulta tu historial de salud
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Citas Próximas"
            value={stats.upcomingAppointments}
            icon={CalendarIcon}
            color="text-blue-600"
            link="/patient/appointments"
          />
          <StatCard
            title="Citas Completadas"
            value={stats.completedAppointments}
            icon={ClockIcon}
            color="text-green-600"
            link="/patient/history"
          />
          <StatCard
            title="Resultados Pendientes"
            value={stats.pendingResults}
            icon={BeakerIcon}
            color="text-yellow-600"
            link="/patient/lab"
          />
          <StatCard
            title="Recetas Activas"
            value={stats.activePrescriptions}
            icon={DocumentTextIcon}
            color="text-purple-600"
            link="/patient/prescriptions"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {nextAppointment && (
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Próxima Cita
                </h2>
                <BellAlertIcon className="h-6 w-6 text-blue-600" />
              </div>
              <div className="space-y-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Fecha y Hora</p>
                  <p className="font-semibold text-gray-900">
                    {formatDateTime(nextAppointment.date)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Doctor</p>
                    <p className="font-semibold text-gray-900">
                      Dr. {nextAppointment.doctor?.first_name}{' '}
                      {nextAppointment.doctor?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Especialidad</p>
                    <p className="font-semibold text-gray-900">
                      {nextAppointment.specialty?.name}
                    </p>
                  </div>
                </div>
                <Link
                  to="/patient/appointments"
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Ver Detalles
                  <ArrowRightIcon className="h-5 w-5" />
                </Link>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Acciones Rápidas
            </h2>
            <div className="space-y-3">
              <Link
                to="/patient/appointments/new"
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg hover:from-blue-100 hover:to-blue-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <CalendarIcon className="h-6 w-6 text-blue-600" />
                  <span className="font-medium text-gray-900">
                    Agendar Nueva Cita
                  </span>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-blue-600 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/patient/history"
                className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg hover:from-green-100 hover:to-green-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <DocumentTextIcon className="h-6 w-6 text-green-600" />
                  <span className="font-medium text-gray-900">
                    Ver Historial Médico
                  </span>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-green-600 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/patient/lab"
                className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg hover:from-purple-100 hover:to-purple-200 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <BeakerIcon className="h-6 w-6 text-purple-600" />
                  <span className="font-medium text-gray-900">
                    Resultados de Laboratorio
                  </span>
                </div>
                <ArrowRightIcon className="h-5 w-5 text-purple-600 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>

        {recentActivity.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Actividad Reciente
            </h2>
            <div className="space-y-3">
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <DocumentTextIcon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">
                      {activity.title}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(activity.date).toLocaleDateString('es-EC')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
