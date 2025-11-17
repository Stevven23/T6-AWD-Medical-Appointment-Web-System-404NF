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
  const searchInput = document.getElementById('searchInput');
  const yearFilter = document.getElementById('yearFilter');
  const specialtyFilter = document.getElementById('specialtyFilter');
  const downloadHistoryBtn = document.getElementById('downloadHistoryBtn');

  // Variables globales
  let allConsultationNotes = [];
  let filteredNotes = [];
  let medicalRecord = null;

  // Event listeners
  if (searchInput) searchInput.addEventListener('input', applyFilters);
  if (yearFilter) yearFilter.addEventListener('change', applyFilters);
  if (specialtyFilter) specialtyFilter.addEventListener('change', applyFilters);
  if (downloadHistoryBtn) downloadHistoryBtn.addEventListener('click', downloadHistoryPDF);

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
      medicalRecord = await MedicalRecordAPI.getMedicalRecord();
      displayMedicalRecord(medicalRecord);

      // Cargar notas de consultas
      allConsultationNotes = await MedicalRecordAPI.getConsultationNotes();
      filteredNotes = [...allConsultationNotes];
      
      // Poblar filtros
      populateYearFilter();
      populateSpecialtyFilter();
      
      // Mostrar notas
      displayConsultationNotes(filteredNotes);

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
   * Poblar filtro de años
   */
  function populateYearFilter() {
    if (!yearFilter || allConsultationNotes.length === 0) return;

    const years = new Set();
    allConsultationNotes.forEach(note => {
      if (note.scheduled_start) {
        const year = new Date(note.scheduled_start).getFullYear();
        years.add(year);
      }
    });

    const sortedYears = Array.from(years).sort((a, b) => b - a);
    sortedYears.forEach(year => {
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearFilter.appendChild(option);
    });
  }

  /**
   * Poblar filtro de especialidades
   */
  function populateSpecialtyFilter() {
    if (!specialtyFilter || allConsultationNotes.length === 0) return;

    const specialties = new Set();
    allConsultationNotes.forEach(note => {
      if (note.specialty_name) {
        specialties.add(note.specialty_name);
      }
    });

    const sortedSpecialties = Array.from(specialties).sort();
    sortedSpecialties.forEach(specialty => {
      const option = document.createElement('option');
      option.value = specialty;
      option.textContent = specialty;
      specialtyFilter.appendChild(option);
    });
  }

  /**
   * Aplicar filtros
   */
  function applyFilters() {
    const searchTerm = searchInput?.value.toLowerCase() || '';
    const selectedYear = yearFilter?.value || '';
    const selectedSpecialty = specialtyFilter?.value || '';

    filteredNotes = allConsultationNotes.filter(note => {
      // Filtro de búsqueda
      const matchesSearch = !searchTerm || 
        note.diagnosis?.toLowerCase().includes(searchTerm) ||
        note.notes?.toLowerCase().includes(searchTerm) ||
        note.treatment_plan?.toLowerCase().includes(searchTerm) ||
        note.specialty_name?.toLowerCase().includes(searchTerm) ||
        `${note.doctor_first_name} ${note.doctor_last_name}`.toLowerCase().includes(searchTerm);

      // Filtro de año
      const matchesYear = !selectedYear || 
        new Date(note.scheduled_start).getFullYear().toString() === selectedYear;

      // Filtro de especialidad
      const matchesSpecialty = !selectedSpecialty || 
        note.specialty_name === selectedSpecialty;

      return matchesSearch && matchesYear && matchesSpecialty;
    });

    displayConsultationNotes(filteredNotes);
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
          <i class="fas fa-info-circle"></i> No se encontraron consultas con los filtros aplicados
        </div>
      `;
      return;
    }

    consultationNotesSection.innerHTML = '';

    notes.forEach(note => {
      const noteCard = createConsultationNoteCard(note);
      consultationNotesSection.insertAdjacentHTML('beforeend', noteCard);
    });

    // Añadir event listeners a los botones después de renderizar
    addButtonListeners();
  }

  /**
   * Añadir event listeners a botones de las tarjetas
   */
  function addButtonListeners() {
    // Botones "Ver Informe"
    document.querySelectorAll('.btn-view-report').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const noteId = e.currentTarget.dataset.noteId;
        viewReport(noteId);
      });
    });

    // Botones "Ver Receta"
    document.querySelectorAll('.btn-view-prescription').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const noteId = e.currentTarget.dataset.noteId;
        viewPrescription(noteId);
      });
    });
  }

  /**
   * Ver informe completo - Genera PDF individual y lo abre
   */
  async function viewReport(noteId) {
    const note = allConsultationNotes.find(n => n.id.toString() === noteId);
    if (!note) return;

    try {
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
      pdf.text('INFORME DE CONSULTA MÉDICA', margin, y);
      
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
      pdf.text(`Paciente: ${user.first_name} ${user.last_name}`, margin + 5, y);
      
      y += 6;
      const consultDate = Helpers.formatDate(note.scheduled_start, true);
      pdf.text(`Fecha de Consulta: ${consultDate}`, margin + 5, y);

      // Información del médico
      y += 12;
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, y, pageWidth - 2 * margin, 25, 'F');
      
      y += 8;
      pdf.setFont(undefined, 'bold');
      pdf.text('DATOS DEL MÉDICO', margin + 5, y);
      
      y += 7;
      pdf.setFont(undefined, 'normal');
      const doctorName = `Dr. ${note.doctor_first_name} ${note.doctor_last_name}`;
      pdf.text(`Médico Tratante: ${doctorName}`, margin + 5, y);
      
      y += 6;
      pdf.text(`Especialidad: ${note.specialty_name || 'Medicina General'}`, margin + 5, y);

      // Contenido del informe
      y += 15;
      
      // Diagnóstico
      if (note.diagnosis) {
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(...primaryColor);
        pdf.text('DIAGNÓSTICO', margin, y);
        y += 7;
        
        pdf.setTextColor(...secondaryColor);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const diagLines = pdf.splitTextToSize(note.diagnosis, pageWidth - 2 * margin - 10);
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

      // Notas clínicas
      if (note.notes) {
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(...primaryColor);
        pdf.text('OBSERVACIONES CLÍNICAS', margin, y);
        y += 7;
        
        pdf.setTextColor(...secondaryColor);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const notesLines = pdf.splitTextToSize(note.notes, pageWidth - 2 * margin - 10);
        notesLines.forEach(line => {
          if (y > 270) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(line, margin + 5, y);
          y += 6;
        });
        y += 5;
      }

      // Plan de tratamiento
      if (note.treatment_plan) {
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(...primaryColor);
        pdf.text('PLAN DE TRATAMIENTO', margin, y);
        y += 7;
        
        pdf.setTextColor(...secondaryColor);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const treatLines = pdf.splitTextToSize(note.treatment_plan, pageWidth - 2 * margin - 10);
        treatLines.forEach(line => {
          if (y > 270) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(line, margin + 5, y);
          y += 6;
        });
        y += 5;
      }

      // Prescripciones
      if (note.prescriptions_given) {
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(...primaryColor);
        pdf.text('MEDICAMENTOS PRESCRITOS', margin, y);
        y += 7;
        
        pdf.setTextColor(...secondaryColor);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        const prescLines = pdf.splitTextToSize(note.prescriptions_given, pageWidth - 2 * margin - 10);
        prescLines.forEach(line => {
          if (y > 270) {
            pdf.addPage();
            y = 20;
          }
          pdf.text(line, margin + 5, y);
          y += 6;
        });
        y += 5;
      }

      // Seguimiento
      if (note.follow_up_required && note.follow_up_date) {
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(11);
        pdf.setTextColor(...primaryColor);
        pdf.text('SEGUIMIENTO', margin, y);
        y += 7;
        
        pdf.setTextColor(...secondaryColor);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text(`Próxima cita de control: ${Helpers.formatDate(note.follow_up_date)}`, margin + 5, y);
        y += 10;
      }

      // Pie de página
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Página ${i} de ${totalPages}`, pageWidth / 2, 285, { align: 'center' });
        pdf.text('Este es un documento médico confidencial', pageWidth / 2, 290, { align: 'center' });
      }

      // Abrir en nueva pestaña en lugar de descargar
      const pdfBlob = pdf.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, '_blank');

    } catch (error) {
      console.error('Error al generar informe:', error);
      alert('Error al generar el informe PDF');
    }
  }

  /**
   * Ver receta - Redirige a la página de recetas
   */
  function viewPrescription(noteId) {
    const note = allConsultationNotes.find(n => n.id.toString() === noteId);
    if (!note || !note.prescriptions_given) return;

    // Guardar el ID de la nota para filtrar en la página de recetas
    sessionStorage.setItem('prescriptionFilter', note.id);
    window.location.href = 'patientPrescriptions.html';
  }

  /**
   * Descargar historial en PDF
   */
  async function downloadHistoryPDF() {
    try {
      downloadHistoryBtn.disabled = true;
      downloadHistoryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generando PDF...';

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      let y = 20;

      // Colores corporativos
      const primaryColor = [41, 128, 185];
      const secondaryColor = [52, 73, 94];
      const accentColor = [46, 204, 113];
      const lightGray = [245, 245, 245];

      // Función para verificar espacio y añadir página
      const checkPageBreak = (requiredSpace) => {
        if (y + requiredSpace > pageHeight - 25) {
          addFooter();
          pdf.addPage();
          y = 20;
          return true;
        }
        return false;
      };

      // Función para añadir pie de página
      const addFooter = () => {
        const pageNum = pdf.internal.getCurrentPageInfo().pageNumber;
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
        pdf.text('Clínica San Miguel - Historial Médico Confidencial', pageWidth / 2, pageHeight - 10, { align: 'center' });
      };

      // ===== PORTADA =====
      pdf.setFillColor(...primaryColor);
      pdf.rect(0, 0, pageWidth, pageHeight, 'F');

      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(32);
      pdf.setFont(undefined, 'bold');
      pdf.text('HISTORIAL', pageWidth / 2, pageHeight / 2 - 30, { align: 'center' });
      pdf.text('MÉDICO', pageWidth / 2, pageHeight / 2 - 15, { align: 'center' });

      pdf.setFontSize(14);
      pdf.setFont(undefined, 'normal');
      pdf.text('CLÍNICA SAN MIGUEL', pageWidth / 2, pageHeight / 2 + 10, { align: 'center' });

      pdf.setFontSize(12);
      pdf.text(`${user.first_name} ${user.last_name}`, pageWidth / 2, pageHeight / 2 + 30, { align: 'center' });
      pdf.text(`Generado: ${new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}`, 
        pageWidth / 2, pageHeight / 2 + 40, { align: 'center' });

      // ===== PÁGINA 2: REGISTRO MÉDICO GENERAL =====
      pdf.addPage();
      y = 20;

      // Encabezado de sección
      pdf.setFillColor(...primaryColor);
      pdf.rect(0, y - 5, pageWidth, 12, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('REGISTRO MÉDICO GENERAL', margin, y + 5);
      
      y += 20;
      pdf.setTextColor(...secondaryColor);

      // Información del paciente
      pdf.setFillColor(...lightGray);
      pdf.rect(margin, y, pageWidth - 2 * margin, 20, 'F');
      y += 7;
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('INFORMACIÓN DEL PACIENTE', margin + 5, y);
      y += 6;
      pdf.setFont(undefined, 'normal');
      pdf.text(`Nombre: ${user.first_name} ${user.last_name}`, margin + 5, y);
      y += 5;
      if (medicalRecord?.updated_at) {
        pdf.text(`Última actualización: ${Helpers.formatDate(medicalRecord.updated_at, true)}`, margin + 5, y);
      }
      y += 15;

      // Campos del registro médico
      const recordFields = [
        { 
          label: 'ALERGIAS', 
          value: medicalRecord?.allergies,
          icon: '⚠️',
          color: [231, 76, 60] // Rojo
        },
        { 
          label: 'CONDICIONES MÉDICAS', 
          value: medicalRecord?.medical_conditions,
          icon: '❤️',
          color: [230, 126, 34] // Naranja
        },
        { 
          label: 'MEDICAMENTOS ACTUALES', 
          value: medicalRecord?.current_medications,
          icon: '💊',
          color: [52, 152, 219] // Azul
        },
        { 
          label: 'DIAGNÓSTICOS', 
          value: medicalRecord?.diagnoses,
          icon: '🩺',
          color: [155, 89, 182] // Morado
        },
        { 
          label: 'TRATAMIENTOS', 
          value: medicalRecord?.treatments,
          icon: '💉',
          color: [46, 204, 113] // Verde
        },
        { 
          label: 'HISTORIAL MÉDICO', 
          value: medicalRecord?.medical_history,
          icon: '📋',
          color: [149, 165, 166] // Gris
        }
      ];

      recordFields.forEach(field => {
        checkPageBreak(30);
        
        // Calcular altura necesaria para el contenido
        const fieldText = field.value || 'No registrado';
        const contentLines = pdf.splitTextToSize(fieldText, pageWidth - 2 * margin - 10);
        const boxHeight = 12 + (contentLines.length * 5); // 12 para el título + líneas de contenido
        
        // Caja con color de acento
        pdf.setDrawColor(...field.color);
        pdf.setLineWidth(0.5);
        pdf.setFillColor(255, 255, 255);
        pdf.rect(margin, y, pageWidth - 2 * margin, boxHeight, 'S');
        
        // Título del campo
        y += 7;
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...field.color);
        pdf.text(`${field.label}`, margin + 5, y);
        y += 5;
        
        // Contenido
        pdf.setFontSize(9);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(...secondaryColor);
        contentLines.forEach(line => {
          checkPageBreak(6);
          pdf.text(line, margin + 5, y);
          y += 5;
        });
        y += 8;
      });

      // ===== HISTORIAL DE CONSULTAS =====
      checkPageBreak(30);
      
      // Nueva sección
      pdf.setFillColor(...primaryColor);
      pdf.rect(0, y - 5, pageWidth, 12, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont(undefined, 'bold');
      pdf.text('HISTORIAL DE CONSULTAS', margin, y + 5);
      
      y += 20;

      if (filteredNotes.length === 0) {
        pdf.setTextColor(...secondaryColor);
        pdf.setFontSize(10);
        pdf.text('No hay consultas registradas con los filtros aplicados', margin, y);
      } else {
        filteredNotes.forEach((note, index) => {
          checkPageBreak(50);

          // Caja de consulta
          pdf.setFillColor(...lightGray);
          pdf.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
          
          y += 7;
          pdf.setFontSize(12);
          pdf.setFont(undefined, 'bold');
          pdf.setTextColor(...primaryColor);
          const consultDate = Helpers.formatDate(note.scheduled_start, false);
          pdf.text(`${index + 1}. ${consultDate} - ${note.specialty_name || 'Consulta'}`, margin + 5, y);
          
          y += 8;
          pdf.setFontSize(9);
          pdf.setFont(undefined, 'normal');
          pdf.setTextColor(...secondaryColor);
          
          const doctorName = `Dr. ${note.doctor_first_name} ${note.doctor_last_name}`;
          pdf.text(`Médico: ${doctorName}`, margin + 5, y);
          y += 6;

          if (note.diagnosis) {
            checkPageBreak(15);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(...accentColor);
            pdf.text('Diagnóstico:', margin + 5, y);
            y += 5;
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(...secondaryColor);
            const diagLines = pdf.splitTextToSize(note.diagnosis, pageWidth - 2 * margin - 10);
            diagLines.forEach(line => {
              checkPageBreak(5);
              pdf.text(line, margin + 10, y);
              y += 5;
            });
            y += 2;
          }

          if (note.treatment_plan) {
            checkPageBreak(15);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(...accentColor);
            pdf.text('Tratamiento:', margin + 5, y);
            y += 5;
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(...secondaryColor);
            const treatLines = pdf.splitTextToSize(note.treatment_plan, pageWidth - 2 * margin - 10);
            treatLines.forEach(line => {
              checkPageBreak(5);
              pdf.text(line, margin + 10, y);
              y += 5;
            });
            y += 2;
          }

          if (note.prescriptions_given) {
            checkPageBreak(15);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(...accentColor);
            pdf.text('Medicamentos:', margin + 5, y);
            y += 5;
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(...secondaryColor);
            const prescLines = pdf.splitTextToSize(note.prescriptions_given, pageWidth - 2 * margin - 10);
            prescLines.forEach(line => {
              checkPageBreak(5);
              pdf.text(line, margin + 10, y);
              y += 5;
            });
            y += 2;
          }

          y += 8;
          
          // Línea separadora
          if (index < filteredNotes.length - 1) {
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.3);
            pdf.line(margin, y, pageWidth - margin, y);
            y += 8;
          }
        });
      }

      // Añadir pie de página a todas las páginas
      const totalPages = pdf.internal.pages.length - 1;
      for (let i = 2; i <= totalPages; i++) { // Empezar desde la página 2 (después de la portada)
        pdf.setPage(i);
        addFooter();
      }

      // Guardar PDF
      const fileName = `Historial_Medico_${user.last_name}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error al generar PDF:', error);
      alert('Error al generar el PDF. Por favor intente nuevamente.');
    } finally {
      downloadHistoryBtn.disabled = false;
      downloadHistoryBtn.innerHTML = '<i class="fas fa-download"></i> Descargar Historial';
    }
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
              <button class="btn-link btn-view-report" data-note-id="${note.id}">
                <i class="fas fa-file-medical"></i> Ver Informe
              </button>
              ${note.prescriptions_given ? `
                <button class="btn-link btn-view-prescription" data-note-id="${note.id}">
                  <i class="fas fa-prescription"></i> Ver Receta
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
  }
});
