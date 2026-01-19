import React, { useState } from 'react';
import { ArrowDownTrayIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

/**
 * Componente para mostrar y gestionar QR de recetas
 */
export function PrescriptionQRModal({ prescription, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!prescription || !prescription.qr_url) {
    return null;
  }

  const handleDownloadQR = () => {
    // Crear link de descarga
    const link = document.createElement('a');
    link.href = prescription.qr_url;
    link.download = `receta-qr-${prescription.prescription_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyLink = () => {
    const verificationUrl = `${window.location.origin}/verify-prescription/${prescription.qr_token}`;
    navigator.clipboard.writeText(verificationUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Código QR de Receta</h2>
          <p className="text-sm text-gray-600 mt-1">
            Código: <span className="font-mono font-semibold">{prescription.prescription_code}</span>
          </p>
        </div>

        {/* QR Code */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6 flex justify-center">
          <img
            src={prescription.qr_url}
            alt="QR Code"
            className="w-64 h-64 border-2 border-gray-300 rounded"
          />
        </div>

        {/* Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Información Anti-Fraude</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Código verificable en línea</li>
            <li>✓ Token único e irrepetible</li>
            <li>✓ Auditoría de accesos registrada</li>
            <li>✓ Válido por 90 días</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={handleDownloadQR}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <ArrowDownTrayIcon className="w-5 h-5" />
            Descargar QR
          </button>

          <button
            onClick={handleCopyLink}
            className={`w-full font-medium py-2 px-4 rounded-lg transition flex items-center justify-center gap-2 ${
              copied
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            {copied ? (
              <>
                <CheckCircleIcon className="w-5 h-5" />
                Enlace copiado
              </>
            ) : (
              'Copiar enlace de verificación'
            )}
          </button>

          <button
            onClick={onClose}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg transition"
          >
            Cerrar
          </button>
        </div>

        {/* Info adicional */}
        <div className="mt-6 text-xs text-gray-500 border-t pt-4">
          <p className="mb-2">
            <strong>Verificación:</strong> Las farmacias pueden verificar este QR escaneándolo o visitando el enlace de verificación.
          </p>
          <p>
            <strong>Seguridad:</strong> Los accesos a este QR se registran para detectar fraudes.
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrescriptionQRModal;
