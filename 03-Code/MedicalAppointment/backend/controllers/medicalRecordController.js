const supabase = require('../database');

const medicalRecordController = {
  // Obtener registro médico general
  getMedicalRecord: async (req, res) => {
    try {
      const patientUserId = req.user.id;

      const { data, error } = await supabase
        .from('medical_records')
        .select(`
          *,
          doctors (
            users (
              first_name,
              last_name
            )
          )
        `)
        .eq('patient_user_id', patientUserId)
        .single();

      // Si no existe, crear uno vacío
      if (error && error.code === 'PGRST116') {
        const { data: newRecord, error: createError } = await supabase
          .from('medical_records')
          .insert([{ patient_user_id: patientUserId }])
          .select()
          .single();

        if (createError) throw createError;
        return res.json(newRecord);
      }

      if (error) throw error;

      // Formatear respuesta
      const record = {
        ...data,
        doctor_first_name: data.doctors?.users?.first_name,
        doctor_last_name: data.doctors?.users?.last_name
      };

      res.json(record);

    } catch (error) {
      console.error('Error al obtener historial médico:', error);
      res.status(500).json({ error: 'Error al obtener historial médico' });
    }
  },

  // Obtener notas de consultas
  getConsultationNotes: async (req, res) => {
    try {
      const patientUserId = req.user.id;

      const { data, error } = await supabase
        .from('consultation_notes')
        .select(`
          *,
          appointments!inner (
            id,
            scheduled_start,
            scheduled_end,
            patient_user_id
          ),
          doctors (
            id,
            users (
              first_name,
              last_name
            ),
            specialties (
              name
            )
          )
        `)
        .eq('appointments.patient_user_id', patientUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Formatear respuesta
      const notes = data.map(note => ({
        id: note.id,
        notes: note.notes,
        diagnosis: note.diagnosis,
        treatment_plan: note.treatment_plan,
        prescriptions_given: note.prescriptions_given,
        follow_up_required: note.follow_up_required,
        follow_up_date: note.follow_up_date,
        created_at: note.created_at,
        updated_at: note.updated_at,
        appointment_id: note.appointments.id,
        scheduled_start: note.appointments.scheduled_start,
        scheduled_end: note.appointments.scheduled_end,
        doctor_id: note.doctors.id,
        doctor_first_name: note.doctors.users.first_name,
        doctor_last_name: note.doctors.users.last_name,
        specialty_name: note.doctors.specialties?.name
      }));

      res.json(notes);

    } catch (error) {
      console.error('Error al obtener notas de consulta:', error);
      res.status(500).json({ error: 'Error al obtener notas de consulta' });
    }
  },

  // Obtener nota de consulta específica
  getConsultationNoteByAppointment: async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const patientUserId = req.user.id;

      const { data, error } = await supabase
        .from('consultation_notes')
        .select(`
          *,
          appointments!inner (
            id,
            scheduled_start,
            scheduled_end,
            reason,
            patient_user_id
          ),
          doctors (
            id,
            professional_id,
            users (
              first_name,
              last_name,
              email
            ),
            specialties (
              name
            )
          )
        `)
        .eq('appointment_id', appointmentId)
        .eq('appointments.patient_user_id', patientUserId)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ 
          error: 'Nota de consulta no encontrada' 
        });
      }

      // Formatear respuesta
      const note = {
        id: data.id,
        notes: data.notes,
        diagnosis: data.diagnosis,
        treatment_plan: data.treatment_plan,
        prescriptions_given: data.prescriptions_given,
        follow_up_required: data.follow_up_required,
        follow_up_date: data.follow_up_date,
        created_at: data.created_at,
        updated_at: data.updated_at,
        appointment_id: data.appointments.id,
        scheduled_start: data.appointments.scheduled_start,
        scheduled_end: data.appointments.scheduled_end,
        reason: data.appointments.reason,
        doctor_id: data.doctors.id,
        doctor_professional_id: data.doctors.professional_id,
        doctor_first_name: data.doctors.users.first_name,
        doctor_last_name: data.doctors.users.last_name,
        doctor_email: data.doctors.users.email,
        specialty_name: data.doctors.specialties?.name
      };

      res.json(note);

    } catch (error) {
      console.error('Error al obtener nota de consulta:', error);
      res.status(500).json({ error: 'Error al obtener nota de consulta' });
    }
  },

  // Obtener resumen del historial
  getHistorySummary: async (req, res) => {
    try {
      const patientUserId = req.user.id;

      // Obtener resumen de citas
      const { data: appointments, error: aptError } = await supabase
        .from('appointments')
        .select('status_id')
        .eq('patient_user_id', patientUserId);

      if (aptError) throw aptError;

      const summary = {
        total_completed: appointments.filter(a => a.status_id === 4).length,
        upcoming: appointments.filter(a => a.status_id === 1 || a.status_id === 2).length,
        cancelled: appointments.filter(a => a.status_id === 5).length
      };

      // Última consulta completada
      const { data: lastConsultation } = await supabase
        .from('appointments')
        .select(`
          scheduled_start,
          doctors!appointments_doctor_id_fkey (
            users (
              first_name,
              last_name
            ),
            specialties (
              name
            )
          )
        `)
        .eq('patient_user_id', patientUserId)
        .eq('status_id', 4)
        .order('scheduled_start', { ascending: false })
        .limit(1)
        .single();

      // Próxima cita - buscar citas futuras con status confirmado o pendiente
      const now = new Date().toISOString();
      const { data: nextAppointment, error: nextError } = await supabase
        .from('appointments')
        .select(`
          scheduled_start,
          status_id,
          doctors!appointments_doctor_id_fkey (
            users (
              first_name,
              last_name
            ),
            specialties (
              name
            )
          )
        `)
        .eq('patient_user_id', patientUserId)
        .gte('scheduled_start', now)
        .in('status_id', [1, 2]) // Solo pendientes (1) y confirmadas (2)
        .order('scheduled_start', { ascending: true })
        .limit(1)
        .single();

      console.log('Próxima cita query:', { patientUserId, now, nextAppointment, nextError });

      res.json({
        summary,
        last_consultation: lastConsultation ? {
          scheduled_start: lastConsultation.scheduled_start,
          doctor_name: `${lastConsultation.doctors.users.first_name} ${lastConsultation.doctors.users.last_name}`,
          specialty: lastConsultation.doctors.specialties?.name
        } : null,
        next_appointment: nextAppointment ? {
          scheduled_start: nextAppointment.scheduled_start,
          doctor_name: `${nextAppointment.doctors.users.first_name} ${nextAppointment.doctors.users.last_name}`,
          specialty: nextAppointment.doctors.specialties?.name
        } : null
      });

    } catch (error) {
      console.error('Error al obtener resumen:', error);
      res.status(500).json({ error: 'Error al obtener resumen' });
    }
  },

  // Obtener reportes de laboratorio del paciente
  getPatientLabReports: async (req, res) => {
    try {
      const patientUserId = req.user.id;

      const { data, error } = await supabase
        .from('lab_reports')
        .select(`
          *,
          lab_results (*),
          doctors (
            users (
              first_name,
              last_name
            )
          )
        `)
        .eq('patient_user_id', patientUserId)
        .order('order_date', { ascending: false });

      if (error) throw error;

      // Procesar datos para el frontend
      const processedData = data.map(report => ({
        ...report,
        doctor_full_name: (report.doctors && report.doctors.users)
          ? `Dr. ${report.doctors.users.first_name} ${report.doctors.users.last_name}`
          : 'Doctor no asignado',
        doctors: undefined // Limpiar
      }));

      res.status(200).json(processedData);

    } catch (error) {
      console.error('Error al obtener reportes de laboratorio:', error);
      res.status(500).json({ error: 'Error al obtener reportes de laboratorio' });
    }
  }
};

module.exports = medicalRecordController;
