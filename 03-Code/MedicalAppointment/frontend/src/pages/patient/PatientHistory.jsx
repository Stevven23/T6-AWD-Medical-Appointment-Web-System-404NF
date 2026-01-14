import React from 'react';
import PatientLayout from '../../layouts/PatientLayout';

export default function PatientHistory(){
  return (
    <PatientLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">Historial Médico</h1>
        <p className="text-gray-600">Listado histórico de consultas y notas clínicas. Migrar lógica desde panels más adelante.</p>
      </div>
    </PatientLayout>
  );
}
