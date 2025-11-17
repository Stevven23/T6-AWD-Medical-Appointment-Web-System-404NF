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
   * Mostrar registro médico con diseño mejorado
   */
  function displayMedicalRecord(record) {
    if (!medicalRecordSection) return;

    medicalRecordSection.innerHTML = `
      <div class="medical-record-card">
        <div class="medical-record-header">
          <div class="record-header-content">
            <h2><i class="fas fa-file-medical-alt"></i> Registro Médico General</h2>
            ${record.updated_at ? `
              <span class="update-date">
                <i class="fas fa-clock"></i> Última actualización: ${Helpers.formatDate(record.updated_at, true)}
              </span>
            ` : ''}
          </div>
        </div>
        
        <div class="medical-record-body">
          <div class="medical-info-grid">
            <!-- Alergias -->
            <div class="info-card ${record.allergies ? 'has-content alert-warning' : ''}">
              <div class="info-icon">
                <i class="fas fa-allergies"></i>
              </div>
              <div class="info-content">
                <h3>Alergias</h3>
                <p>${record.allergies || '<span class="text-muted">No registradas</span>'}</p>
              </div>
            </div>
            
            <!-- Condiciones Médicas -->
            <div class="info-card ${record.medical_conditions ? 'has-content alert-info' : ''}">
              <div class="info-icon">
                <i class="fas fa-heartbeat"></i>
              </div>
              <div class="info-content">
                <h3>Condiciones Médicas</h3>
                <p>${record.medical_conditions || '<span class="text-muted">Ninguna registrada</span>'}</p>
              </div>
            </div>
            
            <!-- Medicamentos Actuales -->
            <div class="info-card ${record.current_medications ? 'has-content' : ''}">
              <div class="info-icon">
                <i class="fas fa-pills"></i>
              </div>
              <div class="info-content">
                <h3>Medicamentos Actuales</h3>
                <p>${record.current_medications || '<span class="text-muted">Ninguno</span>'}</p>
              </div>
            </div>
            
            <!-- Diagnósticos -->
            <div class="info-card ${record.diagnoses ? 'has-content' : ''}">
              <div class="info-icon">
                <i class="fas fa-stethoscope"></i>
              </div>
              <div class="info-content">
                <h3>Diagnósticos</h3>
                <p>${record.diagnoses || '<span class="text-muted">Sin diagnósticos registrados</span>'}</p>
              </div>
            </div>
            
            <!-- Tratamientos -->
            <div class="info-card ${record.treatments ? 'has-content' : ''}">
              <div class="info-icon">
                <i class="fas fa-syringe"></i>
              </div>
              <div class="info-content">
                <h3>Tratamientos</h3>
                <p>${record.treatments || '<span class="text-muted">Sin tratamientos activos</span>'}</p>
              </div>
            </div>
            
            <!-- Historial Médico -->
            <div class="info-card full-width ${record.medical_history ? 'has-content' : ''}">
              <div class="info-icon">
                <i class="fas fa-history"></i>
              </div>
              <div class="info-content">
                <h3>Historial Médico</h3>
                <p>${record.medical_history || '<span class="text-muted">Sin historial registrado</span>'}</p>
              </div>
            </div>
          </div>
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

    consultationNotesSection.innerHTML = '';

    notes.forEach(note => {
      const noteCard = createConsultationNoteCard(note);
      consultationNotesSection.insertAdjacentHTML('beforeend', noteCard);
    });
  }

  /**
   * Crear tarjeta de nota con estilo timeline
   */
  function createConsultationNoteCard(note) {
    const appointmentDate = Helpers.formatDate(note.scheduled_start, false);
    const doctorName = `Dr. ${note.doctor_first_name} ${note.doctor_last_name}`;
    const specialty = note.specialty_name || 'Consulta General';

    // Determinar el título de la consulta
    let consultTitle = specialty;
    if (note.diagnosis) {
      consultTitle += ` - ${note.diagnosis.substring(0, 50)}${note.diagnosis.length > 50 ? '...' : ''}`;
    }

    return `
      <div class="timeline-item">
        <div class="timeline-marker"></div>
        <div class="timeline-content">
          <div class="timeline-date">${appointmentDate}</div>
          <div class="history-card">
            <div class="history-card-header">
              <h3>${consultTitle}</h3>
              <span class="badge-success">Completada</span>
            </div>
            <div class="history-card-body">
              <p><strong>Doctor:</strong> ${doctorName}</p>
              <p><strong>Especialidad:</strong> ${specialty}</p>
              
              ${note.diagnosis ? `
                <p><strong>Diagnóstico:</strong> ${note.diagnosis}</p>
              ` : ''}
              
              ${note.notes ? `
                <p><strong>Notas:</strong> ${note.notes}</p>
              ` : ''}
              
              ${note.treatment_plan ? `
                <p><strong>Plan de Tratamiento:</strong> ${note.treatment_plan}</p>
              ` : ''}
              
              ${note.prescriptions_given ? `
                <p><strong>Prescripciones:</strong> ${note.prescriptions_given}</p>
              ` : ''}
              
              ${note.follow_up_required && note.follow_up_date ? `
                <p><strong>Próximo Seguimiento:</strong> ${Helpers.formatDate(note.follow_up_date)}</p>
              ` : ''}
            </div>
            <div class="history-card-footer">
              <button class="btn-link"><i class="fas fa-file-pdf"></i> Ver Informe</button>
              ${note.prescriptions_given ? `
                <button class="btn-link"><i class="fas fa-prescription"></i> Ver Receta</button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }
});
