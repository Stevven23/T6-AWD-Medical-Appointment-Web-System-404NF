document.addEventListener('DOMContentLoaded', async () => {
  // Verificar si viene de OAuth callback
  const urlParams = new URLSearchParams(window.location.search);
  const oauthParam = urlParams.get('oauth');
  
  if (oauthParam) {
    try {
      const payload = JSON.parse(atob(oauthParam));
      localStorage.setItem('token', payload.token);
      localStorage.setItem('user', JSON.stringify(payload.user));
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (error) {
      console.error('Error procesando OAuth:', error);
    }
  }

  if (!Helpers.checkAuth()) return;

  const user = Helpers.getCurrentUser();
  if (user.role !== 'patient') {
    window.location.href = '/panels/login.html';
    return;
  }

  // Cargar datos del dashboard
  await loadUserProfile();
  await loadDashboardSummary();
  await loadRecentHistory();
  await loadHealthSummary();
  await loadNotifications();

  /**
   * Cargar perfil del usuario
   */
  async function loadUserProfile() {
    try {
      const profile = await window.PatientAPI.getProfile();
      const userNameElement = document.getElementById('userName');
      const userNameHeaderElement = document.getElementById('userNameHeader');
      
      const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim();
      
      if (userNameElement) {
        userNameElement.textContent = profile.first_name || 'Usuario';
      }
      if (userNameHeaderElement) {
        userNameHeaderElement.textContent = fullName || 'Usuario';
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      const userNameElement = document.getElementById('userName');
      if (userNameElement) {
        userNameElement.textContent = user.first_name || 'Usuario';
      }
    }
  }

  /**
   * Cargar resumen del dashboard
   */
  async function loadDashboardSummary() {
    try {
      const summary = await window.MedicalRecordAPI.getHistorySummary();

      // Actualizar estadísticas
      const totalCompleted = document.getElementById('totalCompleted');
      const upcomingCount = document.getElementById('upcomingCount');

      if (totalCompleted) totalCompleted.textContent = summary?.summary?.total_completed || '0';
      if (upcomingCount) upcomingCount.textContent = summary?.summary?.upcoming || '0';

      // Próxima cita
      const nextAppointmentCard = document.getElementById('nextAppointmentCard');
      const rescheduleBtn = document.getElementById('rescheduleBtn');
      
      if (summary?.next_appointment) {
        const appointmentDate = new Date(summary.next_appointment.scheduled_start);
        const now = new Date();
        
        // Verificar que la cita sea futura
        if (appointmentDate > now) {
          const day = appointmentDate.getDate();
          const month = appointmentDate.toLocaleDateString('es-ES', { month: 'short' });
          const time = Helpers.formatTime(summary.next_appointment.scheduled_start);
          
          const nextDateEl = document.getElementById('nextAppointmentDate');
          const nextTimeEl = document.getElementById('nextAppointmentTime');
          const nextDoctorEl = document.getElementById('nextAppointmentDoctor');
          const nextSpecialtyEl = document.getElementById('nextAppointmentSpecialty');

          if (nextDateEl) nextDateEl.textContent = `${day} ${month}`;
          if (nextTimeEl) nextTimeEl.textContent = time;
          if (nextDoctorEl) nextDoctorEl.textContent = summary.next_appointment.doctor_name || 'N/A';
          if (nextSpecialtyEl) nextSpecialtyEl.textContent = summary.next_appointment.specialty || '';
          
          if (rescheduleBtn) rescheduleBtn.style.display = 'block';
        } else if (nextAppointmentCard) {
          // Si la cita es pasada, mostrar mensaje de no hay citas
          nextAppointmentCard.innerHTML = `
            <h3>Próxima Cita</h3>
            <div style="text-align: center; padding: 2rem; color: var(--text-light);">
              <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 1rem;"></i>
              <p>No tienes citas programadas</p>
              <a href="newAppointment.html" class="btn-primary" style="margin-top: 1rem; display: inline-block;">
                <i class="fas fa-calendar-plus"></i> Agendar Nueva Cita
              </a>
            </div>
          `;
        }
      } else if (nextAppointmentCard) {
        nextAppointmentCard.innerHTML = `
          <h3>Próxima Cita</h3>
          <div style="text-align: center; padding: 2rem; color: var(--text-light);">
            <i class="fas fa-calendar-times" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <p>No tienes citas programadas</p>
            <a href="newAppointment.html" class="btn-primary" style="margin-top: 1rem; display: inline-block;">
              <i class="fas fa-calendar-plus"></i> Agendar Nueva Cita
            </a>
          </div>
        `;
      }

      // Última consulta
      if (summary?.last_consultation) {
        const lastDate = Helpers.formatDate(summary.last_consultation.scheduled_start);
        const lastDateEl = document.getElementById('lastConsultationDate');
        if (lastDateEl) lastDateEl.textContent = lastDate;
      }

    } catch (error) {
      console.error('Error al cargar resumen:', error);
      const nextAppointmentCard = document.getElementById('nextAppointmentCard');
      if (nextAppointmentCard) {
        nextAppointmentCard.innerHTML = `
          <h3>Próxima Cita</h3>
          <div style="text-align: center; padding: 2rem; color: var(--error-color);">
            <i class="fas fa-exclamation-triangle" style="font-size: 2rem; margin-bottom: 1rem;"></i>
            <p>Error al cargar información</p>
          </div>
        `;
      }
    }
  }

  /**
   * Cargar historial reciente
   */
  async function loadRecentHistory() {
    const container = document.getElementById('recentHistoryList');
    if (!container) return;

    try {
      const notes = await window.MedicalRecordAPI.getConsultationNotes();
      
      if (notes.length === 0) {
        container.innerHTML = `
          <p style="text-align: center; color: var(--text-light); padding: 1rem;">
            No hay consultas registradas
          </p>
        `;
        return;
      }

      // Mostrar solo las 3 más recientes
      const recentNotes = notes.slice(0, 3);
      
      container.innerHTML = recentNotes.map(note => {
        const date = Helpers.formatDate(note.scheduled_start || note.created_at);
        const specialty = note.specialty_name || 'Consulta General';
        const diagnosis = note.diagnosis || 'Control de Rutina';
        
        return `
          <div class="history-item">
            <span class="date">${date}</span>
            <span class="description">${specialty} - ${diagnosis}</span>
            <button class="btn-view" onclick="window.location.href='patientHistory.html'">Ver</button>
          </div>
        `;
      }).join('');

    } catch (error) {
      console.error('Error al cargar historial:', error);
      container.innerHTML = `
        <p style="text-align: center; color: var(--error-color); padding: 1rem;">
          Error al cargar historial
        </p>
      `;
    }
  }

  /**
   * Cargar resumen de salud
   */
  async function loadHealthSummary() {
    try {
        const profile = await window.PatientAPI.getProfile();
        
        // Elementos del DOM (Asegúrate de que existan en tu HTML)
        const bloodTypeEl = document.getElementById('bloodTypeValue');
        const allergiesEl = document.getElementById('allergiesValue');
        const conditionsEl = document.getElementById('conditionsValue'); // <-- NUEVO
        const medicationsEl = document.getElementById('medicationsValue'); // <-- NUEVO

        if (bloodTypeEl) {
            bloodTypeEl.textContent = profile.blood_type || 'No especificado';
        }
        
        if (allergiesEl) {
            const allergies = profile.allergies || 'Ninguna';
            allergiesEl.textContent = Helpers.truncateText(allergies, 30);
        }

        // --- AÑADIR ESTA LÓGICA ---
        if (conditionsEl) {
            const conditions = profile.medical_conditions || 'Ninguna';
            conditionsEl.textContent = Helpers.truncateText(conditions, 30);
        }

        if (medicationsEl) {
            const medications = profile.current_medications || 'Ninguno';
            medicationsEl.textContent = Helpers.truncateText(medications, 30);
        }
        // --- FIN DE LA LÓGICA AÑADIDA ---

    } catch (error) {
        console.error('Error al cargar resumen de salud:', error);
    }
}

  /**
   * Cargar notificaciones
   */
  async function loadNotifications() {
    const container = document.getElementById('notificationsList');
    if (!container) return;

    try {
      const notifications = [];
      
      // Obtener próxima cita para notificación
      const summary = await window.MedicalRecordAPI.getHistorySummary();
      
      if (summary?.next_appointment) {
        const appointmentDate = new Date(summary.next_appointment.scheduled_start);
        const now = new Date();
        const daysUntil = Math.ceil((appointmentDate - now) / (1000 * 60 * 60 * 24));
        
        console.log('Verificando notificación de cita:', {
          scheduledStart: summary.next_appointment.scheduled_start,
          appointmentDate: appointmentDate.toString(),
          now: now.toString(),
          daysUntil,
          isFuture: appointmentDate > now
        });
        
        // Solo mostrar notificación si la cita es futura y está dentro de los próximos 7 días
        if (appointmentDate > now && daysUntil >= 0 && daysUntil <= 7) {
          const dateStr = Helpers.formatDate(summary.next_appointment.scheduled_start);
          const timeStr = Helpers.formatTime(summary.next_appointment.scheduled_start);
          
          notifications.push({
            type: daysUntil <= 1 ? 'warning' : 'info',
            title: 'Recordatorio de Cita',
            text: `Tienes una cita programada para el ${dateStr} a las ${timeStr} con ${summary.next_appointment.doctor_name}`
          });
        }
      }

      // Verificar resultados de laboratorio recientes
      try {
        const labReports = await window.MedicalRecordAPI.getLabReports();
        const now = new Date();
        const recentReports = labReports.filter(report => {
          const reportDate = new Date(report.order_date);
          const daysSince = Math.ceil((now - reportDate) / (1000 * 60 * 60 * 24));
          
          console.log('Verificando reporte de laboratorio:', {
            orderDate: report.order_date,
            reportDate: reportDate.toString(),
            now: now.toString(),
            daysSince,
            status: report.status,
            isRecent: daysSince >= 0 && daysSince <= 7,
            isCompleted: report.status === 'completed'
          });
          
          // Solo reportes de los últimos 7 días
          return daysSince >= 0 && daysSince <= 7 && report.status === 'completed';
        });

        if (recentReports.length > 0) {
          notifications.push({
            type: 'info',
            title: 'Resultados Disponibles',
            text: `Tienes ${recentReports.length} resultado${recentReports.length > 1 ? 's' : ''} de laboratorio disponible${recentReports.length > 1 ? 's' : ''}`
          });
        }
      } catch (error) {
        // Lab reports opcional, no mostrar error
        console.log('No hay reportes de laboratorio:', error);
      }

      // Renderizar notificaciones
      if (notifications.length === 0) {
        container.innerHTML = `
          <p style="text-align: center; color: var(--text-light); padding: 1rem;">
            <i class="fas fa-check-circle" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
            No tienes notificaciones pendientes
          </p>
        `;
      } else {
        container.innerHTML = notifications.map(notif => `
          <div class="notification-item ${notif.type === 'warning' ? '' : 'info'}">
            <div class="title">${notif.title}</div>
            <div class="text">${notif.text}</div>
          </div>
        `).join('');
      }

    } catch (error) {
      console.error('Error al cargar notificaciones:', error);
      container.innerHTML = `
        <p style="text-align: center; color: var(--text-light); padding: 1rem;">
          No hay notificaciones en este momento
        </p>
      `;
    }
  }
});
