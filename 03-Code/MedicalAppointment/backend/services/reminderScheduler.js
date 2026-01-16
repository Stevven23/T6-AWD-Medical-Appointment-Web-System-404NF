const cron = require('node-cron');
const supabase = require('../database');
const emailService = require('./emailService');

/**
 * Scheduler de recordatorios
 * Revisa cada 5 minutos si hay recordatorios pendientes para enviar
 */
class ReminderScheduler {
  constructor() {
    this.task = null;
  }

  /**
   * Iniciar el scheduler
   */
  start() {
    // Ejecutar cada 5 minutos
    this.task = cron.schedule('*/5 * * * *', async () => {
      console.log('🔍 Revisando recordatorios pendientes...');
      await this.processReminders();
    });

    console.log('✅ Scheduler de recordatorios iniciado (cada 5 minutos)');
  }

  /**
   * Procesar recordatorios pendientes
   */
  async processReminders() {
    try {
      const now = new Date().toISOString();
      console.log(`⏰ Hora actual: ${now}`);

      // Obtener recordatorios pendientes
      const { data: reminders, error } = await supabase
        .from('reminders')
        .select(`
          id,
          appointment_id,
          reminder_type,
          recipient_email,
          scheduled_send_time,
          appointments (
            id,
            scheduled_start,
            scheduled_end,
            status_id,
            patient_user_id,
            doctor_id,
            doctors!appointments_doctor_id_fkey (
              id,
              users!inner (first_name, last_name),
              specialties (name)
            )
          )
        `)
        .eq('send_status', 'pending')
        .lte('scheduled_send_time', now)
        .limit(20);

      if (error) throw error;

      console.log(`📊 Recordatorios pendientes encontrados: ${reminders?.length || 0}`);
      
      if (!reminders || reminders.length === 0) {
        // Verificar si hay recordatorios pending en general
        const { data: allPending } = await supabase
          .from('reminders')
          .select('id, scheduled_send_time')
          .eq('send_status', 'pending')
          .limit(5);
        
        if (allPending && allPending.length > 0) {
          console.log(`⏳ Hay ${allPending.length} recordatorios pending pero aún no es hora de enviarlos:`);
          allPending.forEach(r => console.log(`   - ID ${r.id}: programado para ${r.scheduled_send_time}`));
        }
        return;
      }

      console.log(`📬 Encontrados ${reminders.length} recordatorios para enviar`);

      // Procesar cada recordatorio
      for (const reminder of reminders) {
        await this.sendReminder(reminder);
      }
    } catch (error) {
      console.error('❌ Error procesando recordatorios:', error);
    }
  }

  /**
   * Enviar un recordatorio específico
   */
  async sendReminder(reminder) {
    try {
      const appointment = reminder.appointments;
      if (!appointment) {
        console.warn(`⚠️  Cita no encontrada para recordatorio ${reminder.id}`);
        return;
      }

      // Verificar que la cita siga activa (1=scheduled, 2=confirmed)
      if (appointment.status_id === 5 || appointment.status_id === 4) { // cancelled or completed
        console.log(`⏭️  Omitiendo recordatorio para cita ${appointment.id} (status_id: ${appointment.status_id})`);
        await this.markReminderAsSent(reminder.id, 'skipped');
        return;
      }

      // Obtener datos del paciente
      const { data: patientData } = await supabase
        .from('users')
        .select('first_name, last_name, email')
        .eq('id', appointment.patient_user_id)
        .single();

      const doctor = appointment.doctors?.users;
      const specialty = appointment.doctors?.specialties?.name;

      if (!patientData || !doctor) {
        console.warn(`⚠️  Datos incompletos para recordatorio ${reminder.id}`);
        return;
      }

      // Formatear fecha y hora
      const appointmentDate = new Date(appointment.scheduled_start);
      const formattedDate = appointmentDate.toLocaleDateString('es-EC', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const emailData = {
        patientEmail: patientData.email,
        patientName: `${patientData.first_name} ${patientData.last_name}`,
        doctorName: `Dr(a). ${doctor.first_name} ${doctor.last_name}`,
        specialty: specialty || 'Consulta General',
        date: formattedDate,
        time: appointment.scheduled_start.split('T')[1].substring(0, 5),
        location: 'Clínica San Miguel'
      };

      // Enviar email
      await emailService.sendAppointmentReminder(emailData);

      // Marcar como enviado
      await this.markReminderAsSent(reminder.id, 'sent');
      
      console.log(`✅ Recordatorio enviado para cita ${appointment.id}`);
    } catch (error) {
      console.error(`❌ Error enviando recordatorio ${reminder.id}:`, error);
      
      // Incrementar contador de reintentos
      await this.incrementRetryCount(reminder.id);
    }
  }

  /**
   * Marcar recordatorio como enviado
   */
  async markReminderAsSent(reminderId, status = 'sent') {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({
          send_status: status,
          sent_at: new Date().toISOString()
        })
        .eq('id', reminderId);

      if (error) throw error;
    } catch (error) {
      console.error(`Error actualizando recordatorio ${reminderId}:`, error);
    }
  }

  /**
   * Incrementar contador de reintentos
   */
  async incrementRetryCount(reminderId) {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({
          retry_count: supabase.sql`retry_count + 1`,
          send_status: 'failed'
        })
        .eq('id', reminderId);

      if (error) throw error;
    } catch (error) {
      console.error(`Error incrementando reintentos ${reminderId}:`, error);
    }
  }

  /**
   * Detener el scheduler
   */
  stop() {
    if (this.task) {
      this.task.stop();
      console.log('⏹️  Scheduler de recordatorios detenido');
    }
  }
}

module.exports = new ReminderScheduler();
