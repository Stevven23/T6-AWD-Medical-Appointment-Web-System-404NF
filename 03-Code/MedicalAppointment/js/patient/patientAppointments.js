document.addEventListener('DOMContentLoaded', async () => {
  if (!Helpers.checkAuth()) return;

  const user = Helpers.getCurrentUser();
  if (user.role !== 'patient') {
    window.location.href = '/panels/login.html';
    return;
  }

  // Elementos del DOM
  const appointmentsList = document.getElementById('appointmentsList');
  const filterStatus = document.getElementById('filterStatus');
  const filterUpcoming = document.getElementById('filterUpcoming');

  // Cargar citas
  await loadAppointments();

  // Event listeners para filtros
  filterStatus?.addEventListener('change', loadAppointments);
  filterUpcoming?.addEventListener('change', loadAppointments);

  /**
   * Cargar lista de citas
   */
  async function loadAppointments() {
    try {
      Helpers.showLoading(appointmentsList);

      const filters = {
        status: filterStatus?.value || null,
        upcoming: filterUpcoming?.checked || false
      };

      const appointments = await AppointmentAPI.getAppointments(filters);

      if (appointments.length === 0) {
        appointmentsList.innerHTML = `
          <div class="col-12">
            <div class="alert alert-info">
              <i class="fas fa-info-circle"></i> No se encontraron citas
            </div>
          </div>
        `;
        return;
      }

      appointmentsList.innerHTML = '';
      appointments.forEach(appointment => {
        const card = createAppointmentCard(appointment);
        appointmentsList.insertAdjacentHTML('beforeend', card);
      });

      // Agregar event listeners
      document.querySelectorAll('.btn-cancel-appointment').forEach(btn => {
        btn.addEventListener('click', handleCancelAppointment);
      });

    } catch (error) {
      console.error('Error al cargar citas:', error);
      appointmentsList.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger">
            Error al cargar las citas: ${error.message}
          </div>
        </div>
      `;
    }
  }

  /**
   * Crear tarjeta HTML de cita
   */
  function createAppointmentCard(appointment) {
    const statusColor = Helpers.getAppointmentStatusColor(appointment.status_code);
    const statusLabel = Helpers.getAppointmentStatusLabel(appointment.status_code);
    const appointmentDate = Helpers.formatDate(appointment.scheduled_start);
    const appointmentTime = Helpers.formatTime(appointment.scheduled_start);

    const canCancel = ['scheduled', 'confirmed'].includes(appointment.status_code);
    const isFuture = new Date(appointment.scheduled_start) > new Date();

    return `
      <div class="col-md-6 col-lg-4 mb-3">
        <div class="card h-100">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-start mb-3">
              <h5 class="card-title mb-0">
                <i class="fas fa-user-md text-primary"></i>
                Dr. ${appointment.doctor_first_name} ${appointment.doctor_last_name}
              </h5>
              <span class="badge bg-${statusColor}">${statusLabel}</span>
            </div>
            
            ${appointment.specialty_name ? `
              <p class="card-text">
                <i class="fas fa-stethoscope text-muted"></i>
                <strong>Especialidad:</strong> ${appointment.specialty_name}
              </p>
            ` : ''}
            
            <p class="card-text">
              <i class="fas fa-calendar-alt text-muted"></i>
              <strong>Fecha:</strong> ${appointmentDate}
            </p>
            
            <p class="card-text">
              <i class="fas fa-clock text-muted"></i>
              <strong>Hora:</strong> ${appointmentTime}
            </p>
            
            ${appointment.room_name ? `
              <p class="card-text">
                <i class="fas fa-door-open text-muted"></i>
                <strong>Consultorio:</strong> ${appointment.room_name}
              </p>
            ` : ''}
            
            ${appointment.reason ? `
              <p class="card-text">
                <i class="fas fa-notes-medical text-muted"></i>
                <strong>Motivo:</strong> ${appointment.reason}
              </p>
            ` : ''}
            
            <div class="mt-3 d-flex gap-2">
              ${canCancel && isFuture ? `
                <button class="btn btn-sm btn-danger btn-cancel-appointment" data-id="${appointment.id}">
                  <i class="fas fa-times"></i> Cancelar
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    `;
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
      
      Helpers.showAlert('✅ Cita cancelada exitosamente');
      await loadAppointments();

    } catch (error) {
      console.error('Error al cancelar cita:', error);
      Helpers.showAlert('❌ Error al cancelar la cita: ' + error.message);
      e.currentTarget.disabled = false;
      e.currentTarget.innerHTML = '<i class="fas fa-times"></i> Cancelar';
    }
  }
});
