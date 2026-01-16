const supabase = require('../database');
const bcrypt = require('bcrypt');

const doctorController = {

    getSpecialties: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('specialties')
                .select('id, name, description');

            if (error) throw error;
            res.json(data);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    getDoctorStats: async (req, res) => {
        res.json({ message: 'Stats OK (test)' });
    },

    filterDoctors: async (req, res) => {
        res.json({ message: 'Filter OK (test)' });
    },

    getAllDoctors: async (req, res) => {
        res.json([]);
    },

    getDoctorById: async (req, res) => {
        res.json({});
    },

    createDoctor: async (req, res) => {
        res.json({ message: 'Doctor creado (test)' });
    },

    updateDoctor: async (req, res) => {
        res.json({ message: 'Doctor actualizado (test)' });
    },

    deleteDoctor: async (req, res) => {
        res.json({ message: 'Doctor eliminado (test)' });
    },

    getDoctorsBySpecialty: async (req, res) => {
        try {
            const { specialty_id } = req.params;

            if (!specialty_id) {
                return res.status(400).json({ error: 'ID de especialidad requerido' });
            }

            const { data, error } = await supabase
                .from('doctors')
                .select(`
                    id,
                    professional_id,
                    specialty_id,
                    user_id,
                    bio,
                    active,
                    users!inner (
                        id,
                        first_name,
                        last_name,
                        email,
                        phone_number,
                        is_active
                    ),
                    specialties (
                        id,
                        name
                    )
                `)
                .eq('specialty_id', specialty_id)
                .eq('users.is_active', true)
                .eq('active', true);

            if (error) {
                console.error('Error fetching doctors by specialty:', error);
                return res.status(500).json({ error: 'Error al obtener doctores', details: error.message });
            }

            if (!data || data.length === 0) {
                return res.json([]);
            }

            // Formatear respuesta
            const doctors = data.map(doc => ({
                id: doc.id,
                professional_id: doc.professional_id,
                user_id: doc.user_id,
                first_name: doc.users.first_name,
                last_name: doc.users.last_name,
                email: doc.users.email,
                phone_number: doc.users.phone_number,
                specialty_id: doc.specialty_id,
                specialty_name: doc.specialties?.name || '',
                bio: doc.bio,
                active: doc.active,
                is_active: doc.users.is_active
            }));

            res.json(doctors);
        } catch (error) {
            console.error('Error in getDoctorsBySpecialty:', error);
            res.status(500).json({ error: 'Error al obtener doctores', details: error.message });
        }
    },

    updateDoctorStatus: async (req, res) => {
        res.json({ message: 'Estado actualizado (test)' });
    },

    getDoctorSchedules: async (req, res) => {
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

            console.log('getDoctorSchedules: requester userId =', userId);

            if (doctorError || !doctor) {
                console.log('getDoctorSchedules: doctor not found for userId', userId, 'error:', doctorError);
                return res.status(404).json({ error: 'Doctor no encontrado' });
            }

            console.log('getDoctorSchedules: found doctor id =', doctor.id);

            const { data: schedules, error } = await supabase
                .from('doctor_schedules')
                .select('*')
                .eq('doctor_id', doctor.id)
                .order('day_of_week', { ascending: true });

            console.log('getDoctorSchedules: query returned schedules count =', Array.isArray(schedules) ? schedules.length : schedules);

            if (error) throw error;

            res.json(schedules || []);
        } catch (error) {
            console.error('Error fetching doctor schedules:', error);
            res.status(500).json({ error: error.message });
        }
    },
    createDoctorSchedule: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) return res.status(401).json({ error: 'Doctor no autenticado' });

            const {
                doctor_id,
                day_of_week,
                start_time,
                end_time,
                break_start_time = null,
                break_end_time = null,
                is_working_day = true
            } = req.body;

            // Basic validation
            if (!doctor_id || typeof day_of_week === 'undefined' || !start_time || !end_time) {
                return res.status(400).json({ error: 'Faltan campos requeridos: doctor_id, day_of_week, start_time, end_time' });
            }

            const payload = {
                doctor_id,
                day_of_week,
                start_time,
                end_time,
                break_start_time,
                break_end_time,
                is_working_day
            };

            const { data, error } = await supabase
                .from('doctor_schedules')
                .insert([payload])
                .select();

            if (error) throw error;

            res.status(201).json({ message: 'Horario creado', schedule: data && data[0] ? data[0] : null });
        } catch (error) {
            console.error('Error creating doctor schedule:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getCurrentDoctor: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Doctor no autenticado' });
            }

            const { data: doctor, error } = await supabase
                .from('doctors')
                .select(`
                    id,
                    user_id,
                    professional_id,
                    bio,
                    active,
                    specialty_id,
                    users:user_id (
                        first_name,
                        last_name,
                        email,
                        phone_number
                    ),
                    specialties:specialty_id (
                        name
                    )
                `)
                .eq('user_id', userId)
                .single();

            if (error || !doctor) {
                return res.status(404).json({ error: 'Doctor no encontrado' });
            }

            res.json(doctor);
        } catch (error) {
            console.error('Error fetching current doctor:', error);
            res.status(500).json({ error: error.message });
        }
    },

    getDoctorPatients: async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log('[DOCTOR_PATIENTS] Starting with userId:', userId);
    
    if (!userId) {
      return res.status(401).json({ error: 'Doctor no autenticado' });
    }

    // 1️⃣ Obtener doctor_id
    console.log('[DOCTOR_PATIENTS] Fetching doctor record...');
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (doctorError) {
      console.error('[DOCTOR_PATIENTS] Error fetching doctor:', doctorError.message);
      return res.status(404).json({ error: 'Doctor no encontrado', details: doctorError.message });
    }

    if (!doctor) {
      console.error('[DOCTOR_PATIENTS] No doctor found for userId:', userId);
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    console.log('[DOCTOR_PATIENTS] Found doctor:', doctor.id);

    // 2️⃣ Obtener TODAS las citas del doctor (sin filtrar por estado)
    console.log('[DOCTOR_PATIENTS] Fetching appointments for doctor:', doctor.id);
    const { data: allAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, patient_user_id')
      .eq('doctor_id', doctor.id);

    if (appointmentsError) {
      console.error('[DOCTOR_PATIENTS] Error fetching appointments:', appointmentsError.message);
      throw appointmentsError;
    }

    console.log('[DOCTOR_PATIENTS] Found appointments:', allAppointments?.length || 0);

    // 3️⃣ Extraer pacientes únicos que ALGUNA VEZ han tenido una cita con el doctor
    const patientsWithAppointments = new Set();
    (allAppointments || []).forEach(appt => {
      if (appt.patient_user_id) {
        patientsWithAppointments.add(appt.patient_user_id);
      }
    });

    console.log('[DOCTOR_PATIENTS] Unique patients with appointments:', patientsWithAppointments.size);

    // 4️⃣ Obtener TODOS los usuarios activos
    console.log('[DOCTOR_PATIENTS] Fetching all active users...');
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone_number,
        cedula,
        is_active
      `)
      .eq('is_active', true);

    if (usersError) {
      console.error('[DOCTOR_PATIENTS] Error fetching users:', usersError.message);
      throw usersError;
    }

    console.log('[DOCTOR_PATIENTS] Found active users:', users?.length || 0);
    
    // Extraer info de usuarios
    const patientUsers = (users || []).map(u => ({
      id: u.id,
      user_id: u.id,
      first_name: u.first_name,
      last_name: u.last_name,
      email: u.email,
      phone_number: u.phone_number,
      cedula: u.cedula,
      is_active: u.is_active
    }));
    
    console.log('[DOCTOR_PATIENTS] Total patient users extracted:', patientUsers.length);

    // 5️⃣ Separar en activos (con citas) y nuevos (sin citas NUNCA)
    const activePatients = [];
    const newPatients = [];

    (patientUsers || []).forEach(patient => {
      if (patientsWithAppointments.has(patient.id)) {
        // Este paciente ya tiene citas con el doctor
        activePatients.push(patient);
      } else {
        // Este paciente NUNCA ha tenido una cita con el doctor
        newPatients.push(patient);
      }
    });

    console.log('[DOCTOR_PATIENTS] Active patients (with appointments):', activePatients.length);
    console.log('[DOCTOR_PATIENTS] New patients (no appointments):', newPatients.length);

    // 6️⃣ Responder
    console.log('[DOCTOR_PATIENTS] ✅ Success - returning patients');
    res.json({
      activePatients,
      newPatients
    });

  } catch (error) {
    console.error('[DOCTOR_PATIENTS] ❌ Catch block error:', error.message);
    console.error('[DOCTOR_PATIENTS] Error stack:', error.stack);
    res.status(500).json({ error: error.message || 'Error fetching doctor patients' });
  }
},

    getDiagnosisRoles: async (req, res) => {
      try {
        const { data: allRoles, error } = await supabase
          .from('roles')
          .select('*');

        if (error) throw error;

        res.json({
          message: 'Roles en la base de datos',
          total: allRoles.length,
          roles: allRoles
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },

    getDiagnosisPatients: async (req, res) => {
      try {
        const { data: allUsers, error } = await supabase
          .from('users')
          .select('id, first_name, last_name, email, role_id, is_active')
          .limit(100);

        if (error) throw error;

        const { data: allRoles, error: rolesError } = await supabase
          .from('roles')
          .select('id, name');

        if (rolesError) throw rolesError;

        const usersWithRoles = allUsers.map(user => {
          const role = allRoles.find(r => r.id === user.role_id);
          return {
            ...user,
            roleName: role?.name || 'UNKNOWN'
          };
        });

        res.json({
          message: 'Usuarios en la base de datos',
          total: allUsers.length,
          users: usersWithRoles
        });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },

    getDoctorReports: async (req, res) => {
      try {
        const doctorUserId = req.user.id;
        const { reportType = 'appointments', dateRange = 'week' } = req.query;

        // Get doctor ID from current user
        const { data: doctor, error: doctorError } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', doctorUserId)
          .single();

        if (doctorError || !doctor) {
          return res.status(404).json({ error: 'Doctor profile not found' });
        }

        // Calculate date range
        const now = new Date();
        let startDate = new Date();
        
        switch(dateRange) {
          case 'week':
            startDate.setDate(now.getDate() - 7);
            break;
          case 'month':
            startDate.setMonth(now.getMonth() - 1);
            break;
          case 'year':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
          default:
            startDate.setDate(now.getDate() - 7);
        }

        // Get appointments report
        const { data: appointments, error: appointmentsError } = await supabase
          .from('appointments')
          .select(`
            id,
            scheduled_start,
            scheduled_end,
            status_id,
            patient_user_id,
            users!patient_user_id (first_name, last_name)
          `)
          .eq('doctor_id', doctor.id)
          .gte('scheduled_start', startDate.toISOString())
          .lte('scheduled_start', now.toISOString());

        if (appointmentsError) {
          console.error('Error fetching appointments:', appointmentsError);
          throw appointmentsError;
        }

        // Calculate statistics
        const completed = appointments?.filter(a => a.status_id === 4) || [];
        const pending = appointments?.filter(a => [1, 2].includes(a.status_id)) || [];
        const cancelled = appointments?.filter(a => a.status_id === 3) || [];
        const uniquePatients = new Set(appointments?.map(a => a.patient_user_id) || []);

        res.json({
          total_appointments: appointments?.length || 0,
          completed_appointments: completed.length,
          pending_appointments: pending.length,
          cancelled_appointments: cancelled.length,
          patients_treated: uniquePatients.size,
          total_revenue: completed.length * 40, // Mock: $40 per appointment
          average_rating: 4.8, // Mock rating
          appointments: (appointments || []).map(a => ({
            id: a.id,
            patient: `${a.users?.first_name || 'Unknown'} ${a.users?.last_name || ''}`,
            date: new Date(a.scheduled_start).toLocaleDateString(),
            status: ['scheduled', 'confirmed', 'completed', 'no-show', 'cancelled'][a.status_id - 1] || 'unknown',
            type: 'Consulta General'
          }))
        });
      } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Error generating report', details: error.message });
      }
    }
};

console.log('DoctorController exportado con keys:', Object.keys(doctorController));

module.exports = doctorController;
