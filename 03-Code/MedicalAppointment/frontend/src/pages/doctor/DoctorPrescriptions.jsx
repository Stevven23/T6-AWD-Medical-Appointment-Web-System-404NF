import React, { useState, useEffect } from 'react';
import DoctorLayout from '../../layouts/DoctorLayout';
import { doctorAPI, prescriptionAPI } from '../../services/api';
import { TrashIcon, EyeIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

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
        if (!dateOfBirth) {
          console.warn('No date_of_birth provided');
          return null;
        }
        try {
          const today = new Date();
          const birthDate = new Date(dateOfBirth);
          
          // Validar que la fecha sea válida
          if (isNaN(birthDate.getTime())) {
            console.warn('Invalid date format:', dateOfBirth);
            return null;
          }
          
          let age = today.getFullYear() - birthDate.getFullYear();
          const monthDiff = today.getMonth() - birthDate.getMonth();
          if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
          }
          console.log(`Calculated age for ${dateOfBirth}: ${age}`);
          return age;
        } catch (err) {
          console.error('Error calculating age:', err);
          return null;
        }
      };
      
      // Mapear el formato de respuesta a lo que espera el componente
      const mappedPatients = allPatients.map(p => {
        const age = calculateAge(p.date_of_birth);
        return {
          patient_id: p.id || p.user_id,
          first_name: p.first_name,
          last_name: p.last_name,
          cedula: p.cedula,
          age: age,
          date_of_birth: p.date_of_birth
        };
      });
      
      console.log('Mapped patients:', mappedPatients);
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

  const downloadPrescriptionPDF = async (prescription) => {
    try {
      // Cargar jsPDF desde CDN
      if (!window.jspdf) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => generatePDF(prescription);
        document.body.appendChild(script);
      } else {
        generatePDF(prescription);
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      showNotification('Error al generar PDF', 'error');
    }
  };

  const generatePDF = (prescription) => {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 20;
    let y = 20;

    // Colores corporativos
    const primaryColor = [41, 128, 185]; // Azul
    const secondaryColor = [52, 73, 94]; // Gris oscuro
    const accentColor = [46, 204, 113]; // Verde

    // Encabezado con fondo
    pdf.setFillColor(...primaryColor);
    pdf.rect(0, 0, pageWidth, 45, 'F');

    // Logo/Nombre de la clínica
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.text('CLÍNICA SAN MIGUEL', margin, 20);
    
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text('Centro Médico Especializado', margin, 28);
    pdf.text('Tel: (02) 2XXX-XXXX | Email: info@clinicasanmiguel.ec', margin, 34);

    // Título del documento
    y = 55;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(18);
    pdf.setFont(undefined, 'bold');
    pdf.text('RECETA MÉDICA', margin, y);
    
    // Línea decorativa
    y += 3;
    pdf.setDrawColor(...accentColor);
    pdf.setLineWidth(1);
    pdf.line(margin, y, pageWidth - margin, y);

    // Información del paciente
    y += 12;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
    
    y += 8;
    pdf.setTextColor(...secondaryColor);
    pdf.setFontSize(11);
    pdf.setFont(undefined, 'bold');
    pdf.text('DATOS DEL PACIENTE', margin + 5, y);
    
    y += 7;
    pdf.setFontSize(10);
    pdf.setFont(undefined, 'normal');
    pdf.text(`Paciente: ${selectedPatient.first_name} ${selectedPatient.last_name}`, margin + 5, y);
    
    y += 6;
    pdf.text(`Cédula: ${selectedPatient.cedula || 'N/A'}`, margin + 5, y);

    // Información del médico
    y += 12;
    pdf.setFillColor(245, 245, 245);
    pdf.rect(margin, y, pageWidth - 2 * margin, 20, 'F');
    
    y += 8;
    pdf.setFont(undefined, 'bold');
    pdf.text('DATOS DEL MÉDICO', margin + 5, y);
    
    y += 6;
    pdf.setFont(undefined, 'normal');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    pdf.text(`Médico: Dr. ${user.first_name} ${user.last_name}`, margin + 5, y);

    // Contenido de la receta
    y += 15;
    
    // Diagnóstico
    if (prescription.diagnosis) {
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text('DIAGNÓSTICO', margin, y);
      y += 7;
      
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const diagLines = pdf.splitTextToSize(prescription.diagnosis, pageWidth - 2 * margin - 10);
      diagLines.forEach(line => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, margin + 5, y);
        y += 6;
      });
      y += 5;
    }

    // Medicamentos
    if (prescription.medications) {
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text('MEDICAMENTOS PRESCRITOS', margin, y);
      y += 7;
      
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const medLines = pdf.splitTextToSize(prescription.medications, pageWidth - 2 * margin - 10);
      medLines.forEach(line => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, margin + 5, y);
        y += 6;
      });
      y += 5;
    }

    // Instrucciones
    if (prescription.instructions) {
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text('INSTRUCCIONES', margin, y);
      y += 7;
      
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      const instLines = pdf.splitTextToSize(prescription.instructions, pageWidth - 2 * margin - 10);
      instLines.forEach(line => {
        if (y > 270) {
          pdf.addPage();
          y = 20;
        }
        pdf.text(line, margin + 5, y);
        y += 6;
      });
      y += 5;
    }

    // Duración
    if (prescription.duration) {
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(11);
      pdf.setTextColor(...primaryColor);
      pdf.text('DURACIÓN DEL TRATAMIENTO', margin, y);
      y += 7;
      
      pdf.setTextColor(...secondaryColor);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'normal');
      pdf.text(prescription.duration, margin + 5, y);
      y += 6;
    }

    // Pie de página
    y = pdf.internal.pageSize.getHeight() - 30;
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(9);
    pdf.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-ES')}`, margin, y);
    pdf.text('Receta válida por 30 días a partir de la fecha de emisión', margin, y + 6);

    // Descargar PDF
    const filename = `Receta_${selectedPatient.first_name}_${selectedPatient.last_name}_${new Date().getTime()}.pdf`;
    pdf.save(filename);
    showNotification('PDF descargado exitosamente', 'success');
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
                    <p className="text-xs text-gray-500 mt-2">
                      {patient.age !== null && patient.age !== undefined ? `${patient.age} años` : 'Edad no registrada'}
                    </p>
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
                            title="Ver detalles"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => downloadPrescriptionPDF(prescription)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition"
                            title="Descargar PDF"
                          >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deletePrescription(prescription.prescription_id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar"
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
              <div className="bg-white rounded-lg shadow-md p-6">                <h3 className="text-lg font-semibold text-gray-800 mb-4">Nueva Receta Médica</h3>
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
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DoctorLayout>
  );
}
