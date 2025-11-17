document.addEventListener('DOMContentLoaded', async () => {
  if (!Helpers.checkAuth()) return;

  const user = Helpers.getCurrentUser();
  if (user.role !== 'patient') {
    window.location.href = '/panels/login.html';
    return;
  }

  // Elementos del DOM
  const appointmentsList = document.getElementById('appointmentsList');
  const tabButtons = document.querySelectorAll('.tab-btn');

  // Variable para el filtro actual
  let currentFilter = '';

  // Cargar citas iniciales
  await loadAppointments();

  // Event listeners para los tabs
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      loadAppointments();
    });
  });

  /**
   * Cargar lista de citas
   */
  async function loadAppointments() {
    try {
      Helpers.showLoading();

      const appointments = await AppointmentAPI.getAppointments();

      // Filtrar según el tab activo
      let filteredAppointments = appointments;
      if (currentFilter) {
        const statuses = currentFilter.split(',');
        filteredAppointments = appointments.filter(apt => 
          statuses.includes(apt.status_code)
        );
      }

      if (filteredAppointments.length === 0) {
        appointmentsList.innerHTML = `
          <div style="text-align: center; padding: 3rem; color: var(--text-light);">
            <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <p>No se encontraron citas</p>
          </div>
        `;
        return;
      }

      appointmentsList.innerHTML = filteredAppointments.map(appointment => 
        createAppointmentCard(appointment)
      ).join('');

      // Agregar event listeners
      attachEventListeners();

    } catch (error) {
      console.error('Error al cargar citas:', error);
      appointmentsList.innerHTML = `
        <div style="text-align: center; padding: 2rem; color: var(--error-color);">
          <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
          <p>Error al cargar las citas: ${error.message}</p>
        </div>
      `;
    } finally {
      Helpers.hideLoading();
    }
  }

  /**
   * Crear tarjeta HTML de cita con mejor estilo
   */
  function createAppointmentCard(appointment) {
    const statusColor = getStatusColor(appointment.status_code);
    const statusLabel = getStatusLabel(appointment.status_code);
    const appointmentDate = new Date(appointment.scheduled_start);
    const day = appointmentDate.getDate();
    const month = appointmentDate.toLocaleDateString('es-ES', { month: 'short' });
    const time = Helpers.formatTime(appointment.scheduled_start);

    const canCancel = ['scheduled', 'confirmed'].includes(appointment.status_code);
    const canReschedule = ['scheduled', 'confirmed'].includes(appointment.status_code);
    const isFuture = new Date(appointment.scheduled_start) > new Date();

    return `
      <div class="appointment-detail-card">
        <div class="appointment-header">
          <div class="appointment-date">
            <div class="day">${day}</div>
            <div class="month">${month.toUpperCase()}</div>
          </div>
          <div class="appointment-info">
            <h3><i class="fas fa-user-md"></i> Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}</h3>
            ${appointment.specialty_name ? `<p class="specialty"><i class="fas fa-stethoscope"></i> ${appointment.specialty_name}</p>` : ''}
            <div class="appointment-meta">
              <span class="time-badge"><i class="fas fa-clock"></i> ${time}</span>
              ${appointment.room_name ? `<span class="room-badge"><i class="fas fa-door-open"></i> ${appointment.room_name}</span>` : ''}
              <span class="status-badge status-${statusColor}">${statusLabel}</span>
            </div>
          </div>
        </div>
        
        ${appointment.reason ? `
          <div class="appointment-reason">
            <i class="fas fa-notes-medical"></i>
            <strong>Motivo:</strong> ${appointment.reason}
          </div>
        ` : ''}
        
        ${(canCancel || canReschedule) && isFuture ? `
          <div class="appointment-actions">
            ${canReschedule ? `
              <button class="btn-reschedule-appointment" data-id="${appointment.id}" data-doctor="${appointment.doctor_id}" data-date="${appointment.scheduled_start}" data-doctor-name="Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}">
                <i class="fas fa-calendar-alt"></i> Reagendar
              </button>
            ` : ''}
            ${canCancel ? `
              <button class="btn-cancel-appointment" data-id="${appointment.id}">
                <i class="fas fa-times-circle"></i> Cancelar
              </button>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Obtener color según estado
   */
  function getStatusColor(status) {
    const colors = {
      'scheduled': 'info',
      'confirmed': 'success',
      'completed': 'secondary',
      'cancelled': 'danger',
      'no-show': 'warning'
    };
    return colors[status] || 'secondary';
  }

  /**
   * Obtener etiqueta según estado
   */
  function getStatusLabel(status) {
    const labels = {
      'scheduled': 'Programada',
      'confirmed': 'Confirmada',
      'completed': 'Completada',
      'cancelled': 'Cancelada',
      'no-show': 'No asistió'
    };
    return labels[status] || status;
  }

  /**
   * Agregar event listeners a los botones
   */
  function attachEventListeners() {
    // Botones de cancelar
    document.querySelectorAll('.btn-cancel-appointment').forEach(btn => {
      btn.addEventListener('click', handleCancelAppointment);
    });

    // Botones de reagendar
    document.querySelectorAll('.btn-reschedule-appointment').forEach(btn => {
      btn.addEventListener('click', handleRescheduleAppointment);
    });
  }

  /**
   * Cancelar cita
   */
  async function handleCancelAppointment(e) {
    const appointmentId = e.currentTarget.dataset.id;
    
    if (!confirm('¿Está seguro de que desea cancelar esta cita?')) {
      return;
    }

    try {
      e.currentTarget.disabled = true;
      e.currentTarget.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

      await AppointmentAPI.cancelAppointment(appointmentId);
      
      Helpers.showAlert('Cita cancelada exitosamente', 'success');
      await loadAppointments();

    } catch (error) {
      console.error('Error al cancelar cita:', error);
      Helpers.showAlert('Error al cancelar la cita: ' + error.message, 'error');
      e.currentTarget.disabled = false;
      e.currentTarget.innerHTML = '<i class="fas fa-times-circle"></i> Cancelar';
    }
  }

  /**
   * Abrir modal de reagendamiento
   */
  async function handleRescheduleAppointment(e) {
    const appointmentId = e.currentTarget.dataset.id;
    const doctorId = e.currentTarget.dataset.doctor;
    const currentDate = e.currentTarget.dataset.date;
    const doctorName = e.currentTarget.dataset.doctorName;

    // Mostrar información de la cita actual
    const currentDetails = document.getElementById('currentAppointmentDetails');
    currentDetails.innerHTML = `
      <p style="margin: 5px 0;"><strong>Doctor:</strong> ${doctorName}</p>
      <p style="margin: 5px 0;"><strong>Fecha actual:</strong> ${Helpers.formatDate(currentDate)} a las ${Helpers.formatTime(currentDate)}</p>
    `;

    // Guardar datos en campos ocultos
    document.getElementById('rescheduleAppointmentId').value = appointmentId;
    document.getElementById('rescheduleDoctorId').value = doctorId;

    // Configurar fecha mínima (mañana)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateInput = document.getElementById('rescheduleDate');
    dateInput.min = tomorrow.toISOString().split('T')[0];
    dateInput.value = '';

    // Limpiar slots
    document.getElementById('rescheduleSlotsContainer').innerHTML = `
      <label>Horarios disponibles</label>
      <p class="text-muted">Seleccione una fecha para ver los horarios disponibles</p>
    `;
    document.getElementById('rescheduleSelectedSlot').value = '';
    document.getElementById('confirmRescheduleBtn').disabled = true;

    // Event listener para cambio de fecha
    dateInput.onchange = () => loadRescheduleSlots(doctorId, dateInput.value);

    // Mostrar modal
    document.getElementById('rescheduleModal').style.display = 'block';
  }

  /**
   * Cargar slots disponibles para reagendar
   */
  async function loadRescheduleSlots(doctorId, date) {
    const container = document.getElementById('rescheduleSlotsContainer');
    
    try {
      container.innerHTML = '<p class="text-muted">Cargando horarios disponibles...</p>';
      
      const response = await DoctorAPI.getAvailableSlots(doctorId, date);
      const slots = response.slots || response; // Manejar ambos formatos de respuesta
      
      if (!slots || slots.length === 0) {
        container.innerHTML = `
          <label>Horarios disponibles</label>
          <p style="color: var(--error-color);">No hay horarios disponibles para esta fecha</p>
        `;
        return;
      }

      container.innerHTML = `
        <label>Horarios disponibles</label>
        <div class="slots-container" style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">
          ${slots.map(slot => `
            <button type="button" class="btn-slot" data-slot="${slot.start}" data-end="${slot.end}">
              ${slot.start}
            </button>
          `).join('')}
        </div>
      `;

      // Event listeners para los slots
      document.querySelectorAll('.btn-slot').forEach(btn => {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.btn-slot').forEach(b => b.classList.remove('active'));
          this.classList.add('active');
          document.getElementById('rescheduleSelectedSlot').value = this.dataset.slot;
          document.getElementById('confirmRescheduleBtn').disabled = false;
        });
      });

    } catch (error) {
      console.error('Error al cargar slots:', error);
      container.innerHTML = `
        <label>Horarios disponibles</label>
        <p style="color: var(--error-color);">Error al cargar horarios: ${error.message}</p>
      `;
    }
  }

  /**
   * Confirmar reagendamiento
   */
  document.getElementById('confirmRescheduleBtn').addEventListener('click', async function() {
    const appointmentId = document.getElementById('rescheduleAppointmentId').value;
    const date = document.getElementById('rescheduleDate').value;
    const slot = document.getElementById('rescheduleSelectedSlot').value;

    if (!date || !slot) {
      Helpers.showAlert('Por favor seleccione una fecha y hora', 'warning');
      return;
    }

    const newScheduledStart = `${date}T${slot}:00`;

    try {
      this.disabled = true;
      this.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Reagendando...';

      await AppointmentAPI.rescheduleAppointment(appointmentId, newScheduledStart);
      
      Helpers.showAlert('Cita reagendada exitosamente', 'success');
      closeRescheduleModal();
      await loadAppointments();

    } catch (error) {
      console.error('Error al reagendar:', error);
      Helpers.showAlert('Error al reagendar la cita: ' + error.message, 'error');
      this.disabled = false;
      this.innerHTML = '<i class="fas fa-check"></i> Confirmar Reagendamiento';
    }
  });

  /**
   * Cerrar modal de reagendamiento
   */
  window.closeRescheduleModal = function() {
    document.getElementById('rescheduleModal').style.display = 'none';
    document.getElementById('rescheduleForm').reset();
  };

  /**
   * Cerrar modal de confirmación
   */
  window.closeConfirmModal = function() {
    document.getElementById('confirmModal').style.display = 'none';
  };

  // Cerrar modales al hacer clic fuera
  window.onclick = function(event) {
    const rescheduleModal = document.getElementById('rescheduleModal');
    const confirmModal = document.getElementById('confirmModal');
    
    if (event.target === rescheduleModal) {
      closeRescheduleModal();
    }
    if (event.target === confirmModal) {
      closeConfirmModal();
    }
  };
});
