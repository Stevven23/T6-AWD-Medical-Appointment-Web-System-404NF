document.addEventListener('DOMContentLoaded', async () => {
  if (!Helpers.checkAuth()) return;

  const user = Helpers.getCurrentUser();
  if (user.role !== 'patient') {
    window.location.href = '/panels/login.html';
    return;
  }

  // Mostrar nombre del usuario
  const userNameElement = document.getElementById('userName');
  if (userNameElement) {
    userNameElement.textContent = `${user.first_name} ${user.last_name}`;
  }

  // Cargar resumen
  await loadDashboardSummary();

  /**
   * Cargar resumen del dashboard
   */
  async function loadDashboardSummary() {
    try {
      const summary = await MedicalRecordAPI.getHistorySummary();

      // Actualizar estadísticas
      document.getElementById('totalCompleted').textContent = summary.summary.total_completed || '0';
      document.getElementById('upcomingCount').textContent = summary.summary.upcoming || '0';
      document.getElementById('cancelledCount').textContent = summary.summary.cancelled || '0';

      // Próxima cita
      if (summary.next_appointment) {
        const nextDate = Helpers.formatDate(summary.next_appointment.scheduled_start);
        const nextTime = Helpers.formatTime(summary.next_appointment.scheduled_start);
        
        document.getElementById('nextAppointmentDate').textContent = nextDate;
        document.getElementById('nextAppointmentTime').textContent = nextTime;
        document.getElementById('nextAppointmentDoctor').textContent = summary.next_appointment.doctor_name;
        document.getElementById('nextAppointmentSpecialty').textContent = summary.next_appointment.specialty || '';
      } else {
        document.getElementById('nextAppointmentCard').innerHTML = `
          <div class="alert alert-info">
            No tienes citas programadas
          </div>
        `;
      }

      // Última consulta
      if (summary.last_consultation) {
        const lastDate = Helpers.formatDate(summary.last_consultation.scheduled_start);
        
        document.getElementById('lastConsultationDate').textContent = lastDate;
        document.getElementById('lastConsultationDoctor').textContent = summary.last_consultation.doctor_name;
      }

    } catch (error) {
      console.error('Error al cargar resumen:', error);
    }
  }
});
