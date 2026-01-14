import React from 'react';
import PatientLayout from '../../layouts/PatientLayout';

export default function PatientPrescriptions(){
  return (
    <PatientLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">Recetas</h1>
        <p className="text-gray-600">Recetas médicas del paciente (temporal).</p>
      </div>
    </PatientLayout>
  );
}
