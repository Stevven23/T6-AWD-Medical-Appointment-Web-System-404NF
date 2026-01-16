import React, { useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { doctorAPI, prescriptionAPI } from '../../services/api';
import { TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

export default function DoctorPrescriptions() {
  const [patients, setPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescription, setSelectedPrescription] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);

  const [formData, setFormData] = useState({
    diagnosis: '',
    medications: '',
    instructions: '',
    treatment_duration: '',
  });

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await doctorAPI.getAllPatients();
      const allPatients = Array.isArray(response) ? response : (response.data || response.patients || []);
      
      // Función para calcular edad
      const calculateAge = (dateOfBirth) => {
        if (!dateOfBirth) return null;
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      };
      
      // Mapear el formato de respuesta a lo que espera el componente
      const mappedPatients = allPatients.map(p => ({
        patient_id: p.id || p.user_id,
        first_name: p.first_name,
        last_name: p.last_name,
        cedula: p.cedula,
        age: calculateAge(p.date_of_birth)
      }));
      
      setPatients(mappedPatients);
    } catch (err) {
      console.error('Error fetching patients:', err);
      showNotification('Error al cargar los pacientes', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePatientSelect = async (patient) => {
    setSelectedPatient(patient);
    setShowForm(false);
    setSelectedPrescription(null);
    try {
      const response = await prescriptionAPI.getAll();
      const allPrescriptions = Array.isArray(response) ? response : (response.data || response.prescriptions || []);
      const patientPrescriptions = allPrescriptions.filter(p => p.patient_user_id === patient.patient_id);
      setPrescriptions(patientPrescriptions);
    } catch (err) {
      console.error('Error loading prescriptions:', err);
      showNotification('Error al cargar las recetas', 'error');
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    try {
      const prescriptionData = {
        patient_user_id: selectedPatient.patient_id,
        diagnosis: formData.diagnosis,
        medications: formData.medications,
        instructions: formData.instructions,
        duration: formData.treatment_duration
      };
      await prescriptionAPI.create(prescriptionData);
      showNotification('Receta creada exitosamente', 'success');
      setFormData({ diagnosis: '', medications: '', instructions: '', treatment_duration: '' });
      setShowForm(false);
      handlePatientSelect(selectedPatient);
    } catch (err) {
      console.error('Error creating prescription:', err);
      showNotification('Error al crear la receta', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const deletePrescription = async (prescriptionId) => {
    if (window.confirm('¿Estás seguro de que deseas eliminar esta receta?')) {
      try {
        await prescriptionAPI.delete(prescriptionId);
        showNotification('Receta eliminada exitosamente', 'success');
        handlePatientSelect(selectedPatient);
      } catch (err) {
        console.error('Error deleting prescription:', err);
        showNotification('Error al eliminar la receta', 'error');
      }
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <DoctorLayout>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-800">Generar Recetas Médicas</h2>

        {notification && (
          <div
            className={`p-4 rounded-lg ${
              notification.type === 'success'
                ? 'bg-green-100 text-green-800 border border-green-400'
                : 'bg-red-100 text-red-800 border border-red-400'
            }`}
          >
            {notification.message}
          </div>
        )}

        {!selectedPatient ? (
          /* Patient Selection */
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Seleccionar Paciente</h3>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {patients.map(patient => (
                  <button
                    key={patient.patient_id}
                    onClick={() => handlePatientSelect(patient)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-600 hover:bg-blue-50 transition text-left"
                  >
                    <h4 className="font-semibold text-gray-800">
                      {patient.first_name} {patient.last_name}
                    </h4>
                    <p className="text-sm text-gray-600">{patient.cedula}</p>
                    <p className="text-xs text-gray-500 mt-2">{patient.age || 0} años</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Prescription Management */
          <div className="space-y-6">
            <button
              onClick={() => setSelectedPatient(null)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              ← Cambiar Paciente
            </button>

            {/* Patient Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Recetas para:</p>
              <h3 className="text-xl font-bold text-gray-800">
                {selectedPatient.first_name} {selectedPatient.last_name}
              </h3>
            </div>

            {!selectedPrescription && !showForm ? (
              /* Prescriptions List */
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Historial de Recetas</h3>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                  >
                    + Nueva Receta
                  </button>
                </div>

                {prescriptions.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No hay recetas registradas</p>
                ) : (
                  <div className="space-y-3">
                    {prescriptions.map(prescription => (
                      <div
                        key={prescription.prescription_id}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                      >
                        <div>
                          <h4 className="font-semibold text-gray-800">{prescription.diagnosis}</h4>
                          <p className="text-sm text-gray-600">
                            {new Date(prescription.created_at).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setSelectedPrescription(prescription)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deletePrescription(prescription.prescription_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : showForm ? (
              /* New Prescription Form */
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Nueva Receta Médica</h3>
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diagnóstico
                    </label>
                    <textarea
                      name="diagnosis"
                      value={formData.diagnosis}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medicamentos
                    </label>
                    <textarea
                      name="medications"
                      value={formData.medications}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Ej: Paracetamol 500mg - 1 tableta cada 8 horas"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Indicaciones
                    </label>
                    <textarea
                      name="instructions"
                      value={formData.instructions}
                      onChange={handleInputChange}
                      rows="4"
                      placeholder="Instrucciones de uso, contraindicaciones, etc."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Duración del Tratamiento
                    </label>
                    <input
                      type="text"
                      name="treatment_duration"
                      value={formData.treatment_duration}
                      onChange={handleInputChange}
                      placeholder="Ej: 10 días"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 px-6 py-3 bg-gray-300 text-gray-800 font-medium rounded-lg hover:bg-gray-400 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                    >
                      Guardar Receta
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Prescription Detail View */
              <div className="bg-white rounded-lg shadow-md p-6">
                <button
                  onClick={() => setSelectedPrescription(null)}
                  className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
                >
                  ← Volver
                </button>

                <div className="space-y-6">
                  <div className="p-6 border-2 border-gray-300 rounded-lg bg-white">
                    <div className="mb-6 pb-6 border-b border-gray-300">
                      <h2 className="text-2xl font-bold text-gray-800">RECETA MÉDICA</h2>
                      <p className="text-gray-600">
                        {new Date(selectedPrescription.created_at).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div>
                        <h3 className="font-bold text-gray-800 mb-2">DIAGNÓSTICO</h3>
                        <p className="whitespace-pre-wrap text-gray-700">{selectedPrescription.diagnosis}</p>
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-800 mb-2">MEDICAMENTOS</h3>
                        <p className="whitespace-pre-wrap text-gray-700">{selectedPrescription.medications}</p>
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-800 mb-2">INDICACIONES</h3>
                        <p className="whitespace-pre-wrap text-gray-700">{selectedPrescription.instructions}</p>
                      </div>

                      <div>
                        <h3 className="font-bold text-gray-800 mb-2">DURACIÓN DEL TRATAMIENTO</h3>
                        <p className="text-gray-700">{selectedPrescription.treatment_duration}</p>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                  >
                    Imprimir Receta
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
