const supabase = require('../database');
const availabilityService = require('../services/availabilityService');
const emailService = require('../services/emailService');

/**
 * Crear recordatorio de cita 24 horas antes
 */
async function createAppointmentReminder(appointmentId, appointmentDate, patientEmail) {
  try {
    // Calcular fecha de envío (24 horas antes de la cita)
    const appointmentDateTime = new Date(appointmentDate);
    const reminderTime = new Date(appointmentDateTime.getTime() - (24 * 60 * 60 * 1000));

    const { data, error } = await supabase
      .from('reminders')
      .insert([{
        appointment_id: appointmentId,
        reminder_type: 'appointment_reminder',
        scheduled_send_time: reminderTime.toISOString(),
        recipient_email: patientEmail,
        send_status: 'pending'
      }])
      .select()
      .single();

    if (error) throw error;
    console.log(`✅ Recordatorio creado para cita ${appointmentId}`);
    return data;
  } catch (error) {
    console.error('Error creando recordatorio:', error);
    // No lanzar error para no bloquear la creación de la cita
  }
}

const appointmentController = {
  // Obtener slots disponibles de un doctor
  getAvailableSlots: async (req, res) => {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({ error: 'La fecha es requerida' });
      }

      const slots = await availabilityService.getAvailableSlots(doctorId, date);

      res.json({ slots });

    } catch (error) {
      console.error('Error al obtener slots:', error);
      res.status(500).json({ error: 'Error al obtener horarios disponibles' });
    }
  },

  getUpcomingAppointments: async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { limit = 5, days = 7 } = req.query;

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + parseInt(days));

    let query = supabase
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        scheduled_end,
        reason,
        status_id,
        appointment_status (code, label),
        consultation_rooms (name, room_number)
      `)
      .gte('scheduled_start', now.toISOString())
      .lte('scheduled_start', futureDate.toISOString())
      .in('status_id', [1, 2])
      .order('scheduled_start', { ascending: true })
      .limit(parseInt(limit));

    if (userRole === 'patient') {
      query = query
        .eq('patient_user_id', userId)
        .select(`
          *,
          doctors!appointments_doctor_id_fkey!inner (
            users!inner (first_name, last_name),
            specialties (name)
          )
        `);
    } else if (userRole === 'doctor') {
      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (doctor) {
        query = query
          .eq('doctor_id', doctor.id)
          .select(`
            *,
            users:patient_user_id (first_name, last_name)
          `);
      }
    }

    const { data, error } = await query;

    if (error) throw error;

    res.json(data || []);
  } catch (error) {
    console.error('Error fetching upcoming appointments:', error);
    res.status(500).json({ error: error.message });
  }
},

  // Crear nueva cita
  createAppointment: async (req, res) => {
    try {
      const patientUserId = req.user.id;
      const { doctor_id, scheduled_start, reason, duration_minutes = 30 } = req.body;

      if (!doctor_id || !scheduled_start) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
      }

      // Calcular scheduled_end
      const startDate = new Date(scheduled_start);
      const endDate = new Date(startDate.getTime() + duration_minutes * 60000);
      const scheduled_end = endDate.toISOString();

      // Verificar que el doctor existe
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('id', doctor_id)
        .eq('active', true)
        .single();

      if (doctorError || !doctor) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      // Verificar conflictos
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctor_id)
        .in('status_id', [1, 2]) // scheduled, confirmed
        .or(`and(scheduled_start.lte.${scheduled_start},scheduled_end.gt.${scheduled_start}),and(scheduled_start.lt.${scheduled_end},scheduled_end.gte.${scheduled_end}),and(scheduled_start.gte.${scheduled_start},scheduled_end.lte.${scheduled_end})`);

      if (conflicts && conflicts.length > 0) {
        return res.status(409).json({ 
          error: 'El horario seleccionado ya no está disponible' 
        });
      }

      // Obtener una sala disponible
      const { data: room } = await supabase
        .from('consultation_rooms')
        .select('id')
        .eq('is_available', true)
        .limit(1)
        .single();

      // Crear cita
      const { data: appointment, error: createError } = await supabase
        .from('appointments')
        .insert([{
          patient_user_id: patientUserId,
          doctor_id: doctor_id,
          room_id: room?.id || null,
          scheduled_start: scheduled_start,
          scheduled_end: scheduled_end,
          status_id: 1, // scheduled
          reason: reason || null,
          created_by_user_id: patientUserId
        }])
        .select()
        .single();

      if (createError) throw createError;

      // Obtener datos completos para email de confirmación
      try {
        const { data: fullAppointment } = await supabase
          .from('appointments')
          .select(`
            *,
            patient:patient_user_id (first_name, last_name, email),
            doctors!appointments_doctor_id_fkey (
              users (first_name, last_name),
              specialties (name)
            )
          `)
          .eq('id', appointment.id)
          .single();

        if (fullAppointment) {
          const patient = fullAppointment.patient;
          const doctor = fullAppointment.doctors?.users;
          const specialty = fullAppointment.doctors?.specialties?.name;

          if (patient && doctor) {
            await emailService.sendAppointmentConfirmation({
              patientEmail: patient.email,
              patientName: `${patient.first_name} ${patient.last_name}`,
              doctorName: `Dr(a). ${doctor.first_name} ${doctor.last_name}`,
              appointmentDate: scheduled_start,
              specialty: specialty || 'Consulta General'
            });
            console.log('✅ Email de confirmación enviado');
          }
        }

        // Crear recordatorio automático (24 horas antes)
        if (fullAppointment?.patient?.email) {
          await createAppointmentReminder(appointment.id, scheduled_start, fullAppointment.patient.email);
        }
      } catch (emailError) {
        console.error('❌ Error enviando email de confirmación:', emailError);
        // No fallar la creación si el email falla
      }

      res.status(201).json({
        message: 'Cita creada exitosamente',
        appointment
      });

    } catch (error) {
      console.error('Error al crear cita:', error);
      res.status(500).json({ error: 'Error al crear la cita' });
    }
  },

  // Obtener citas del paciente
  getPatientAppointments: async (req, res) => {
    try {
      const patientUserId = req.user.id;
      const { status, upcoming } = req.query;

      let query = supabase
        .from('appointments')
        .select(`
          id,
          scheduled_start,
          scheduled_end,
          reason,
          created_at,
          appointment_status!inner (
            id,
            code,
            label
          ),
          doctors!appointments_doctor_id_fkey!inner (
            id,
            users!inner (
              first_name,
              last_name
            ),
            specialties (
              name
            )
          ),
          consultation_rooms (
            name,
            room_number
          )
        `)
        .eq('patient_user_id', patientUserId);

      // Filtro por estado
      if (status) {
        query = query.eq('appointment_status.code', status);
      }

      // Solo citas futuras
      if (upcoming === 'true') {
        const now = new Date().toISOString();
        query = query.gte('scheduled_start', now);
      }

      const { data, error } = await query.order('scheduled_start', { ascending: false });

      if (error) throw error;

      // Formatear respuesta
      const appointments = data.map(apt => ({
        id: apt.id,
        scheduled_start: apt.scheduled_start,
        scheduled_end: apt.scheduled_end,
        reason: apt.reason,
        created_at: apt.created_at,
        status_code: apt.appointment_status.code,
        status_label: apt.appointment_status.label,
        doctor_id: apt.doctors.id,
        doctor_first_name: apt.doctors.users.first_name,
        doctor_last_name: apt.doctors.users.last_name,
        specialty_name: apt.doctors.specialties?.name,
        room_name: apt.consultation_rooms?.name,
        room_number: apt.consultation_rooms?.room_number
      }));

      res.json(appointments);

    } catch (error) {
      console.error('Error al obtener citas:', error);
      res.status(500).json({ error: 'Error al obtener citas' });
    }
  },

  // Obtener detalle de una cita
  getAppointmentById: async (req, res) => {
    try {
      const { id } = req.params;
      const patientUserId = req.user.id;

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_status (code, label),
          doctors!appointments_doctor_id_fkey!inner (
            id,
            professional_id,
            bio,
            users!inner (
              first_name,
              last_name,
              email,
              phone_number
            ),
            specialties (
              name
            )
          ),
          consultation_rooms (
            name,
            room_number,
            floor
          )
        `)
        .eq('id', id)
        .eq('patient_user_id', patientUserId)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      // Formatear respuesta
      const appointment = {
        id: data.id,
        scheduled_start: data.scheduled_start,
        scheduled_end: data.scheduled_end,
        reason: data.reason,
        created_at: data.created_at,
        updated_at: data.updated_at,
        status_code: data.appointment_status.code,
        status_label: data.appointment_status.label,
        doctor_id: data.doctors.id,
        doctor_professional_id: data.doctors.professional_id,
        doctor_bio: data.doctors.bio,
        doctor_first_name: data.doctors.users.first_name,
        doctor_last_name: data.doctors.users.last_name,
        doctor_email: data.doctors.users.email,
        doctor_phone: data.doctors.users.phone_number,
        specialty_name: data.doctors.specialties?.name,
        room_name: data.consultation_rooms?.name,
        room_number: data.consultation_rooms?.room_number,
        room_floor: data.consultation_rooms?.floor
      };

      res.json(appointment);

    } catch (error) {
      console.error('Error al obtener cita:', error);
      res.status(500).json({ error: 'Error al obtener cita' });
    }
  },

  // Confirmar cita (Doctor)
  confirmAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body;
      const userId = req.user.id;

      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      // Verificar que la cita pertenece al doctor
      const { data: appointment, error: checkError } = await supabase
        .from('appointments')
        .select('doctor_id, status_id')
        .eq('id', id)
        .single();

      if (checkError || !appointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      if (appointment.doctor_id !== doctor.id) {
        return res.status(403).json({ 
          error: 'No tienes permiso para confirmar esta cita' 
        });
      }

      // Actualizar a estado confirmed (2)
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status_id: 2,
          notes: notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Cita confirmada exitosamente',
        appointment: data
      });
    } catch (error) {
      console.error('Error confirming appointment:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Completar cita (Doctor)
  completeAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const { diagnosis, treatment, notes } = req.body;
      const userId = req.user.id;

      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      const { data: appointment, error: checkError } = await supabase
        .from('appointments')
        .select('doctor_id, status_id')
        .eq('id', id)
        .single();

      if (checkError || !appointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      if (appointment.doctor_id !== doctor.id) {
        return res.status(403).json({ 
          error: 'No tienes permiso para completar esta cita' 
        });
      }

      // Actualizar a estado completed (3)
      const { data, error } = await supabase
        .from('appointments')
        .update({
          status_id: 3,
          diagnosis: diagnosis || null,
          treatment: treatment || null,
          notes: notes || null,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Cita completada exitosamente',
        appointment: data
      });
    } catch (error) {
      console.error('Error completing appointment:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Cancelar cita
  cancelAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log(`[CANCEL] User ${userId} (role: ${userRole}) attempting to cancel appointment ${id}`);

      // Obtener cita con información completa
      const { data: appointment, error: checkError } = await supabase
        .from('appointments')
        .select('id, scheduled_start, status_id, patient_user_id, doctor_id')
        .eq('id', id)
        .single();

      if (checkError) {
        console.error('[CANCEL] Database error checking appointment:', checkError);
        return res.status(500).json({ 
          error: 'Error al verificar la cita',
          details: checkError.message 
        });
      }

      if (!appointment) {
        console.error('[CANCEL] Appointment not found');
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      // Validar que el usuario tenga permiso (paciente dueño o doctor asignado)
      let hasPermission = false;
      if (userRole === 'patient' && appointment.patient_user_id === userId) {
        hasPermission = true;
      } else if (userRole === 'doctor') {
        // Verificar que el doctor sea el asignado a esta cita
        const { data: doctor } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (doctor && doctor.id === appointment.doctor_id) {
          hasPermission = true;
        }
      }

      if (!hasPermission) {
        console.error('[CANCEL] User does not have permission to cancel this appointment');
        return res.status(403).json({ error: 'No tienes permiso para cancelar esta cita' });
      }

      // Actualizar estado a cancelled (status_id = 3)
      console.log('[CANCEL] Updating appointment status to cancelled (3)');
      const { data: updatedData, error: updateError } = await supabase
        .from('appointments')
        .update({ 
          status_id: 3,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (updateError) {
        console.error('[CANCEL] Database error updating appointment:', updateError);
        return res.status(500).json({ 
          error: 'Error al cancelar la cita',
          details: updateError.message,
          code: updateError.code
        });
      }

      if (!updatedData || updatedData.length === 0) {
        console.error('[CANCEL] No rows updated');
        return res.status(500).json({ error: 'No se pudo actualizar la cita' });
      }

      console.log('[CANCEL] Successfully cancelled appointment:', updatedData[0].id);
      
      // Enviar correo de cancelación al paciente
      try {
        console.log('[CANCEL] Fetching appointment details for email...');
        const { data: fullAppointment, error: fetchError } = await supabase
          .from('appointments')
          .select(`
            *,
            patient:patient_user_id (first_name, last_name, email),
            doctors!appointments_doctor_id_fkey (
              users (first_name, last_name),
              specialties (name)
            )
          `)
          .eq('id', id)
          .single();

        if (fetchError) {
          console.error('[CANCEL] Error fetching appointment details:', fetchError);
          throw fetchError;
        }

        console.log('[CANCEL] Appointment details fetched:', {
          hasPatient: !!fullAppointment?.patient,
          hasDoctor: !!fullAppointment?.doctors
        });

        if (fullAppointment) {
          const patient = fullAppointment.patient;
          const doctor = fullAppointment.doctors?.users;
          const specialty = fullAppointment.doctors?.specialties?.name;

          console.log('[CANCEL] Email data:', {
            patientEmail: patient?.email,
            patientName: patient ? `${patient.first_name} ${patient.last_name}` : 'N/A',
            doctorName: doctor ? `${doctor.first_name} ${doctor.last_name}` : 'N/A'
          });

          if (patient && doctor) {
            console.log('[CANCEL] Sending cancellation email...');
            const appointmentDate = new Date(fullAppointment.scheduled_start);
            await emailService.sendAppointmentCancellation({
              patientEmail: patient.email,
              patientName: `${patient.first_name} ${patient.last_name}`,
              doctorName: `Dr(a). ${doctor.first_name} ${doctor.last_name}`,
              specialty: specialty || 'Consulta General',
              date: appointmentDate.toLocaleDateString('es-EC', { dateStyle: 'full' }),
              time: fullAppointment.scheduled_start.split('T')[1].substring(0, 5),
              cancellationReason: 'Cancelado por el paciente'
            });
            console.log('[CANCEL] ✅ Cancellation email sent successfully');
          } else {
            console.warn('[CANCEL] ⚠️ Missing patient or doctor data, email not sent');
          }
        } else {
          console.warn('[CANCEL] ⚠️ No appointment data returned');
        }

        // Cancelar recordatorio pendiente
        console.log('[CANCEL] Cancelling reminder...');
        const { error: reminderError } = await supabase
          .from('reminders')
          .update({ send_status: 'cancelled' })
          .eq('appointment_id', id)
          .eq('send_status', 'pending');
        
        if (reminderError) {
          console.error('[CANCEL] Error cancelling reminder:', reminderError);
        } else {
          console.log('[CANCEL] Reminder cancelled');
        }
      } catch (emailError) {
        console.error('[CANCEL] ❌ Error in email process:', emailError);
        console.error('[CANCEL] Error stack:', emailError.stack);
        // No fallar la cancelación si el email falla
      }

      res.json({ 
        message: 'Cita cancelada exitosamente', 
        appointment: updatedData[0] 
      });

    } catch (error) {
      console.error('[CANCEL] Unexpected error:', error);
      res.status(500).json({ 
        error: 'Error al cancelar la cita',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  },

  // Actualizar cita (Paciente)
  updateAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const patientUserId = req.user.id;
      const { reason } = req.body;

      const { data: appointment, error: checkError } = await supabase
        .from('appointments')
        .select('patient_user_id, status_id')
        .eq('id', id)
        .single();

      if (checkError || !appointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      if (appointment.patient_user_id !== patientUserId) {
        return res.status(403).json({ 
          error: 'No tienes permiso para modificar esta cita' 
        });
      }

      if (![1, 2].includes(appointment.status_id)) {
        return res.status(400).json({ 
          error: 'Solo se pueden modificar citas programadas o confirmadas' 
        });
      }

      const { data, error } = await supabase
        .from('appointments')
        .update({
          reason: reason || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Cita actualizada exitosamente',
        appointment: data
      });
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(500).json({ error: error.message });
    }
  },
  
  // Reagendar cita
  rescheduleAppointment: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const userRoleCode = req.user.roleCode;
      const { scheduled_start, new_scheduled_start, duration_minutes = 30 } = req.body;

      console.log(`[RESCHEDULE] Attempting to reschedule appointment ${id} for user ${userId} (role: ${userRole}, roleCode: ${userRoleCode})`);
      console.log(`[RESCHEDULE] Request body:`, req.body);

      // Usar scheduled_start si new_scheduled_start no está definido (compatibilidad)
      const finalStartTime = new_scheduled_start || scheduled_start;

      if (!finalStartTime) {
        return res.status(400).json({ error: 'La nueva fecha es requerida' });
      }

      // Obtener cita con información del doctor
      const { data: appointment, error: checkError } = await supabase
        .from('appointments')
        .select('id, doctor_id, patient_user_id, status_id')
        .eq('id', id)
        .single();

      if (checkError || !appointment) {
        console.error('[RESCHEDULE] Appointment not found');
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      // Validar que el usuario tenga permiso (paciente dueño o doctor asignado)
      let hasPermission = false;
      if (userRole === 'patient' && appointment.patient_user_id === userId) {
        hasPermission = true;
      } else if (userRole === 'doctor') {
        // Verificar que el doctor sea el asignado a esta cita
        const { data: doctor, error: doctorError } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        console.log(`[RESCHEDULE] Doctor lookup for user ${userId}: doctor=${JSON.stringify(doctor)}, error=${JSON.stringify(doctorError)}`);
        console.log(`[RESCHEDULE] Comparing doctor.id=${doctor?.id} with appointment.doctor_id=${appointment.doctor_id}`);
        
        if (doctor && doctor.id === appointment.doctor_id) {
          hasPermission = true;
        } else if (!doctor) {
          console.error('[RESCHEDULE] No doctor record found for user', userId);
        } else {
          console.error(`[RESCHEDULE] Doctor ID mismatch: ${doctor.id} !== ${appointment.doctor_id}`);
        }
      }

      if (!hasPermission) {
        console.error('[RESCHEDULE] User does not have permission to reschedule this appointment. Role:', userRole, 'userId:', userId);
        console.error('[RESCHEDULE] Appointment details:', { patient_user_id: appointment.patient_user_id, doctor_id: appointment.doctor_id });
        return res.status(403).json({ error: 'No tiene permiso para reagendar esta cita' });
      }

      // Verificar que esté en estado válido (scheduled o confirmed)
      if (![1, 2].includes(appointment.status_id)) {
        console.error('[RESCHEDULE] Invalid status:', appointment.status_id);
        return res.status(400).json({ 
          error: 'Solo se pueden reagendar citas programadas o confirmadas' 
        });
      }

      // Calcular nuevo scheduled_end
      const startDate = new Date(finalStartTime);
      const endDate = new Date(startDate.getTime() + duration_minutes * 60000);
      const new_scheduled_end = endDate.toISOString();

      console.log('[RESCHEDULE] New times:', { finalStartTime, new_scheduled_end });

      // Verificar disponibilidad
      const { data: conflicts, error: conflictError } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', appointment.doctor_id)
        .neq('id', id)
        .in('status_id', [1, 2])
        .or(`and(scheduled_start.lte.${finalStartTime},scheduled_end.gt.${finalStartTime}),and(scheduled_start.lt.${new_scheduled_end},scheduled_end.gte.${new_scheduled_end})`);

      if (conflictError) {
        console.error('[RESCHEDULE] Conflict check error:', conflictError);
        throw conflictError;
      }

      if (conflicts && conflicts.length > 0) {
        console.error('[RESCHEDULE] Time slot conflict detected');
        return res.status(409).json({ 
          error: 'El nuevo horario no está disponible' 
        });
      }

      // Actualizar cita
      const { data: updatedData, error: updateError } = await supabase
        .from('appointments')
        .update({
          scheduled_start: finalStartTime,
          scheduled_end: new_scheduled_end,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select();

      if (updateError) {
        console.error('[RESCHEDULE] Update error:', updateError);
        throw updateError;
      }

      console.log('[RESCHEDULE] Success:', updatedData);
      
      // Enviar email de reagendación
      try {
        const { data: fullAppointment } = await supabase
          .from('appointments')
          .select(`
            *,
            patient:patient_user_id (first_name, last_name, email),
            doctors!appointments_doctor_id_fkey (
              users (first_name, last_name),
              specialties (name)
            )
          `)
          .eq('id', id)
          .single();

        if (fullAppointment) {
          const patient = fullAppointment.patient;
          const doctor = fullAppointment.doctors?.users;
          const specialty = fullAppointment.doctors?.specialties?.name;

          if (patient && doctor) {
            await emailService.sendAppointmentRescheduled({
              patientEmail: patient.email,
              patientName: `${patient.first_name} ${patient.last_name}`,
              doctorName: `Dr(a). ${doctor.first_name} ${doctor.last_name}`,
              oldDate: appointment.scheduled_start,
              newDate: finalStartTime,
              specialty: specialty || 'Consulta General'
            });
            console.log('[RESCHEDULE] ✅ Email de reagendación enviado');
          }
        }

        // Actualizar recordatorio
        const reminderTime = new Date(new Date(finalStartTime).getTime() - (24 * 60 * 60 * 1000));
        await supabase
          .from('reminders')
          .update({ 
            scheduled_send_time: reminderTime.toISOString(),
            send_status: 'pending' 
          })
          .eq('appointment_id', id)
          .eq('reminder_type', 'appointment_reminder');
      } catch (emailError) {
        console.error('[RESCHEDULE] ❌ Error enviando email:', emailError);
        // No fallar la reagendación si el email falla
      }

      res.json({
        message: 'Cita reagendada exitosamente',
        appointment: updatedData[0],
        new_scheduled_start: finalStartTime,
        new_scheduled_end
      });

    } catch (error) {
      console.error('[RESCHEDULE] Error al reagendar cita:', error);
      res.status(500).json({ 
        error: 'Error al reagendar la cita',
        details: error.message 
      });
    }
  },

  // Obtener citas del doctor
  getDoctorAppointments: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Doctor no autenticado' });
      }

      // Get doctor_id from user_id
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (doctorError || !doctor) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      // Traer citas de los últimos 3 meses y próximos 3 meses para mostrar completo
      const pastDate = new Date();
      pastDate.setMonth(pastDate.getMonth() - 3);
      
      const futureDate = new Date();
      futureDate.setMonth(futureDate.getMonth() + 3);

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          patient_user_id,
          scheduled_start,
          scheduled_end,
          reason,
          status_id,
          room_id,
          created_at,
          updated_at,
          users:patient_user_id (
            first_name,
            last_name,
            email
          ),
          appointment_status (
            code,
            label
          ),
          consultation_rooms (
            id,
            name,
            room_number
          )
        `)
        .eq('doctor_id', doctor.id)
        .gte('scheduled_start', pastDate.toISOString())
        .lte('scheduled_start', futureDate.toISOString())
        .order('scheduled_start', { ascending: true });

      if (error) throw error;

      // Format response
      const appointments = (data || []).map(apt => ({
        id: apt.id,
        patient_user_id: apt.patient_user_id,
        patient_name: apt.users ? `${apt.users.first_name} ${apt.users.last_name}` : 'Paciente desconocido',
        patient_email: apt.users?.email,
        scheduled_start: apt.scheduled_start,
        scheduled_end: apt.scheduled_end,
        reason: apt.reason,
        status_id: apt.status_id,
        status_label: apt.appointment_status?.label,
        status_code: apt.appointment_status?.code,
        room_id: apt.room_id,
        room_name: apt.consultation_rooms?.name,
        room_number: apt.consultation_rooms?.room_number,
        created_at: apt.created_at,
        updated_at: apt.updated_at
      }));

      res.json(appointments);
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Crear cita por doctor
  createAppointmentByDoctor: async (req, res) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Doctor no autenticado' });
      }

      // Get doctor_id from user_id
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (doctorError || !doctor) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      const {
        patient_user_id,
        scheduled_start,
        scheduled_end,
        reason,
        room_id,
        duration_minutes = 30
      } = req.body;

      if (!patient_user_id || !scheduled_start) {
        return res.status(400).json({
          error: 'patient_user_id y scheduled_start son requeridos'
        });
      }

      // Verify patient exists
      const { data: patient, error: patientError } = await supabase
        .from('users')
        .select('id')
        .eq('id', patient_user_id)
        .single();

      if (patientError || !patient) {
        return res.status(404).json({ error: 'Paciente no encontrado' });
      }

      // Calculate end time if not provided
      let endDateTime = scheduled_end;
      if (!endDateTime) {
        const startDate = new Date(scheduled_start);
        endDateTime = new Date(startDate.getTime() + duration_minutes * 60000).toISOString();
      }

      // Check for conflicts
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctor.id)
        .neq('status_id', 5) // Exclude cancelled appointments
        .or(`and(scheduled_start.lte.${scheduled_start},scheduled_end.gt.${scheduled_start}),and(scheduled_start.lt.${endDateTime},scheduled_end.gte.${endDateTime})`);

      if (conflicts && conflicts.length > 0) {
        return res.status(409).json({
          error: 'El horario seleccionado ya no está disponible'
        });
      }

      // Create appointment
      const { data: appointment, error } = await supabase
        .from('appointments')
        .insert([{
          patient_user_id,
          doctor_id: doctor.id,
          scheduled_start,
          scheduled_end: endDateTime,
          reason: reason || null,
          room_id: room_id || null,
          status_id: 1, // scheduled
          created_by_user_id: userId
        }])
        .select()
        .single();

      if (error) throw error;

      // Enviar email de confirmación al paciente
      try {
        const { data: fullAppointment } = await supabase
          .from('appointments')
          .select(`
            *,
            patient:patient_user_id (first_name, last_name, email),
            doctors!appointments_doctor_id_fkey (
              users (first_name, last_name),
              specialties (name)
            )
          `)
          .eq('id', appointment.id)
          .single();

        if (fullAppointment) {
          const patient = fullAppointment.patient;
          const doctorData = fullAppointment.doctors?.users;
          const specialty = fullAppointment.doctors?.specialties?.name;

          if (patient && doctorData) {
            await emailService.sendAppointmentConfirmation({
              patientEmail: patient.email,
              patientName: `${patient.first_name} ${patient.last_name}`,
              doctorName: `Dr(a). ${doctorData.first_name} ${doctorData.last_name}`,
              appointmentDate: scheduled_start,
              specialty: specialty || 'Consulta General'
            });
            console.log('✅ Email de confirmación enviado al paciente');

            // Crear recordatorio automático (24 horas antes)
            await createAppointmentReminder(appointment.id, scheduled_start, patient.email);
          }
        }
      } catch (emailError) {
        console.error('❌ Error enviando email de confirmación:', emailError);
        // No fallar la creación si el email falla
      }

      res.status(201).json({
        message: 'Cita agendada exitosamente',
        appointment
      });

    } catch (error) {
      console.error('Error en createAppointmentByDoctor:', error.message);
      res.status(500).json({ error: error.message });
    }
  },

  updateAppointmentStatus: async (req, res) => {
    try {
      const { id } = req.params;
      const { status, cancellation_reason, reschedule_reason } = req.body;

      // Obtener datos de la cita antes de actualizar
      const { data: oldAppointment } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_user_id (
            users (first_name, last_name, email)
          ),
          doctors (
            users (first_name, last_name),
            specialties (name)
          )
        `)
        .eq('id', id)
        .single();

      // Actualizar estado
      const { data, error } = await supabase
        .from('appointments')
        .update({ 
          status_id: status, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Enviar notificación de cancelación si status es 5 (cancelled)
      if (status === 5 && oldAppointment) {
        const patient = oldAppointment.patients?.users;
        const doctor = oldAppointment.doctors?.users;
        const specialty = oldAppointment.doctors?.specialties?.name;

        if (patient && doctor) {
          const appointmentDate = new Date(oldAppointment.scheduled_start);
          await emailService.sendAppointmentCancellation({
            patientEmail: patient.email,
            patientName: `${patient.first_name} ${patient.last_name}`,
            doctorName: `Dr(a). ${doctor.first_name} ${doctor.last_name}`,
            specialty: specialty || 'Consulta General',
            date: appointmentDate.toLocaleDateString('es-EC', { dateStyle: 'full' }),
            time: oldAppointment.scheduled_start.split('T')[1].substring(0, 5),
            cancellationReason: cancellation_reason || 'No especificado'
          });
        }

        // Cancelar recordatorio pendiente
        await supabase
          .from('reminders')
          .update({ send_status: 'cancelled' })
          .eq('appointment_id', id)
          .eq('send_status', 'pending');
      }

      res.json(data);
    } catch (error) {
      console.error('Error updating appointment:', error);
      res.status(400).json({ error: error.message });
    }
  },
  // Obtener detalle de cita (Doctor)
  getDoctorAppointmentById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          appointment_status (code, label),
          users:patient_user_id (
            first_name,
            last_name,
            email,
            phone_number
          ),
          patients!inner (
            date_of_birth,
            gender,
            address
          ),
          consultation_rooms (
            name,
            room_number,
            floor
          )
        `)
        .eq('id', id)
        .eq('doctor_id', doctor.id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      res.json(data);
    } catch (error) {
      console.error('Error fetching doctor appointment:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar cita (Doctor)
  updateAppointmentByDoctor: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { scheduled_start, scheduled_end, room_id, reason, notes, reschedule_reason } = req.body;

      const { data: doctor } = await supabase
        .from('doctors')
        .select('id, users(first_name, last_name), specialties(name)')
        .eq('user_id', userId)
        .single();

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      // Obtener datos actuales de la cita
      const { data: oldAppointment, error: checkError } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_user_id (users (first_name, last_name, email))
        `)
        .eq('id', id)
        .single();

      if (checkError || !oldAppointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      if (oldAppointment.doctor_id !== doctor.id) {
        return res.status(403).json({ 
          error: 'No tienes permiso para modificar esta cita' 
        });
      }

      const updateData = {
        updated_at: new Date().toISOString()
      };

      // Detectar si hay reprogramación
      const isReschedule = scheduled_start && scheduled_start !== oldAppointment.scheduled_start;

      if (scheduled_start) updateData.scheduled_start = scheduled_start;
      if (scheduled_end) updateData.scheduled_end = scheduled_end;
      if (room_id !== undefined) updateData.room_id = room_id;
      if (reason !== undefined) updateData.reason = reason;
      if (notes !== undefined) updateData.notes = notes;

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Si hay reprogramación, enviar notificación
      if (isReschedule && oldAppointment.patients?.users) {
        const patient = oldAppointment.patients.users;
        const doctorUser = doctor.users;
        const specialty = doctor.specialties?.name;

        const oldDate = new Date(oldAppointment.scheduled_start);
        const newDate = new Date(scheduled_start);

        await emailService.sendAppointmentReschedule({
          patientEmail: patient.email,
          patientName: `${patient.first_name} ${patient.last_name}`,
          doctorName: `Dr(a). ${doctorUser.first_name} ${doctorUser.last_name}`,
          specialty: specialty || 'Consulta General',
          oldDate: oldDate.toLocaleDateString('es-EC', { dateStyle: 'full' }),
          oldTime: oldAppointment.scheduled_start.split('T')[1].substring(0, 5),
          newDate: newDate.toLocaleDateString('es-EC', { dateStyle: 'full' }),
          newTime: scheduled_start.split('T')[1].substring(0, 5),
          rescheduleReason: reschedule_reason || 'Ajuste de agenda'
        });

        // Actualizar/crear nuevo recordatorio
        await supabase
          .from('reminders')
          .update({ send_status: 'cancelled' })
          .eq('appointment_id', id)
          .eq('send_status', 'pending');

        await createAppointmentReminder(id, scheduled_start, patient.email);
      }

      res.json({
        message: 'Cita actualizada exitosamente',
        appointment: data
      });
    } catch (error) {
      console.error('Error updating appointment by doctor:', error);
      res.status(500).json({ error: error.message });
    }
  }, // Coma necesaria aquí

markAsNoShow: async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const { data: doctor } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    const { data: appointment } = await supabase
      .from('appointments')
      .select('doctor_id')
      .eq('id', id)
      .single();

    if (!appointment || appointment.doctor_id !== doctor.id) {
      return res.status(403).json({ error: 'No tienes permiso' });
    }

    const { data, error } = await supabase
      .from('appointments')
      .update({ 
        status_id: 4, // no-show
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json({ message: 'Cita marcada como no-show', appointment: data });
  } catch (error) {
    console.error('Error marking as no-show:', error);
    res.status(500).json({ error: error.message });
  }
},

getAllAppointments: async (req, res) => {
  try {
    const { doctorId, specialtyId, status } = req.query;

    let query = supabase
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        scheduled_end,
        reason,
        status_id,
        created_at,
        updated_at,
        users:patient_user_id (
          first_name,
          last_name,
          email
        ),
        doctors!appointments_doctor_id_fkey!inner (
          id,
          users!inner (
            first_name,
            last_name
          ),
          specialties (
            id,
            name
          )
        ),
        appointment_status (
          code,
          label
        ),
        consultation_rooms (
          name,
          room_number
        )
      `)
      .order('scheduled_start', { ascending: false });

    // Filtros opcionales
    if (doctorId) {
      query = query.eq('doctor_id', doctorId);
    }

    if (specialtyId) {
      query = query.eq('doctors.specialty_id', specialtyId);
    }

    if (status) {
      // Mapear status string a status_id
      const statusMap = {
        'scheduled': 1,
        'confirmed': 2,
        'completed': 3,
        'cancelled': 5,
        'no-show': 4
      };
      query = query.eq('status_id', statusMap[status] || status);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Formatear respuesta
    const appointments = (data || []).map(apt => ({
      id: apt.id,
      scheduled_start: apt.scheduled_start,
      scheduled_end: apt.scheduled_end,
      reason: apt.reason,
      status_id: apt.status_id,
      status_code: apt.appointment_status?.code,
      status_label: apt.appointment_status?.label,
      patient_name: apt.users ? `${apt.users.first_name} ${apt.users.last_name}` : 'N/A',
      patient_email: apt.users?.email,
      doctor_id: apt.doctors?.id,
      doctor_name: apt.doctors?.users ? `${apt.doctors.users.first_name} ${apt.doctors.users.last_name}` : 'N/A',
      specialty_id: apt.doctors?.specialties?.id,
      specialty_name: apt.doctors?.specialties?.name,
      room_name: apt.consultation_rooms?.name,
      room_number: apt.consultation_rooms?.room_number,
      created_at: apt.created_at,
      updated_at: apt.updated_at
    }));

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching all appointments:', error);
    res.status(500).json({ error: error.message });
  }
},

getAppointmentByIdAdmin: async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('appointments')
      .select(`
        *,
        users:patient_user_id (
          first_name,
          last_name,
          email,
          phone_number
        ),
        doctors!appointments_doctor_id_fkey!inner (
          id,
          professional_id,
          users!inner (
            first_name,
            last_name,
            email
          ),
          specialties (
            name
          )
        ),
        appointment_status (
          code,
          label
        ),
        consultation_rooms (
          name,
          room_number,
          floor
        )
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    res.json(data);
  } catch (error) {
    console.error('Error fetching appointment by admin:', error);
    res.status(500).json({ error: error.message });
  }
},

forceDeleteAppointment: async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('appointments')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Cita eliminada permanentemente' });
  } catch (error) {
    console.error('Error deleting appointment:', error);
    res.status(500).json({ error: error.message });
  }
},

getAppointmentStats: async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = supabase
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        status_id,
        appointment_status (code, label)
      `);

    if (startDate) query = query.gte('scheduled_start', startDate);
    if (endDate) query = query.lte('scheduled_start', endDate);

    const { data: appointments, error } = await query;
    if (error) throw error;

    // Calcular estadísticas
    const stats = {
      total: appointments.length,
      byStatus: {},
      byMonth: {},
      byDayOfWeek: {}
    };

    const statusLabels = {
      1: 'Programada',
      2: 'Confirmada',
      3: 'Completada',
      4: 'No Show',
      5: 'Cancelada'
    };

    const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

    appointments.forEach(apt => {
      const date = new Date(apt.scheduled_start);
      const statusLabel = apt.appointment_status?.label || statusLabels[apt.status_id] || 'Desconocido';
      const month = monthNames[date.getMonth()];
      const dayOfWeek = dayNames[date.getDay()];

      // Por estado
      stats.byStatus[statusLabel] = (stats.byStatus[statusLabel] || 0) + 1;

      // Por mes
      stats.byMonth[month] = (stats.byMonth[month] || 0) + 1;

      // Por día de la semana
      stats.byDayOfWeek[dayOfWeek] = (stats.byDayOfWeek[dayOfWeek] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error('Error getting appointment stats:', error);
    res.status(500).json({ error: error.message });
  }
},

getDoctorStats: async (req, res) => {
  try {
    const { data: doctors, error } = await supabase
      .from('doctors')
      .select(`
        id,
        active,
        specialty_id,
        users (first_name, last_name),
        specialties (name)
      `);

    if (error) throw error;

    const stats = {
      total: doctors.length,
      active: doctors.filter(d => d.active).length,
      inactive: doctors.filter(d => !d.active).length,
      bySpecialty: {}
    };

    doctors.forEach(doctor => {
      const specialtyName = doctor.specialties?.name || 'Sin especialidad';
      if (!stats.bySpecialty[specialtyName]) {
        stats.bySpecialty[specialtyName] = { total: 0, active: 0, inactive: 0 };
      }
      stats.bySpecialty[specialtyName].total++;
      if (doctor.active) {
        stats.bySpecialty[specialtyName].active++;
      } else {
        stats.bySpecialty[specialtyName].inactive++;
      }
    });

    res.json(stats);
  } catch (error) {
    console.error('Error getting doctor stats:', error);
    res.status(500).json({ error: error.message });
  }
},

getGeneralStats: async (req, res) => {
  try {
    const [doctorsRes, specialtiesRes, appointmentsRes] = await Promise.all([
      supabase.from('doctors').select('id, active'),
      supabase.from('specialties').select('id, is_active'),
      supabase
        .from('appointments')
        .select('id, scheduled_start, status_id')
        .gte('scheduled_start', new Date().toISOString())
        .in('status_id', [1, 2])
    ]);

    const stats = {
      totalDoctors: doctorsRes.data?.length || 0,
      activeDoctors: doctorsRes.data?.filter(d => d.active).length || 0,
      totalSpecialties: specialtiesRes.data?.length || 0,
      activeSpecialties: specialtiesRes.data?.filter(s => s.is_active).length || 0,
      upcomingAppointments: appointmentsRes.data?.length || 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error getting general stats:', error);
    res.status(500).json({ error: error.message });
  }
},

getAdvancedStats: async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Obtener todas las citas con información completa
    let query = supabase
      .from('appointments')
      .select(`
        id,
        scheduled_start,
        scheduled_end,
        status_id,
        doctor_id,
        created_at,
        appointment_status (code, label),
        doctors!appointments_doctor_id_fkey (
          id,
          users (first_name, last_name),
          specialties (name)
        )
      `);

    if (startDate) query = query.gte('scheduled_start', startDate);
    if (endDate) query = query.lte('scheduled_start', endDate);

    const { data: appointments, error } = await query;
    if (error) throw error;

    // Inicializar estadísticas
    const stats = {
      totalAppointments: appointments.length,
      averageDailyAppointments: 0,
      averageAppointmentsPerDoctor: 0,
      cancellationRate: 0,
      completionRate: 0,
      noShowRate: 0,
      peakHours: {},
      doctorPerformance: {},
      specialtyPerformance: {},
      timeMetrics: {
        averageAdvanceBooking: 0, // Días promedio de anticipación
        averageDuration: 0, // Duración promedio en minutos
      },
      trends: {
        weekOverWeek: 0, // Cambio porcentual semana a semana
        monthOverMonth: 0, // Cambio porcentual mes a mes
      }
    };

    if (appointments.length === 0) {
      return res.json(stats);
    }

    // Calcular tasas de estado
    const statusCounts = {
      scheduled: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      noShow: 0
    };

    const doctorAppointments = {};
    const specialtyAppointments = {};
    const hourCounts = {};
    let totalAdvanceDays = 0;
    let totalDuration = 0;

    appointments.forEach(apt => {
      const statusCode = apt.appointment_status?.code;
      const doctorId = apt.doctor_id;
      const doctorName = apt.doctors?.users 
        ? `${apt.doctors.users.first_name} ${apt.doctors.users.last_name}`
        : 'Desconocido';
      const specialtyName = apt.doctors?.specialties?.name || 'Sin especialidad';
      
      // Contar por estado
      if (statusCode === 'scheduled') statusCounts.scheduled++;
      else if (statusCode === 'confirmed') statusCounts.confirmed++;
      else if (statusCode === 'completed') statusCounts.completed++;
      else if (statusCode === 'cancelled' || statusCode === 'canceled') statusCounts.cancelled++;
      else if (statusCode === 'no-show') statusCounts.noShow++;

      // Horas pico
      const hour = new Date(apt.scheduled_start).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;

      // Citas por doctor
      if (!doctorAppointments[doctorId]) {
        doctorAppointments[doctorId] = {
          name: doctorName,
          total: 0,
          completed: 0,
          cancelled: 0,
          noShow: 0
        };
      }
      doctorAppointments[doctorId].total++;
      if (statusCode === 'completed') doctorAppointments[doctorId].completed++;
      if (statusCode === 'cancelled' || statusCode === 'canceled') doctorAppointments[doctorId].cancelled++;
      if (statusCode === 'no-show') doctorAppointments[doctorId].noShow++;

      // Citas por especialidad
      if (!specialtyAppointments[specialtyName]) {
        specialtyAppointments[specialtyName] = {
          total: 0,
          completed: 0,
          avgDuration: 0,
          durations: []
        };
      }
      specialtyAppointments[specialtyName].total++;
      if (statusCode === 'completed') specialtyAppointments[specialtyName].completed++;

      // Duración de cita
      const start = new Date(apt.scheduled_start);
      const end = new Date(apt.scheduled_end);
      const duration = (end - start) / (1000 * 60); // minutos
      totalDuration += duration;
      specialtyAppointments[specialtyName].durations.push(duration);

      // Anticipación de reserva
      const created = new Date(apt.created_at);
      const scheduled = new Date(apt.scheduled_start);
      const advanceDays = (scheduled - created) / (1000 * 60 * 60 * 24);
      totalAdvanceDays += advanceDays;
    });

    // Calcular promedios y tasas
    const totalActive = statusCounts.scheduled + statusCounts.confirmed;
    const total = appointments.length;

    stats.cancellationRate = total > 0 ? ((statusCounts.cancelled / total) * 100).toFixed(2) : 0;
    stats.completionRate = total > 0 ? ((statusCounts.completed / total) * 100).toFixed(2) : 0;
    stats.noShowRate = total > 0 ? ((statusCounts.noShow / total) * 100).toFixed(2) : 0;

    // Promedio de citas por doctor
    const doctorCount = Object.keys(doctorAppointments).length;
    stats.averageAppointmentsPerDoctor = doctorCount > 0 
      ? (total / doctorCount).toFixed(2) 
      : 0;

    // Calcular días únicos con citas
    const uniqueDays = new Set(
      appointments.map(apt => new Date(apt.scheduled_start).toDateString())
    );
    stats.averageDailyAppointments = uniqueDays.size > 0 
      ? (total / uniqueDays.size).toFixed(2) 
      : 0;

    // Horas pico (top 3)
    const sortedHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    stats.peakHours = Object.fromEntries(
      sortedHours.map(([hour, count]) => [
        `${hour}:00 - ${parseInt(hour) + 1}:00`,
        count
      ])
    );

    // Performance por doctor (calcular tasa de eficiencia)
    stats.doctorPerformance = Object.entries(doctorAppointments).map(([id, data]) => ({
      doctorId: id,
      doctorName: data.name,
      totalAppointments: data.total,
      completedAppointments: data.completed,
      cancelledAppointments: data.cancelled,
      noShowAppointments: data.noShow,
      completionRate: data.total > 0 ? ((data.completed / data.total) * 100).toFixed(2) : 0,
      efficiencyScore: data.total > 0 
        ? (((data.completed * 2 - data.cancelled - data.noShow * 1.5) / data.total) * 50).toFixed(2)
        : 0
    })).sort((a, b) => b.efficiencyScore - a.efficiencyScore);

    // Performance por especialidad
    stats.specialtyPerformance = Object.entries(specialtyAppointments).map(([name, data]) => {
      const avgDuration = data.durations.length > 0
        ? (data.durations.reduce((a, b) => a + b, 0) / data.durations.length).toFixed(2)
        : 0;
      
      return {
        specialtyName: name,
        totalAppointments: data.total,
        completedAppointments: data.completed,
        averageDuration: parseFloat(avgDuration),
        completionRate: data.total > 0 ? ((data.completed / data.total) * 100).toFixed(2) : 0,
        demandScore: data.total // Puntuación de demanda basada en cantidad
      };
    }).sort((a, b) => b.demandScore - a.demandScore);

    // Métricas de tiempo
    stats.timeMetrics.averageAdvanceBooking = appointments.length > 0
      ? (totalAdvanceDays / appointments.length).toFixed(2)
      : 0;
    
    stats.timeMetrics.averageDuration = appointments.length > 0
      ? (totalDuration / appointments.length).toFixed(2)
      : 0;

    // Calcular tendencias (comparar con períodos anteriores)
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const periodDays = (end - start) / (1000 * 60 * 60 * 24);

      // Período anterior (misma duración)
      const prevEnd = new Date(start);
      const prevStart = new Date(start.getTime() - periodDays * 24 * 60 * 60 * 1000);

      const { data: prevAppointments } = await supabase
        .from('appointments')
        .select('id')
        .gte('scheduled_start', prevStart.toISOString())
        .lte('scheduled_start', prevEnd.toISOString());

      const currentCount = appointments.length;
      const previousCount = prevAppointments?.length || 0;

      if (previousCount > 0) {
        const change = ((currentCount - previousCount) / previousCount) * 100;
        stats.trends.periodComparison = change.toFixed(2);
      }
    }

    res.json(stats);
  } catch (error) {
    console.error('Error getting advanced stats:', error);
    res.status(500).json({ error: error.message });
  }
}
};

module.exports = appointmentController;