import React from 'react';
import PatientLayout from '../../layouts/PatientLayout';

export default function PatientLab(){
  return (
    <PatientLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">Resultados de Laboratorio</h1>
        <p className="text-gray-600">Lista de estudios y resultados (temporal).</p>
      </div>
    </PatientLayout>
  );
}
