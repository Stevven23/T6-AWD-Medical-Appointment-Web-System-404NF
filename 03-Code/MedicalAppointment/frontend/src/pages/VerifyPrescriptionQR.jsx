import React, { useState, useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, CalendarIcon, UserIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';

export default function VerifyPrescriptionQR() {
  const [qrToken, setQrToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const token = pathParts[pathParts.length - 1];
    if (token && token !== 'verify-prescription') {
      setQrToken(token);
      verifyQR(token);
    }
  }, []);

  const verifyQR = async (token) => {
    if (!token) {
      setError('Token de QR no proporcionado');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setResult(null);

      // Usar la URL del backend desde variables de entorno
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      
      const response = await fetch(`${apiUrl}/api/prescriptions/verify-qr/${token}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'QR inválido');
        setResult({ valid: false, message: data.error });
        return;
      }

      setResult(data);
    } catch (err) {
      setError('Error conectando al servidor de verificación');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = (e) => {
    e.preventDefault();
    verifyQR(qrToken);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <ShieldCheckIcon className="w-8 h-8" />
            <h1 className="text-2xl font-bold">Sistema de Verificación de Recetas</h1>
          </div>
          <p className="text-slate-300 mt-2 text-sm">Autenticación anti-fraude para prescripciones médicas</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading && (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <div className="inline-block">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-slate-200 border-t-slate-900"></div>
            </div>
            <p className="mt-6 text-gray-700 font-semibold">Verificando receta...</p>
          </div>
        )}

        {error && !loading && (
          <div className="bg-white rounded-lg shadow-md border-l-4 border-red-600 p-6">
            <div className="flex gap-4">
              <XCircleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-900 text-lg">Receta No Válida</h3>
                <p className="text-red-700 mt-1 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {result && result.data?.prescription && (
          <div className="space-y-6">
            {/* Success Banner */}
            <div className="bg-green-50 rounded-lg shadow-md border-l-4 border-green-600 p-6">
              <div className="flex gap-3 items-start">
                <CheckCircleIcon className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-green-900 text-lg">Receta Verificada</h3>
                  <p className="text-green-700 text-sm mt-1">Esta receta ha sido autenticada correctamente</p>
                </div>
              </div>
            </div>

            {/* Prescription Details */}
            <div className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-lg font-bold text-gray-900 mb-6 pb-4 border-b">Detalles de la Receta</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                {/* Doctor Info */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Profesional Médico</p>
                  <p className="text-lg font-semibold text-gray-900 mt-2">{result.data?.doctor?.first_name} {result.data?.doctor?.last_name}</p>
                  <p className="text-sm text-gray-600 mt-1">{result.data?.doctor?.email}</p>
                </div>

                {/* Date */}
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha de Emisión</p>
                  <p className="text-lg font-semibold text-gray-900 mt-2">{formatDate(result.data?.prescription?.created_at)}</p>
                </div>
              </div>

              {/* Medical Info */}
              <div className="border-t pt-6 space-y-6">
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Diagnóstico</label>
                  <p className="text-gray-900 font-medium mt-2">{result.data?.prescription?.diagnosis}</p>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Medicamentos Prescritos</label>
                  <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-gray-800 whitespace-pre-wrap font-medium text-sm">{result.data?.prescription?.medications}</p>
                  </div>
                </div>

                {result.data?.prescription?.instructions && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Instrucciones de Uso</label>
                    <p className="text-gray-800 mt-2 leading-relaxed text-sm">{result.data?.prescription?.instructions}</p>
                  </div>
                )}

                {result.data?.prescription?.duration && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Duración del Tratamiento</label>
                    <p className="text-gray-900 font-medium mt-2">{result.data?.prescription?.duration}</p>
                  </div>
                )}
              </div>

              {/* Validity Status */}
              <div className="mt-6 pt-6 border-t">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Estado</label>
                <div className="flex items-center gap-2 mt-3">
                  {!result.data?.prescription?.expired ? (
                    <>
                      <span className="inline-block w-2 h-2 bg-green-600 rounded-full"></span>
                      <span className="text-green-700 font-semibold text-sm">Receta válida y activa</span>
                    </>
                  ) : (
                    <>
                      <span className="inline-block w-2 h-2 bg-red-600 rounded-full"></span>
                      <span className="text-red-700 font-semibold text-sm">Receta expirada</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {result && !result.data?.prescription && (
          <div className="bg-white rounded-lg shadow-md border-l-4 border-yellow-600 p-6">
            <div className="flex gap-4 items-start">
              <XCircleIcon className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-yellow-900 text-lg">Receta No Válida</h3>
                <p className="text-yellow-700 text-sm mt-1">Este QR no corresponde a una receta válida o ha sido invalidado</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 mt-12 py-6 text-center text-gray-600 text-xs">
        <p>&copy; 2026 Sistema Médico de Citas. Todos los derechos reservados.</p>
      </div>
    </div>
  );
}

