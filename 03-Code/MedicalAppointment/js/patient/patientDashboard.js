document.addEventListener('DOMContentLoaded', async () => {
  if (!Helpers.checkAuth()) return;

  const user = Helpers.getCurrentUser();
  if (user.role !== 'patient') {
    window.location.href = '/panels/login.html';
    return;
  }

  // Cargar perfil del usuario desde la base de datos
  await loadUserProfile();

  // Cargar resumen
  await loadDashboardSummary();

  /**
   * Cargar perfil del usuario
   */
  async function loadUserProfile() {
    try {
      const profile = await window.PatientAPI.getProfile();
      const userNameElement = document.getElementById('userName');
      if (userNameElement && profile) {
        userNameElement.textContent = `${profile.first_name || ''} ${profile.last_name || ''}`;
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      // Fallback a localStorage si falla
      const userNameElement = document.getElementById('userName');
      if (userNameElement) {
        userNameElement.textContent = `${user.first_name || 'Usuario'} ${user.last_name || ''}`;
      }
    }
  }

  /**
   * Cargar resumen del dashboard
   */
  async function loadDashboardSummary() {
    try {
      const summary = await window.MedicalRecordAPI.getHistorySummary();

      // Actualizar estadísticas con null-safety
      const totalCompleted = document.getElementById('totalCompleted');
      const upcomingCount = document.getElementById('upcomingCount');
      const cancelledCount = document.getElementById('cancelledCount');

      if (totalCompleted) totalCompleted.textContent = summary?.summary?.total_completed || '0';
      if (upcomingCount) upcomingCount.textContent = summary?.summary?.upcoming || '0';
      if (cancelledCount) cancelledCount.textContent = summary?.summary?.cancelled || '0';

      // Próxima cita
      const nextAppointmentCard = document.getElementById('nextAppointmentCard');
      if (summary?.next_appointment) {
        const nextDate = Helpers.formatDate(summary.next_appointment.scheduled_start);
        const nextTime = Helpers.formatTime(summary.next_appointment.scheduled_start);
        
        const nextDateEl = document.getElementById('nextAppointmentDate');
        const nextTimeEl = document.getElementById('nextAppointmentTime');
        const nextDoctorEl = document.getElementById('nextAppointmentDoctor');
        const nextSpecialtyEl = document.getElementById('nextAppointmentSpecialty');

        if (nextDateEl) nextDateEl.textContent = nextDate;
        if (nextTimeEl) nextTimeEl.textContent = nextTime;
        if (nextDoctorEl) nextDoctorEl.textContent = summary.next_appointment.doctor_name || 'N/A';
        if (nextSpecialtyEl) nextSpecialtyEl.textContent = summary.next_appointment.specialty || '';
      } else if (nextAppointmentCard) {
        nextAppointmentCard.innerHTML = `
          <div class="alert alert-info">
            No tienes citas programadas
          </div>
        `;
      }

      // Última consulta
      if (summary?.last_consultation) {
        const lastDate = Helpers.formatDate(summary.last_consultation.scheduled_start);
        
        const lastDateEl = document.getElementById('lastConsultationDate');
        const lastDoctorEl = document.getElementById('lastConsultationDoctor');

        if (lastDateEl) lastDateEl.textContent = lastDate;
        if (lastDoctorEl) lastDoctorEl.textContent = summary.last_consultation.doctor_name || 'N/A';
      }

    } catch (error) {
      console.error('Error al cargar resumen:', error);
      // Mostrar mensaje de error al usuario
      const nextAppointmentCard = document.getElementById('nextAppointmentCard');
      if (nextAppointmentCard) {
        nextAppointmentCard.innerHTML = `
          <div class="alert alert-danger">
            Error al cargar el resumen. Por favor, recarga la página.
          </div>
        `;
      }
    }
  }
});
