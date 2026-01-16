import React, { useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { doctorAPI } from '../../services/api';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

export default function DoctorPatients() {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [activePatientIds, setActivePatientIds] = useState(new Set());

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [searchTerm, patients]);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Obtener todos los pacientes disponibles
      const response = await doctorAPI.getAllPatients();
      const allPatients = response.data || (Array.isArray(response) ? response : []);
      
      // Obtener pacientes activos (con citas) para marcarlos
      try {
        const activeResponse = await doctorAPI.getMyPatients();
        const activePatients = Array.isArray(activeResponse.activePatients) ? activeResponse.activePatients : [];
        const activeIds = new Set(activePatients.map(p => p.id || p.user_id));
        setActivePatientIds(activeIds);
        console.log('✅ Pacientes activos identificados:', activeIds.size);
      } catch (err) {
        console.warn('⚠️ No se pudieron cargar pacientes activos:', err);
      }
      
      console.log('✅ Todos los pacientes cargados:', allPatients.length);
      
      if (allPatients.length === 0) {
        setError('No hay pacientes registrados en el sistema.');
      }
      
      setPatients(allPatients);
    } catch (err) {
      console.error('Error fetching patients:', err);
      setError('Error al cargar los pacientes. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const filterPatients = () => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = patients.filter(patient =>
      patient.first_name?.toLowerCase().includes(term) ||
      patient.last_name?.toLowerCase().includes(term) ||
      patient.cedula?.includes(term)
    );
    setFilteredPatients(filtered);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('es-ES');
  };

  return (
    <DoctorLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">Mis Pacientes</h2>
        </div>

        {/* Search Bar */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar paciente por nombre o cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : !selectedPatient ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Nombre</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Cédula</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Teléfono</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPatients.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                        {searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
                      </td>
                    </tr>
                  ) : (
                    filteredPatients.map(patient => (
                      <tr key={patient.id || patient.user_id} className="hover:bg-gray-50 transition">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                          {patient.first_name} {patient.last_name}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {patient.cedula || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {patient.phone_number || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {patient.email || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {activePatientIds.has(patient.id || patient.user_id) ? (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                              <span className="w-2 h-2 rounded-full bg-green-600"></span>
                              Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                              <span className="w-2 h-2 rounded-full bg-yellow-600"></span>
                              Nuevo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <button
                            onClick={() => setSelectedPatient(patient)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* Patient Details View */
          <div className="space-y-6">
            <button
              onClick={() => setSelectedPatient(null)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              ← Volver a la lista
            </button>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-start gap-6 mb-6">
                <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-3xl">
                  {selectedPatient.first_name?.charAt(0)}{selectedPatient.last_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-gray-800">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </h3>
                  <p className="text-gray-600">{selectedPatient.cedula}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-4">Información Personal</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Edad</p>
                      <p className="font-medium text-gray-900">{selectedPatient.age || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Género</p>
                      <p className="font-medium text-gray-900">{selectedPatient.gender || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Tipo de Sangre</p>
                      <p className="font-medium text-gray-900">{selectedPatient.blood_type || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-4">Contacto</h4>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-600">Teléfono</p>
                      <p className="font-medium text-gray-900">{selectedPatient.phone_number || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-gray-900">{selectedPatient.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Dirección</p>
                      <p className="font-medium text-gray-900">{selectedPatient.address || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-700 mb-4">Información Médica</h4>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-sm text-gray-600">Alergias</p>
                    <p className="font-medium text-gray-900">{selectedPatient.allergies || 'Ninguna'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Condiciones Crónicas</p>
                    <p className="font-medium text-gray-900">{selectedPatient.chronic_conditions || 'Ninguna'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Medicamentos Actuales</p>
                    <p className="font-medium text-gray-900">{selectedPatient.current_medications || 'Ninguno'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Última Visita</p>
                    <p className="font-medium text-gray-900">{formatDate(selectedPatient.last_visit)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
