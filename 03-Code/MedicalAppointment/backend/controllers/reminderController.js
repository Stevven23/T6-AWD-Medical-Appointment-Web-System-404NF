// controllers/reminderController.js
const supabase = require('../database');

const reminderController = {
  // POST /api/reminders/schedule - Programar recordatorio
  scheduleReminder: async (req, res) => {
    try {
      const { 
        appointment_id, 
        reminder_type, 
        scheduled_send_time, 
        message_content,
        recipient_email,
        recipient_phone 
      } = req.body;

      // Validaciones
      if (!appointment_id || !reminder_type || !scheduled_send_time) {
        return res.status(400).json({ 
          error: 'appointment_id, reminder_type y scheduled_send_time son requeridos' 
        });
      }

      // Verificar que la cita existe
      const { data: appointment, error: aptError } = await supabase
        .from('appointments')
        .select('*, patient:users!appointments_patient_user_id_fkey(email, phone_number)')
        .eq('id', appointment_id)
        .single();

      if (aptError || !appointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      // Insertar recordatorio
      const { data, error } = await supabase
        .from('reminders')
        .insert([{
          appointment_id,
          reminder_type,
          scheduled_send_time,
          message_content: message_content || `Recordatorio: Tiene una cita el ${new Date(appointment.scheduled_start).toLocaleDateString()}`,
          recipient_email: recipient_email || appointment.patient.email,
          recipient_phone: recipient_phone || appointment.patient.phone_number,
          send_status: 'pending',
          retry_count: 0
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: 'Recordatorio programado exitosamente',
        reminder: data
      });
    } catch (error) {
      console.error('Error programando recordatorio:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // POST /api/reminders/send-now - Enviar recordatorio inmediatamente
  sendReminderNow: async (req, res) => {
    try {
      const { appointment_id, reminder_type, message_content } = req.body;

      if (!appointment_id || !reminder_type) {
        return res.status(400).json({ 
          error: 'appointment_id y reminder_type son requeridos' 
        });
      }

      // Obtener datos de la cita
      const { data: appointment, error: aptError } = await supabase
        .from('appointments')
        .select('*, patient:users!appointments_patient_user_id_fkey(email, phone_number, first_name)')
        .eq('id', appointment_id)
        .single();

      if (aptError || !appointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      // Crear recordatorio con envío inmediato
      const { data, error } = await supabase
        .from('reminders')
        .insert([{
          appointment_id,
          reminder_type,
          scheduled_send_time: new Date().toISOString(),
          message_content: message_content || `Hola ${appointment.patient.first_name}, recordatorio de su cita`,
          recipient_email: appointment.patient.email,
          recipient_phone: appointment.patient.phone_number,
          send_status: 'sent',
          sent_at: new Date().toISOString(),
          retry_count: 0
        }])
        .select()
        .single();

      if (error) throw error;

      // TODO: Aquí integrar servicio real de email/SMS
      console.log('📧 REMINDER ENVIADO:', {
        tipo: reminder_type,
        destinatario: appointment.patient.email,
        mensaje: data.message_content
      });

      res.status(200).json({
        message: 'Recordatorio enviado exitosamente',
        reminder: data
      });
    } catch (error) {
      console.error('Error enviando recordatorio:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/reminders - Obtener recordatorios
  getReminders: async (req, res) => {
    try {
      const { appointmentId, status } = req.query;

      let query = supabase
        .from('reminders')
        .select(`
          *,
          appointment:appointments(
            id,
            scheduled_start,
            patient:users!appointments_patient_user_id_fkey(first_name, last_name, email)
          )
        `)
        .order('scheduled_send_time', { ascending: false });

      if (appointmentId) {
        query = query.eq('appointment_id', appointmentId);
      }

      if (status) {
        query = query.eq('send_status', status);
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error('Error obteniendo recordatorios:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/reminders/:id - Obtener recordatorio por ID
  getReminderById: async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('reminders')
        .select(`
          *,
          appointment:appointments(
            id,
            scheduled_start,
            patient:users!appointments_patient_user_id_fkey(first_name, last_name, email)
          )
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Recordatorio no encontrado' });
      }

      res.json(data);
    } catch (error) {
      console.error('Error obteniendo recordatorio:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // PUT /api/reminders/:id - Actualizar recordatorio
  updateReminder: async (req, res) => {
    try {
      const { id } = req.params;
      const { scheduled_send_time, message_content, send_status } = req.body;

      const updates = {};
      if (scheduled_send_time) updates.scheduled_send_time = scheduled_send_time;
      if (message_content) updates.message_content = message_content;
      if (send_status) updates.send_status = send_status;

      const { data, error } = await supabase
        .from('reminders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Recordatorio no encontrado' });
      }

      res.json({
        message: 'Recordatorio actualizado exitosamente',
        reminder: data
      });
    } catch (error) {
      console.error('Error actualizando recordatorio:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // DELETE /api/reminders/:id - Eliminar recordatorio
  deleteReminder: async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({ message: 'Recordatorio eliminado exitosamente' });
    } catch (error) {
      console.error('Error eliminando recordatorio:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = reminderController;
