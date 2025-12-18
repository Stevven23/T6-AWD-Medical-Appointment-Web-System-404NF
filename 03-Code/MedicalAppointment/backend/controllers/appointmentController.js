const supabase = require('../database');
const availabilityService = require('../services/availabilityService');

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
      const patientUserId = req.user.id;

      // Verificar que la cita existe y pertenece al paciente
      const { data: appointment, error: checkError } = await supabase
        .from('appointments')
        .select('scheduled_start, status_id')
        .eq('id', id)
        .eq('patient_user_id', patientUserId)
        .single();

      if (checkError || !appointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      // Verificar que la cita sea futura
      const appointmentDate = new Date(appointment.scheduled_start);
      const now = new Date();

      if (appointmentDate <= now) {
        return res.status(400).json({ error: 'No se puede cancelar una cita pasada' });
      }

      // Actualizar estado a cancelled (status_id = 5)
      const { error: updateError } = await supabase
        .from('appointments')
        .update({ 
          status_id: 5, // cancelled
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      res.json({ message: 'Cita cancelada exitosamente' });

    } catch (error) {
      console.error('Error al cancelar cita:', error);
      res.status(500).json({ error: 'Error al cancelar la cita' });
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
      const patientUserId = req.user.id;
      const { new_scheduled_start, duration_minutes = 30 } = req.body;

      if (!new_scheduled_start) {
        return res.status(400).json({ error: 'La nueva fecha es requerida' });
      }

      // Verificar cita existente
      const { data: appointment, error: checkError } = await supabase
        .from('appointments')
        .select('doctor_id, status_id')
        .eq('id', id)
        .eq('patient_user_id', patientUserId)
        .single();

      if (checkError || !appointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      // Verificar que esté en estado válido (scheduled o confirmed)
      if (![1, 2].includes(appointment.status_id)) {
        return res.status(400).json({ 
          error: 'Solo se pueden reagendar citas programadas o confirmadas' 
        });
      }

      // Calcular nuevo scheduled_end
      const startDate = new Date(new_scheduled_start);
      const endDate = new Date(startDate.getTime() + duration_minutes * 60000);
      const new_scheduled_end = endDate.toISOString();

      // Verificar disponibilidad
      const { data: conflicts } = await supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', appointment.doctor_id)
        .neq('id', id)
        .in('status_id', [1, 2])
        .or(`and(scheduled_start.lte.${new_scheduled_start},scheduled_end.gt.${new_scheduled_start}),and(scheduled_start.lt.${new_scheduled_end},scheduled_end.gte.${new_scheduled_end})`);

      if (conflicts && conflicts.length > 0) {
        return res.status(409).json({ 
          error: 'El nuevo horario no está disponible' 
        });
      }

      // Actualizar cita
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          scheduled_start: new_scheduled_start,
          scheduled_end: new_scheduled_end,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) throw updateError;

      res.json({
        message: 'Cita reagendada exitosamente',
        new_scheduled_start,
        new_scheduled_end
      });

    } catch (error) {
      console.error('Error al reagendar cita:', error);
      res.status(500).json({ error: 'Error al reagendar la cita' });
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
        .gte('scheduled_start', new Date().toISOString())
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
      const { status } = req.body;

      const { data, error } = await supabase
        .from('appointments')
        .update({ status_id: status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
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
      const { scheduled_start, scheduled_end, room_id, reason, notes } = req.body;

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
        .select('doctor_id')
        .eq('id', id)
        .single();

      if (checkError || !appointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      if (appointment.doctor_id !== doctor.id) {
        return res.status(403).json({ 
          error: 'No tienes permiso para modificar esta cita' 
        });
      }

      const updateData = {
        updated_at: new Date().toISOString()
      };

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
    res.status(501).json({ message: "No implementado aún" });
  },

  getAllAppointments: async (req, res) => {
    res.status(501).json({ message: "No implementado aún" });
  },

  getAppointmentByIdAdmin: async (req, res) => {
    res.status(501).json({ message: "No implementado aún" });
  },

  forceDeleteAppointment: async (req, res) => {
    res.status(501).json({ message: "No implementado aún" });
  }
};

module.exports = appointmentController;