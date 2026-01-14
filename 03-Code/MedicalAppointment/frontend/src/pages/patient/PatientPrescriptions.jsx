import { useState, useEffect } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { prescriptionAPI } from '../../services/api';
import {
  DocumentTextIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export default function PatientPrescriptions() {
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState([]);
  const [statusFilter, setStatusFilter] = useState('active');

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    try {
      setLoading(true);
      const response = await prescriptionAPI.getPatientPrescriptions();
      setPrescriptions(response.data);
    } catch (error) {
      console.error('Error loading prescriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      completed: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      active: 'Activa',
      expired: 'Expirada',
      completed: 'Completada',
    };

    const icons = {
      active: CheckCircleIcon,
      expired: XCircleIcon,
      completed: ClockIcon,
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

  const filteredPrescriptions = prescriptions.filter(
    (prescription) => !statusFilter || prescription.status === statusFilter
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
                Recetas Médicas
              </h1>
              <p className="text-gray-600 mt-1">
                Consulta tus recetas médicas activas y el historial completo
              </p>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas</option>
              <option value="active">Activas</option>
              <option value="expired">Expiradas</option>
              <option value="completed">Completadas</option>
            </select>
          </div>
        </div>

        {filteredPrescriptions.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay recetas médicas
            </h3>
            <p className="text-gray-600">
              {statusFilter && statusFilter !== ''
                ? 'No se encontraron recetas con el filtro seleccionado'
                : 'Aún no tienes recetas médicas registradas'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-3 rounded-lg">
                      <DocumentTextIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {prescription.medication_name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        Dr. {prescription.doctor?.first_name}{' '}
                        {prescription.doctor?.last_name}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(prescription.status)}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Dosis</p>
                    <p className="font-medium text-gray-900">
                      {prescription.dosage}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Frecuencia</p>
                    <p className="font-medium text-gray-900">
                      {prescription.frequency}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Duración</p>
                    <p className="font-medium text-gray-900">
                      {prescription.duration}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Fecha</p>
                    <p className="font-medium text-gray-900">
                      {formatDate(prescription.date)}
                    </p>
                  </div>
                </div>

                {prescription.instructions && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-900 mb-1">
                      Instrucciones
                    </p>
                    <p className="text-sm text-gray-700">
                      {prescription.instructions}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}
