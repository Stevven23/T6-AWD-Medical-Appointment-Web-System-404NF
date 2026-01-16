import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const VerifyPrescription = () => {
  const { id } = useParams();
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        console.log('🔍 VerifyPrescription: Fetching prescription ID:', id);
        console.log('📍 VerifyPrescription: URL:', `/api/prescriptions/verify/${id}`);
        
        const response = await axios.get(`/api/prescriptions/verify/${id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        console.log('✅ VerifyPrescription: Received response:', response.data);
        console.log('📊 Patient Name:', response.data.patient_name);
        console.log('📊 Doctor Name:', response.data.doctor_name);
        setPrescription(response.data);
      } catch (err) {
        console.error('❌ VerifyPrescription: Error fetching prescription:', err);
        console.error('❌ Error details:', err.response?.data || err.message);
        console.error('❌ Error status:', err.response?.status);
        setError('No se pudo encontrar la receta');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      console.log('🚀 VerifyPrescription: Component mounted with ID:', id);
      fetchPrescription();
    } else {
      console.warn('⚠️ VerifyPrescription: No ID provided');
      setError('ID de receta no válido');
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Validando receta...</p>
        </div>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600">{error || 'Receta no encontrada'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-xl p-8">
        {/* Encabezado */}
        <div className="text-center mb-8">
          <div className="inline-block bg-green-100 rounded-full p-4 mb-4">
            <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">✓ Receta Verificada</h1>
          <p className="text-gray-600">Esta receta médica es válida y auténtica</p>
        </div>

        {/* Información de la receta */}
        <div className="space-y-6">
          {/* ID de la receta */}
          <div className="border-l-4 border-blue-500 pl-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase">ID de Receta</h2>
            <p className="text-2xl font-bold text-gray-800">
              {prescription.prescription_id || 'N/A'}
              {console.log('🔹 ID:', prescription.prescription_id)}
            </p>
          </div>

          {/* Información del paciente */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Paciente</h3>
              <p className="text-lg font-semibold text-gray-800">
                {prescription.patient_name || 'No disponible'}
                {console.log('👤 Patient Name:', prescription.patient_name)}
              </p>
              {prescription.cedula && (
                <p className="text-sm text-gray-600 mt-1">Cédula: {prescription.cedula}</p>
              )}
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Médico</h3>
              <p className="text-lg font-semibold text-gray-800">
                {prescription.doctor_name || 'No disponible'}
                {console.log('👨‍⚕️ Doctor Name:', prescription.doctor_name)}
              </p>
              {prescription.specialty && (
                <p className="text-sm text-gray-600 mt-1">{prescription.specialty}</p>
              )}
            </div>
          </div>

          {/* Diagnóstico */}
          {prescription.diagnosis && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Diagnóstico</h3>
              <p className="text-gray-800 p-4 bg-gray-50 rounded-lg">{prescription.diagnosis}</p>
            </div>
          )}

          {/* Medicamentos */}
          {prescription.medications && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Medicamentos</h3>
              <p className="text-gray-800 p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">{prescription.medications}</p>
            </div>
          )}

          {/* Instrucciones */}
          {prescription.instructions && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Instrucciones</h3>
              <p className="text-gray-800 p-4 bg-gray-50 rounded-lg">{prescription.instructions}</p>
            </div>
          )}

          {/* Duración */}
          {prescription.duration && (
            <div>
              <h3 className="text-sm font-semibold text-gray-600 uppercase mb-2">Duración</h3>
              <p className="text-gray-800 p-4 bg-gray-50 rounded-lg">{prescription.duration}</p>
            </div>
          )}

          {/* Fecha de emisión */}
          <div className="border-t pt-6">
            <p className="text-sm text-gray-500 text-center">
              Fecha de emisión: {new Date(prescription.created_at).toLocaleDateString('es-ES', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </p>
            <p className="text-xs text-gray-400 text-center mt-2">
              Receta válida por 30 días a partir de la fecha de emisión
            </p>
          </div>
        </div>

        {/* Pie de página */}
        <div className="mt-8 pt-6 border-t text-center">
          <p className="text-sm text-gray-600">
            🔒 Esta información es confidencial y solo debe ser accedida por personal farmacéutico autorizado
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyPrescription;
