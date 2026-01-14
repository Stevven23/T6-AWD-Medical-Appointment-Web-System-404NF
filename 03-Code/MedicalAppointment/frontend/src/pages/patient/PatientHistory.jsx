import { useState, useEffect } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { medicalRecordAPI } from '../../services/api';
import {
  DocumentTextIcon,
  CalendarIcon,
  UserIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

export default function PatientHistory() {
  const [loading, setLoading] = useState(true);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [expandedRecords, setExpandedRecords] = useState(new Set());

  useEffect(() => {
    loadMedicalHistory();
  }, []);

  const loadMedicalHistory = async () => {
    try {
      setLoading(true);
      const response = await medicalRecordAPI.getPatientHistory();
      setMedicalHistory(response.data);
    } catch (error) {
      console.error('Error loading medical history:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecord = (recordId) => {
    setExpandedRecords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(recordId)) {
        newSet.delete(recordId);
      } else {
        newSet.add(recordId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-EC', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Historial Médico
          </h1>
          <p className="text-gray-600">
            Consulta el historial completo de tus consultas médicas
          </p>
        </div>

        {medicalHistory.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center border border-gray-100">
            <DocumentTextIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No hay registros médicos
            </h3>
            <p className="text-gray-600">
              Aún no tienes consultas médicas registradas en tu historial
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {medicalHistory.map((record) => (
              <div
                key={record.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <div
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => toggleRecord(record.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="bg-blue-100 p-2 rounded-lg">
                          <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            {record.diagnosis || 'Consulta Médica'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {formatDate(record.date)}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                        <div className="flex items-center gap-2 text-gray-700">
                          <UserIcon className="h-5 w-5 text-blue-600" />
                          <span className="text-sm">
                            Dr. {record.doctor?.first_name}{' '}
                            {record.doctor?.last_name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-700">
                          <CalendarIcon className="h-5 w-5 text-blue-600" />
                          <span className="text-sm">
                            {record.specialty?.name || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button className="text-gray-400 hover:text-gray-600">
                      {expandedRecords.has(record.id) ? (
                        <ChevronUpIcon className="h-6 w-6" />
                      ) : (
                        <ChevronDownIcon className="h-6 w-6" />
                      )}
                    </button>
                  </div>
                </div>

                {expandedRecords.has(record.id) && (
                  <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="space-y-4">
                      {record.symptoms && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Síntomas
                          </h4>
                          <p className="text-gray-700">{record.symptoms}</p>
                        </div>
                      )}
                      {record.diagnosis && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Diagnóstico
                          </h4>
                          <p className="text-gray-700">{record.diagnosis}</p>
                        </div>
                      )}
                      {record.treatment && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Tratamiento
                          </h4>
                          <p className="text-gray-700">{record.treatment}</p>
                        </div>
                      )}
                      {record.notes && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">
                            Notas Adicionales
                          </h4>
                          <p className="text-gray-700">{record.notes}</p>
                        </div>
                      )}
                    </div>
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
