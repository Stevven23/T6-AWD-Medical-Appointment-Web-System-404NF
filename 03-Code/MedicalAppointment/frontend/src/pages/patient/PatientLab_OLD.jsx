import { useState, useEffect } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { labAPI } from '../../services/api';
import {
  BeakerIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  CheckCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function PatientLab() {
  const [loading, setLoading] = useState(true);
  const [labResults, setLabResults] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadLabResults();
  }, []);

  const loadLabResults = async () => {
    try {
      setLoading(true);
      const response = await labAPI.getPatientResults();
      setLabResults(response.data);
    } catch (error) {
      console.error('Error loading lab results:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (resultId) => {
    try {
      const response = await labAPI.downloadResult(resultId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `resultado-laboratorio-${resultId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading lab result:', error);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      processing: 'bg-blue-100 text-blue-800',
    };

    const labels = {
      pending: 'Pendiente',
      completed: 'Completado',
      processing: 'En Proceso',
    };

    const icons = {
      pending: ClockIcon,
      completed: CheckCircleIcon,
      processing: BeakerIcon,
    };

    const Icon = icons[status] || ClockIcon;

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${
          styles[status] || 'bg-gray-100 text-gray-800'
        }`}
      >
        <Icon className="h-4 w-4" />
        {labels[status] || status}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const filteredResults = labResults.filter(
    (result) => !statusFilter || result.status === statusFilter
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
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Resultados de Laboratorio
              </h1>
              <p className="text-gray-600 mt-1">
                Consulta y descarga tus resultados de exámenes médicos
              </p>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los Estados</option>
              <option value="completed">Completado</option>
              <option value="processing">En Proceso</option>
              <option value="pending">Pendiente</option>
            </select>
          </div>
        </div>

        {filteredResults.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <BeakerIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay resultados de laboratorio
            </h3>
            <p className="text-gray-600">
              {statusFilter
                ? 'No se encontraron resultados con el filtro seleccionado'
                : 'Aún no tienes resultados de laboratorio disponibles'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredResults.map((result) => (
              <div
                key={result.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-3 rounded-lg">
                          <BeakerIcon className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {result.test_name}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(result.date)}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(result.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      {result.doctor && (
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Solicitado por: </span>
                          Dr. {result.doctor.first_name}{' '}
                          {result.doctor.last_name}
                        </div>
                      )}
                      {result.laboratory && (
                        <div className="text-sm text-gray-700">
                          <span className="font-medium">Laboratorio: </span>
                          {result.laboratory}
                        </div>
                      )}
                    </div>
                    {result.notes && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-gray-700">{result.notes}</p>
                      </div>
                    )}
                  </div>
                  {result.status === 'completed' && (
                    <button
                      onClick={() => handleDownload(result.id)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                      Descargar PDF
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
