import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { doctorAPI, specialtyAPI, appointmentAPI, reportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import {
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  BeakerIcon,
  ChartBarIcon,
  ChartPieIcon,
} from '@heroicons/react/24/outline';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalDoctors: 0,
    totalSpecialties: 0,
    upcomingAppointments: 0,
    doctorsBySpecialty: {},
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [doctorsRes, specialtiesRes, appointmentsRes, doctorStatsRes] = await Promise.all([
        doctorAPI.getAll(),
        specialtyAPI.getAll(),
        appointmentAPI.getUpcoming(),
        doctorAPI.getStats(),
      ]);

      // Process doctors by specialty
      const doctorsBySpecialty = {};
      doctorsRes.data.forEach(doctor => {
        const specialtyName = doctor.specialty?.name || 'Sin especialidad';
        doctorsBySpecialty[specialtyName] = (doctorsBySpecialty[specialtyName] || 0) + 1;
      });

      setStats({
        totalDoctors: doctorsRes.data.length,
        totalSpecialties: specialtiesRes.data.length,
        upcomingAppointments: appointmentsRes.data.length,
        doctorsBySpecialty,
        activeDoctors: doctorStatsRes.data.active || 0,
        inactiveDoctors: doctorStatsRes.data.inactive || 0,
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Chart data for Doctors by Specialty (Bar Chart)
  const barChartData = {
    labels: Object.keys(stats.doctorsBySpecialty),
    datasets: [
      {
        label: 'Número de Doctores',
        data: Object.values(stats.doctorsBySpecialty),
        backgroundColor: [
          'rgba(74, 144, 226, 0.8)',
          'rgba(106, 165, 103, 0.8)',
          'rgba(212, 175, 55, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
        ],
        borderColor: [
          'rgba(74, 144, 226, 1)',
          'rgba(106, 165, 103, 1)',
          'rgba(212, 175, 55, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  // Chart data for Specialty Distribution (Pie Chart)
  const pieChartData = {
    labels: Object.keys(stats.doctorsBySpecialty),
    datasets: [
      {
        label: 'Distribución',
        data: Object.values(stats.doctorsBySpecialty),
        backgroundColor: [
          'rgba(74, 144, 226, 0.8)',
          'rgba(106, 165, 103, 0.8)',
          'rgba(212, 175, 55, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 206, 86, 0.8)',
        ],
        borderColor: [
          'rgba(74, 144, 226, 1)',
          'rgba(106, 165, 103, 1)',
          'rgba(212, 175, 55, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
    },
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Bienvenida, {user?.first_name || 'Admin'} 👋
        </h1>
        <p className="text-gray-600">
          Aquí tienes un resumen de las estadísticas de la clínica
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <QuickStatCard
          title="Doctores Activos"
          value={stats.activeDoctors}
          icon={UserGroupIcon}
          color="blue"
        />
        <QuickStatCard
          title="Especialidades"
          value={stats.totalSpecialties}
          icon={BeakerIcon}
          color="green"
        />
        <QuickStatCard
          title="Próximas Citas"
          value={stats.upcomingAppointments}
          icon={CalendarIcon}
          color="yellow"
        />
        <QuickStatCard
          title="Total Doctores"
          value={stats.totalDoctors}
          icon={ClockIcon}
          color="purple"
        />
      </div>

      {/* Next Appointment Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Próxima Cita</h3>
          <div className="bg-gradient-to-br from-accent-green to-green-400 rounded-xl p-6 text-center">
            <div className="text-4xl font-bold text-green-900 mb-2">25 Oct</div>
            <div className="text-xl text-green-800 mb-3">11:30 AM</div>
            <div className="text-green-900 font-medium">Revisión General</div>
          </div>
          <button className="w-full mt-4 px-6 py-3 border-2 border-primary-500 text-primary-500 rounded-lg hover:bg-primary-50 font-semibold transition-colors">
            Reprogramar Cita
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
          <div className="grid grid-cols-2 gap-4">
            <QuickActionButton
              icon={CalendarIcon}
              label="Ver Citas"
              href="/admin/calendar"
            />
            <QuickActionButton
              icon={UserGroupIcon}
              label="Gestionar Doctores"
              href="/admin/doctors"
            />
            <QuickActionButton
              icon={BeakerIcon}
              label="Especialidades"
              href="/admin/specialties"
            />
            <QuickActionButton
              icon={ClockIcon}
              label="Horarios"
              href="/admin/schedules"
            />
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Estadísticas y Análisis
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Bar Chart */}
          <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-100 hover:border-primary-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-primary-500 rounded-full flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800">
                Doctores por Especialidad
              </h4>
            </div>
            <div className="h-64">
              {Object.keys(stats.doctorsBySpecialty).length > 0 ? (
                <Bar data={barChartData} options={barChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>

          {/* Pie Chart */}
          <div className="bg-gray-50 rounded-xl p-6 border-2 border-gray-100 hover:border-primary-300 transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <ChartPieIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-gray-800">
                Distribución de Especialidades
              </h4>
            </div>
            <div className="h-64">
              {Object.keys(stats.doctorsBySpecialty).length > 0 ? (
                <Pie data={pieChartData} options={pieChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function QuickStatCard({ title, value, icon: Icon, color }) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    yellow: 'from-yellow-500 to-yellow-600',
    purple: 'from-purple-500 to-purple-600',
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} text-white rounded-xl shadow-lg p-6 transform hover:scale-105 transition-transform`}>
      <div className="flex items-center justify-between mb-4">
        <Icon className="w-8 h-8 opacity-80" />
      </div>
      <div className="text-4xl font-bold mb-2">{value}</div>
      <div className="text-sm opacity-90">{title}</div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, href }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-primary-500 hover:border-primary-500 hover:text-white transition-all group"
    >
      <Icon className="w-10 h-10 text-primary-500 group-hover:text-white transition-colors" />
      <span className="text-sm font-semibold text-gray-700 group-hover:text-white text-center transition-colors">
        {label}
      </span>
    </a>
  );
}