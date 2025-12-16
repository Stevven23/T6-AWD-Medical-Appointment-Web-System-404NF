const supabase = require('../database');

const consultationNoteController = {
  // Crear nota de consulta (Doctor)
  createConsultationNote: async (req, res) => {
    try {
      const doctorUserId = req.user.id;
      const {
        appointment_id,
        chief_complaint,
        history_of_present_illness,
        vital_signs,
        physical_examination,
        diagnosis,
        treatment,
        prescriptions,
        lab_tests,
        follow_up_instructions,
        follow_up_date,
        notes
      } = req.body;

      if (!appointment_id) {
        return res.status(400).json({ 
          error: 'El ID de la cita es requerido' 
        });
      }

      // Verificar que el doctor sea el asignado a la cita
      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', doctorUserId)
        .single();

      if (doctorError || !doctor) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      const { data: appointment, error: aptError } = await supabase
        .from('appointments')
        .select('doctor_id, patient_user_id')
        .eq('id', appointment_id)
        .single();

      if (aptError || !appointment) {
        return res.status(404).json({ error: 'Cita no encontrada' });
      }

      if (appointment.doctor_id !== doctor.id) {
        return res.status(403).json({ 
          error: 'No tienes permiso para crear notas para esta cita' 
        });
      }

      // Crear nota de consulta
      const { data, error } = await supabase
        .from('consultation_notes')
        .insert([{
          appointment_id,
          doctor_id: doctor.id,
          patient_user_id: appointment.patient_user_id,
          chief_complaint,
          history_of_present_illness,
          vital_signs: vital_signs || {},
          physical_examination,
          diagnosis,
          treatment,
          prescriptions: prescriptions || [],
          lab_tests: lab_tests || [],
          follow_up_instructions,
          follow_up_date,
          notes,
          created_by_user_id: doctorUserId
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: 'Nota de consulta creada exitosamente',
        consultationNote: data
      });
    } catch (error) {
      console.error('Error creating consultation note:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener notas del doctor
  getDoctorConsultationNotes: async (req, res) => {
    try {
      const doctorUserId = req.user.id;
      const { patient_id, start_date, end_date } = req.query;

      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', doctorUserId)
        .single();

      if (doctorError || !doctor) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      let query = supabase
        .from('consultation_notes')
        .select(`
          *,
          appointments (
            scheduled_start,
            scheduled_end
          ),
          users:patient_user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('doctor_id', doctor.id)
        .order('created_at', { ascending: false });

      if (patient_id) {
        query = query.eq('patient_user_id', patient_id);
      }

      if (start_date) {
        query = query.gte('created_at', start_date);
      }

      if (end_date) {
        query = query.lte('created_at', end_date + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error('Error fetching doctor consultation notes:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener nota por ID
  getConsultationNoteById: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const { data, error } = await supabase
        .from('consultation_notes')
        .select(`
          *,
          appointments (
            scheduled_start,
            scheduled_end,
            reason
          ),
          doctors!inner (
            id,
            users!inner (
              first_name,
              last_name
            ),
            specialties (
              name
            )
          ),
          users:patient_user_id (
            first_name,
            last_name,
            email,
            phone_number
          )
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Nota de consulta no encontrada' });
      }

      // Verificar permisos
      if (userRole === 'patient' && data.patient_user_id !== userId) {
        return res.status(403).json({ 
          error: 'No tienes permiso para ver esta nota' 
        });
      }

      if (userRole === 'doctor') {
        const { data: doctor } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (doctor && data.doctor_id !== doctor.id) {
          return res.status(403).json({ 
            error: 'No tienes permiso para ver esta nota' 
          });
        }
      }

      res.json(data);
    } catch (error) {
      console.error('Error fetching consultation note:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Actualizar nota (Doctor)
  updateConsultationNote: async (req, res) => {
    try {
      const { id } = req.params;
      const doctorUserId = req.user.id;
      const updateData = req.body;

      const { data: doctor, error: doctorError } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', doctorUserId)
        .single();

      if (doctorError || !doctor) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      // Verificar que la nota pertenece al doctor
      const { data: existingNote, error: checkError } = await supabase
        .from('consultation_notes')
        .select('doctor_id')
        .eq('id', id)
        .single();

      if (checkError || !existingNote) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }

      if (existingNote.doctor_id !== doctor.id) {
        return res.status(403).json({ 
          error: 'No tienes permiso para editar esta nota' 
        });
      }

      const { data, error } = await supabase
        .from('consultation_notes')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Nota actualizada exitosamente',
        consultationNote: data
      });
    } catch (error) {
      console.error('Error updating consultation note:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Eliminar nota (soft delete)
  deleteConsultationNote: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (userRole === 'doctor') {
        const { data: doctor } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', userId)
          .single();

        const { data: note } = await supabase
          .from('consultation_notes')
          .select('doctor_id')
          .eq('id', id)
          .single();

        if (note && doctor && note.doctor_id !== doctor.id) {
          return res.status(403).json({ 
            error: 'No tienes permiso para eliminar esta nota' 
          });
        }
      }

      const { error } = await supabase
        .from('consultation_notes')
        .update({
          is_active: false,
          deleted_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      res.json({ message: 'Nota eliminada exitosamente' });
    } catch (error) {
      console.error('Error deleting consultation note:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener notas del paciente
  getPatientConsultationNotes: async (req, res) => {
    try {
      const patientUserId = req.user.id;

      const { data, error } = await supabase
        .from('consultation_notes')
        .select(`
          *,
          appointments (
            scheduled_start
          ),
          doctors!inner (
            users!inner (
              first_name,
              last_name
            ),
            specialties (
              name
            )
          )
        `)
        .eq('patient_user_id', patientUserId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error('Error fetching patient consultation notes:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener nota por cita
  getConsultationNoteByAppointment: async (req, res) => {
    try {
      const { appointmentId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const { data, error } = await supabase
        .from('consultation_notes')
        .select(`
          *,
          doctors!inner (
            users!inner (
              first_name,
              last_name
            )
          )
        `)
        .eq('appointment_id', appointmentId)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ 
            error: 'No se encontró nota para esta cita' 
          });
        }
        throw error;
      }

      // Verificar permisos
      if (userRole === 'patient' && data.patient_user_id !== userId) {
        return res.status(403).json({ 
          error: 'No tienes permiso para ver esta nota' 
        });
      }

      res.json(data);
    } catch (error) {
      console.error('Error fetching consultation note by appointment:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener todas las notas (Admin)
  getAllConsultationNotes: async (req, res) => {
    try {
      const { doctor_id, patient_id, start_date, end_date } = req.query;

      let query = supabase
        .from('consultation_notes')
        .select(`
          *,
          appointments (
            scheduled_start
          ),
          doctors!inner (
            users!inner (
              first_name,
              last_name
            )
          ),
          users:patient_user_id (
            first_name,
            last_name
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (doctor_id) {
        query = query.eq('doctor_id', doctor_id);
      }

      if (patient_id) {
        query = query.eq('patient_user_id', patient_id);
      }

      if (start_date) {
        query = query.gte('created_at', start_date);
      }

      if (end_date) {
        query = query.lte('created_at', end_date + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error('Error fetching all consultation notes:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Agregar addendum a nota existente (Doctor)
  addAddendum: async (req, res) => {
    try {
      const { id } = req.params;
      const { addendum_text } = req.body;
      const doctorUserId = req.user.id;

      if (!addendum_text || addendum_text.trim() === '') {
        return res.status(400).json({ 
          error: 'El texto del addendum es requerido' 
        });
      }

      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', doctorUserId)
        .single();

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      const { data: note, error: checkError } = await supabase
        .from('consultation_notes')
        .select('doctor_id, addendums')
        .eq('id', id)
        .single();

      if (checkError || !note) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }

      if (note.doctor_id !== doctor.id) {
        return res.status(403).json({ 
          error: 'No tienes permiso para modificar esta nota' 
        });
      }

      const addendums = note.addendums || [];
      addendums.push({
        text: addendum_text,
        created_by: doctorUserId,
        created_at: new Date().toISOString()
      });

      const { data, error } = await supabase
        .from('consultation_notes')
        .update({
          addendums,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Addendum agregado exitosamente',
        consultationNote: data
      });
    } catch (error) {
      console.error('Error adding addendum:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Descargar nota como PDF
  downloadConsultationNotePDF: async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const { data: note, error } = await supabase
        .from('consultation_notes')
        .select(`
          *,
          appointments (
            scheduled_start,
            reason
          ),
          doctors!inner (
            users!inner (
              first_name,
              last_name
            ),
            specialties (
              name
            )
          ),
          users:patient_user_id (
            first_name,
            last_name,
            email,
            phone_number
          )
        `)
        .eq('id', id)
        .single();

      if (error || !note) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }

      // Verificar permisos
      if (userRole === 'patient' && note.patient_user_id !== userId) {
        return res.status(403).json({ 
          error: 'No tienes permiso para descargar esta nota' 
        });
      }

      if (userRole === 'doctor') {
        const { data: doctor } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (doctor && note.doctor_id !== doctor.id) {
          return res.status(403).json({ 
            error: 'No tienes permiso para descargar esta nota' 
          });
        }
      }

      // Aquí iría la lógica de generación de PDF
      // Por ahora retornamos un placeholder
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=consulta_${id}.pdf`);
      res.status(501).json({ 
        message: 'PDF generation not implemented yet',
        note: note
      });
    } catch (error) {
      console.error('Error downloading PDF:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Exportar nota
  exportConsultationNote: async (req, res) => {
    try {
      const { id } = req.params;
      const { format = 'json' } = req.query;

      const { data: note, error } = await supabase
        .from('consultation_notes')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !note) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }

      if (format === 'json') {
        res.json(note);
      } else {
        res.status(400).json({ 
          error: 'Formato no soportado. Use format=json' 
        });
      }
    } catch (error) {
      console.error('Error exporting consultation note:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener estadísticas de notas (Admin)
  getConsultationNoteStatistics: async (req, res) => {
    try {
      const { start_date, end_date, doctor_id } = req.query;

      let query = supabase
        .from('consultation_notes')
        .select('id, doctor_id, created_at')
        .eq('is_active', true);

      if (start_date) {
        query = query.gte('created_at', start_date);
      }

      if (end_date) {
        query = query.lte('created_at', end_date + 'T23:59:59');
      }

      if (doctor_id) {
        query = query.eq('doctor_id', doctor_id);
      }

      const { data, error } = await query;

      if (error) throw error;

      const stats = {
        total: data.length,
        by_doctor: {},
        by_month: {}
      };

      data.forEach(note => {
        // Por doctor
        if (!stats.by_doctor[note.doctor_id]) {
          stats.by_doctor[note.doctor_id] = 0;
        }
        stats.by_doctor[note.doctor_id]++;

        // Por mes
        const month = new Date(note.created_at).toISOString().substring(0, 7);
        if (!stats.by_month[month]) {
          stats.by_month[month] = 0;
        }
        stats.by_month[month]++;
      });

      res.json(stats);
    } catch (error) {
      console.error('Error getting consultation note statistics:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener nota por ID (Paciente)
  getPatientConsultationNoteById: async (req, res) => {
    try {
      const { id } = req.params;
      const patientUserId = req.user.id;

      const { data, error } = await supabase
        .from('consultation_notes')
        .select(`
          *,
          appointments (
            scheduled_start
          ),
          doctors!inner (
            users!inner (
              first_name,
              last_name
            ),
            specialties (
              name
            )
          )
        `)
        .eq('id', id)
        .eq('patient_user_id', patientUserId)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }

      res.json(data);
    } catch (error) {
      console.error('Error fetching patient consultation note:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Obtener nota por ID (Admin)
  getConsultationNoteByIdAdmin: async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('consultation_notes')
        .select(`
          *,
          appointments (
            scheduled_start,
            reason
          ),
          doctors!inner (
            users!inner (
              first_name,
              last_name
            ),
            specialties (
              name
            )
          ),
          users:patient_user_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }

      res.json(data);
    } catch (error) {
      console.error('Error fetching consultation note (admin):', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Eliminar permanentemente (Admin)
  permanentDeleteConsultationNote: async (req, res) => {
    try {
      const { id } = req.params;

      const { data: note, error: checkError } = await supabase
        .from('consultation_notes')
        .select('id')
        .eq('id', id)
        .single();

      if (checkError || !note) {
        return res.status(404).json({ error: 'Nota no encontrada' });
      }

      const { error } = await supabase
        .from('consultation_notes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({ 
        message: 'Nota eliminada permanentemente' 
      });
    } catch (error) {
      console.error('Error permanently deleting consultation note:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = consultationNoteController;