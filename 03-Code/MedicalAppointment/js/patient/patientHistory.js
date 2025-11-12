document.addEventListener('DOMContentLoaded', async () => {
  if (!Helpers.checkAuth()) return;

  const user = Helpers.getCurrentUser();
  if (user.role !== 'patient') {
    window.location.href = '/panels/login.html';
    return;
  }

  // Elementos del DOM
  const medicalRecordSection = document.getElementById('medicalRecordSection');
  const consultationNotesSection = document.getElementById('consultationNotesSection');

  // Cargar historial
  await loadMedicalHistory();

  /**
   * Cargar historial médico
   */
  async function loadMedicalHistory() {
    try {
      // Mostrar loading
      if (medicalRecordSection) {
        medicalRecordSection.innerHTML = '<div class="text-center"><span class="spinner-border"></span></div>';
      }
      if (consultationNotesSection) {
        consultationNotesSection.innerHTML = '<div class="text-center"><span class="spinner-border"></span></div>';
      }

      // Cargar registro médico
      const medicalRecord = await MedicalRecordAPI.getMedicalRecord();
      displayMedicalRecord(medicalRecord);

      // Cargar notas de consultas
      const consultationNotes = await MedicalRecordAPI.getConsultationNotes();
      displayConsultationNotes(consultationNotes);

    } catch (error) {
      console.error('Error al cargar historial:', error);
      if (medicalRecordSection) {
        medicalRecordSection.innerHTML = `
          <div class="alert alert-danger">
            Error al cargar el historial médico: ${error.message}
          </div>
        `;
      }
    }
  }

  /**
   * Mostrar registro médico
   */
  function displayMedicalRecord(record) {
    if (!medicalRecordSection) return;

    medicalRecordSection.innerHTML = `
      <div class="card">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0">
            <i class="fas fa-file-medical"></i> Registro Médico General
          </h5>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-md-6 mb-3">
              <h6 class="text-muted">Alergias</h6>
              <p>${record.allergies || 'No registradas'}</p>
            </div>
            
            <div class="col-md-6 mb-3">
              <h6 class="text-muted">Condiciones Médicas</h6>
              <p>${record.medical_conditions || 'Ninguna registrada'}</p>
            </div>
            
            <div class="col-md-6 mb-3">
              <h6 class="text-muted">Medicamentos Actuales</h6>
              <p>${record.current_medications || 'Ninguno'}</p>
            </div>
            
            <div class="col-md-6 mb-3">
              <h6 class="text-muted">Historial Médico</h6>
              <p>${record.medical_history || 'Sin historial registrado'}</p>
            </div>
          </div>
          
          ${record.updated_at ? `
            <div class="text-muted small mt-2">
              <i class="fas fa-clock"></i> 
              Última actualización: ${Helpers.formatDate(record.updated_at, true)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Mostrar notas de consultas
   */
  function displayConsultationNotes(notes) {
    if (!consultationNotesSection) return;

    if (notes.length === 0) {
      consultationNotesSection.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i> No hay notas de consultas anteriores
        </div>
      `;
      return;
    }

    consultationNotesSection.innerHTML = '<h5 class="mb-3">Historial de Consultas</h5>';

    notes.forEach(note => {
      const noteCard = createConsultationNoteCard(note);
      consultationNotesSection.insertAdjacentHTML('beforeend', noteCard);
    });
  }

  /**
   * Crear tarjeta de nota
   */
  function createConsultationNoteCard(note) {
    const appointmentDate = Helpers.formatDate(note.scheduled_start, true);

    return `
      <div class="card mb-3">
        <div class="card-header">
          <div class="d-flex justify-content-between align-items-center">
            <h6 class="mb-0">
              <i class="fas fa-calendar-day"></i> ${appointmentDate}
            </h6>
            <span class="badge bg-info">
              Dr. ${note.doctor_first_name} ${note.doctor_last_name}
              ${note.specialty_name ? `- ${note.specialty_name}` : ''}
            </span>
          </div>
        </div>
        <div class="card-body">
          ${note.diagnosis ? `
            <div class="mb-3">
              <h6 class="text-primary">
                <i class="fas fa-diagnoses"></i> Diagnóstico
              </h6>
              <p>${note.diagnosis}</p>
            </div>
          ` : ''}
          
          ${note.notes ? `
            <div class="mb-3">
              <h6 class="text-primary">
                <i class="fas fa-notes-medical"></i> Notas de la Consulta
              </h6>
              <p>${note.notes}</p>
            </div>
          ` : ''}
          
          ${note.treatment_plan ? `
            <div class="mb-3">
              <h6 class="text-primary">
                <i class="fas fa-procedures"></i> Plan de Tratamiento
              </h6>
              <p>${note.treatment_plan}</p>
            </div>
          ` : ''}
          
          ${note.prescriptions_given ? `
            <div class="mb-3">
              <h6 class="text-primary">
                <i class="fas fa-prescription"></i> Prescripciones
              </h6>
              <p>${note.prescriptions_given}</p>
            </div>
          ` : ''}
          
          ${note.follow_up_required ? `
            <div class="alert alert-warning mb-0">
              <i class="fas fa-exclamation-triangle"></i>
              <strong>Seguimiento Requerido</strong>
              ${note.follow_up_date ? `- Fecha sugerida: ${Helpers.formatDate(note.follow_up_date)}` : ''}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
});
