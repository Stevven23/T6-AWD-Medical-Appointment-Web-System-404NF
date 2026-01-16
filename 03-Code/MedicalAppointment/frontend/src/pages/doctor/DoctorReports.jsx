import React, { useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { doctorAPI } from '../../services/api';
import { ChartBarIcon } from '@heroicons/react/24/outline';

export default function DoctorReports() {
  const [reportType, setReportType] = useState('appointments');
  const [dateRange, setDateRange] = useState('week');
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await doctorAPI.getReports(reportType, dateRange);
      setReportData(response);
    } catch (err) {
      console.error('Error fetching report:', err);
      // Use mock data
      setReportData(getMockReportData());
    } finally {
      setLoading(false);
    }
  };

  const getMockReportData = () => {
    return {
      total_appointments: 12,
      completed_appointments: 10,
      pending_appointments: 2,
      patients_treated: 8,
      total_revenue: 480,
      average_rating: 4.8,
      appointments: [
        { id: 1, patient: 'María Rodríguez', date: '2025-01-10', status: 'completed', type: 'Consulta General' },
        { id: 2, patient: 'Juan Pérez', date: '2025-01-11', status: 'completed', type: 'Seguimiento' },
        { id: 3, patient: 'Ana López', date: '2025-01-12', status: 'completed', type: 'Valoración' },
      ],
    };
  };

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Reportes y Estadísticas</h2>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Reporte
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="appointments">Citas por Período</option>
                <option value="patients">Pacientes Atendidos</option>
                <option value="revenue">Ingresos</option>
                <option value="treatments">Tratamientos</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rango de Fechas
              </label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="today">Hoy</option>
                <option value="week">Esta Semana</option>
                <option value="month">Este Mes</option>
                <option value="year">Este Año</option>
                <option value="all">Todos</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Total de Citas</p>
                    <p className="text-3xl font-bold text-gray-800 mt-2">
                      {reportData?.total_appointments || 0}
                    </p>
                  </div>
                  <ChartBarIcon className="w-10 h-10 text-blue-600 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Citas Completadas</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">
                      {reportData?.completed_appointments || 0}
                    </p>
                  </div>
                  <ChartBarIcon className="w-10 h-10 text-green-600 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Pacientes Atendidos</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">
                      {reportData?.patients_treated || 0}
                    </p>
                  </div>
                  <ChartBarIcon className="w-10 h-10 text-purple-600 opacity-20" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm">Calificación Promedio</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-2">
                      {reportData?.average_rating || 0}/5
                    </p>
                  </div>
                  <ChartBarIcon className="w-10 h-10 text-yellow-600 opacity-20" />
                </div>
              </div>
            </div>

            {/* Report Table */}
            {reportType === 'appointments' && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-800">
                    Detalle de Citas
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          Paciente
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          Fecha
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          Tipo
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {reportData?.appointments?.map(apt => (
                        <tr key={apt.id} className="hover:bg-gray-50 transition">
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {apt.patient}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(apt.date).toLocaleDateString('es-ES')}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {apt.type}
                          </td>
                          <td className="px-6 py-4 text-sm">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              apt.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {apt.status === 'completed' ? 'Completada' : 'Pendiente'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Export Options */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Opciones de Exportación</h3>
              <div className="flex flex-wrap gap-4">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
                  📊 Descargar Excel
                </button>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition">
                  📄 Descargar PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  🖨️ Imprimir
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </DoctorLayout>
  );
}
