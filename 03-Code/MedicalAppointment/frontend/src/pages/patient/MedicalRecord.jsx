import { useState, useEffect } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { medicalRecordAPI } from '../../services/api';
import {
  DocumentTextIcon,
  HeartIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline';

export default function MedicalRecord() {
  const [loading, setLoading] = useState(true);
  const [medicalRecord, setMedicalRecord] = useState(null);

  useEffect(() => {
    loadMedicalRecord();
  }, []);

  const loadMedicalRecord = async () => {
    try {
      setLoading(true);
      const response = await medicalRecordAPI.getComplete();
      setMedicalRecord(response.data);
    } catch (error) {
      console.error('Error loading medical record:', error);
    } finally {
      setLoading(false);
    }
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
            Registro Médico Completo
          </h1>
          <p className="text-gray-600">
            Vista integral de tu información médica y historial de salud
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-lg">
                <HeartIcon className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Información Vital
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Tipo de Sangre:</span>
                <span className="font-semibold text-gray-900">
                  {medicalRecord?.blood_type || 'No especificado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Altura:</span>
                <span className="font-semibold text-gray-900">
                  {medicalRecord?.height
                    ? `${medicalRecord.height} cm`
                    : 'No especificado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Peso:</span>
                <span className="font-semibold text-gray-900">
                  {medicalRecord?.weight
                    ? `${medicalRecord.weight} kg`
                    : 'No especificado'}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-100 p-3 rounded-lg">
                <BeakerIcon className="h-6 w-6 text-yellow-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Alergias</h2>
            </div>
            <p className="text-gray-700">
              {medicalRecord?.allergies || 'No se han registrado alergias'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Condiciones Crónicas
              </h2>
            </div>
            <p className="text-gray-700">
              {medicalRecord?.chronic_conditions ||
                'No se han registrado condiciones crónicas'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-green-100 p-3 rounded-lg">
                <DocumentTextIcon className="h-6 w-6 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Medicamentos Actuales
              </h2>
            </div>
            <p className="text-gray-700">
              {medicalRecord?.current_medications ||
                'No se han registrado medicamentos actuales'}
            </p>
          </div>
        </div>
      </div>
    </PatientLayout>
  );
}
