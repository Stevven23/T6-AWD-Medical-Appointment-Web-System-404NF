import { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { appointmentAPI } from '../../services/api';
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
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  BeakerIcon,
  ChartBarIcon,
  ChartPieIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline';

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
  const [generalStats, setGeneralStats] = useState({
    totalDoctors: 0,
    activeDoctors: 0,
    totalSpecialties: 0,
    upcomingAppointments: 0,
  });
  const [appointmentStats, setAppointmentStats] = useState({
    total: 0,
    byStatus: {},
    byMonth: {},
    byDayOfWeek: {},
  });
  const [doctorStats, setDoctorStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    bySpecialty: {},
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [generalRes, appointmentRes, doctorRes] = await Promise.all([
        appointmentAPI.getGeneralStats(),
        appointmentAPI.getAppointmentStats(),
        appointmentAPI.getDoctorStats(),
      ]);

      setGeneralStats(generalRes.data || {});
      setAppointmentStats(appointmentRes.data || {});
      setDoctorStats(doctorRes.data || {});
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    const report = {
      fecha_generacion: new Date().toLocaleString('es-EC'),
      estadisticas_generales: generalStats,
      estadisticas_citas: appointmentStats,
      estadisticas_doctores: doctorStats,
    };

    const csvHeader = 'Categoría,Métrica,Valor\n';
    const csvRows = [
      // Estadísticas Generales
      `Estadísticas Generales,Total Doctores,${generalStats.totalDoctors}`,
      `Estadísticas Generales,Doctores Activos,${generalStats.activeDoctors}`,
      `Estadísticas Generales,Total Especialidades,${generalStats.totalSpecialties}`,
      `Estadísticas Generales,Próximas Citas,${generalStats.upcomingAppointments}`,
      '',
      // Citas por Estado
      'Citas por Estado,Estado,Cantidad',
      ...Object.entries(appointmentStats.byStatus || {}).map(([status, count]) => 
        `Citas por Estado,${status},${count}`
      ),
      '',
      // Citas por Mes
      'Citas por Mes,Mes,Cantidad',
      ...Object.entries(appointmentStats.byMonth || {}).map(([month, count]) => 
        `Citas por Mes,${month},${count}`
      ),
      '',
      // Doctores por Especialidad
      'Doctores por Especialidad,Especialidad,Total,Activos,Inactivos',
      ...Object.entries(doctorStats.bySpecialty || {}).map(([specialty, data]) => 
        `Doctores por Especialidad,${specialty},${data.total},${data.active},${data.inactive}`
      ),
    ].join('\n');

    const csv = csvHeader + csvRows;
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `reporte-dashboard-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Chart: Citas por Estado (Pie)
  const statusChartData = {
    labels: Object.keys(appointmentStats.byStatus || {}),
    datasets: [
      {
        label: 'Citas',
        data: Object.values(appointmentStats.byStatus || {}),
        backgroundColor: [
          'rgba(74, 144, 226, 0.8)',
          'rgba(106, 165, 103, 0.8)',
          'rgba(212, 175, 55, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: [
          'rgba(74, 144, 226, 1)',
          'rgba(106, 165, 103, 1)',
          'rgba(212, 175, 55, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };

  // Chart: Citas por Mes (Bar)
  const monthChartData = {
    labels: Object.keys(appointmentStats.byMonth || {}),
    datasets: [
      {
        label: 'Número de Citas',
        data: Object.values(appointmentStats.byMonth || {}),
        backgroundColor: 'rgba(74, 144, 226, 0.8)',
        borderColor: 'rgba(74, 144, 226, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Chart: Citas por Día de la Semana (Bar)
  const dayOfWeekChartData = {
    labels: Object.keys(appointmentStats.byDayOfWeek || {}),
    datasets: [
      {
        label: 'Citas por Día',
        data: Object.values(appointmentStats.byDayOfWeek || {}),
        backgroundColor: 'rgba(106, 165, 103, 0.8)',
        borderColor: 'rgba(106, 165, 103, 1)',
        borderWidth: 2,
      },
    ],
  };

  // Chart: Doctores por Especialidad (Bar)
  const specialtyChartData = {
    labels: Object.keys(doctorStats.bySpecialty || {}),
    datasets: [
      {
        label: 'Total',
        data: Object.values(doctorStats.bySpecialty || {}).map(d => d.total),
        backgroundColor: 'rgba(74, 144, 226, 0.8)',
        borderColor: 'rgba(74, 144, 226, 1)',
        borderWidth: 2,
      },
      {
        label: 'Activos',
        data: Object.values(doctorStats.bySpecialty || {}).map(d => d.active),
        backgroundColor: 'rgba(106, 165, 103, 0.8)',
        borderColor: 'rgba(106, 165, 103, 1)',
        borderWidth: 2,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Bienvenido/a, {user?.first_name || 'Admin'} 👋
          </h1>
          <p className="text-gray-600">
            Panel de estadísticas y análisis del sistema
          </p>
        </div>
        <button
          onClick={downloadReport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md"
        >
          <ArrowDownTrayIcon className="w-5 h-5" />
          Descargar Reporte
        </button>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <QuickStatCard
          title="Doctores Activos"
          value={generalStats.activeDoctors}
          total={generalStats.totalDoctors}
          icon={UserGroupIcon}
          color="blue"
        />
        <QuickStatCard
          title="Especialidades"
          value={generalStats.activeSpecialties || generalStats.totalSpecialties}
          total={generalStats.totalSpecialties}
          icon={BeakerIcon}
          color="green"
        />
        <QuickStatCard
          title="Próximas Citas"
          value={generalStats.upcomingAppointments}
          icon={CalendarIcon}
          color="yellow"
        />
        <QuickStatCard
          title="Total Citas"
          value={appointmentStats.total}
          icon={ClockIcon}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <QuickActionButton
            icon={CalendarIcon}
            label="Ver Calendario"
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
            icon={ChartBarIcon}
            label="Reportes"
            href="/admin/reports"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="space-y-8">
        {/* Citas por Estado y Mes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                <ChartPieIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">
                  Citas por Estado
                </h4>
                <p className="text-sm text-gray-600">Distribución actual</p>
              </div>
            </div>
            <div className="h-80">
              {Object.keys(appointmentStats.byStatus || {}).length > 0 ? (
                <Pie data={statusChartData} options={pieChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <ChartBarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">
                  Citas por Mes
                </h4>
                <p className="text-sm text-gray-600">Tendencia mensual</p>
              </div>
            </div>
            <div className="h-80">
              {Object.keys(appointmentStats.byMonth || {}).length > 0 ? (
                <Bar data={monthChartData} options={barChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Citas por Día de Semana y Doctores por Especialidad */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                <CalendarIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">
                  Citas por Día de la Semana
                </h4>
                <p className="text-sm text-gray-600">Distribución semanal</p>
              </div>
            </div>
            <div className="h-80">
              {Object.keys(appointmentStats.byDayOfWeek || {}).length > 0 ? (
                <Bar data={dayOfWeekChartData} options={barChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center">
                <UserGroupIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="text-lg font-semibold text-gray-800">
                  Doctores por Especialidad
                </h4>
                <p className="text-sm text-gray-600">Total y activos</p>
              </div>
            </div>
            <div className="h-80">
              {Object.keys(doctorStats.bySpecialty || {}).length > 0 ? (
                <Bar data={specialtyChartData} options={barChartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No hay datos disponibles
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Resumen en Tabla */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Resumen Detallado por Especialidad
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Especialidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Doctores
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inactivos
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {Object.entries(doctorStats.bySpecialty || {}).map(([specialty, data]) => (
                  <tr key={specialty} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {specialty}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {data.total}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                      {data.active}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      {data.inactive}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function QuickStatCard({ title, value, total, icon: Icon, color }) {
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
      <div className="text-sm opacity-90">
        {title}
        {total && ` (de ${total})`}
      </div>
    </div>
  );
}

function QuickActionButton({ icon: Icon, label, href }) {
  return (
    <a
      href={href}
      className="flex flex-col items-center justify-center gap-3 p-6 bg-gray-50 border-2 border-gray-200 rounded-xl hover:bg-blue-500 hover:border-blue-500 hover:text-white transition-all group"
    >
      <Icon className="w-10 h-10 text-blue-500 group-hover:text-white transition-colors" />
      <span className="text-sm font-semibold text-gray-700 group-hover:text-white text-center transition-colors">
        {label}
      </span>
    </a>
  );
}