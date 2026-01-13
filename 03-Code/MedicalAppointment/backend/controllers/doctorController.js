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
        res.json([]);
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
    if (!userId) {
      return res.status(401).json({ error: 'Doctor no autenticado' });
    }

    // 1️⃣ Obtener doctor_id
    const { data: doctor, error: doctorError } = await supabase
      .from('doctors')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (doctorError || !doctor) {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }

    // 2️⃣ Obtener TODAS las citas del doctor (sin filtrar por estado)
    const { data: allAppointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select('id, patient_user_id')
      .eq('doctor_id', doctor.id);

    if (appointmentsError) throw appointmentsError;

    // 3️⃣ Extraer pacientes únicos que ALGUNA VEZ han tenido una cita con el doctor
    const patientsWithAppointments = new Set();
    (allAppointments || []).forEach(appt => {
      if (appt.patient_user_id) {
        patientsWithAppointments.add(appt.patient_user_id);
      }
    });

    console.log('📊 Doctor ID:', doctor.id);
    console.log('📋 Total citas encontradas:', allAppointments.length);
    console.log('👥 Pacientes con citas:', patientsWithAppointments.size, Array.from(patientsWithAppointments));

    // 4️⃣ Obtener TODOS los pacientes desde la tabla patients con su información de usuario
    const { data: patientRecords, error: patientRecordsError } = await supabase
      .from('patients')
      .select(`
        user_id,
        users:user_id (
          id,
          first_name,
          last_name,
          email,
          phone_number,
          cedula,
          is_active
        )
      `);

    if (patientRecordsError) throw patientRecordsError;

    console.log('👥 Total registros en tabla patients:', patientRecords.length);
    
    // Extraer usuarios de pacientes (solo activos)
    const patientUsers = (patientRecords || [])
      .filter(p => p.users && p.users.is_active)
      .map(p => p.users);
    
    console.log('📱 Total pacientes activos extraídos:', patientUsers.length);
    console.log('📋 IDs de pacientes encontrados:', patientUsers.map(p => ({ 
      id: p.id, 
      nombre: `${p.first_name} ${p.last_name}`,
      activo: p.is_active
    })));

    // 5️⃣ Separar en activos (con citas) y nuevos (sin citas NUNCA)
    const activePatients = [];
    const newPatients = [];

    (patientUsers || []).forEach(patient => {
      const patientObj = {
        id: patient.id,
        user_id: patient.id,
        first_name: patient.first_name,
        last_name: patient.last_name,
        email: patient.email,
        phone_number: patient.phone_number,
        cedula: patient.cedula,
        is_active: patient.is_active
      };

      if (patientsWithAppointments.has(patient.id)) {
        // Este paciente ya tiene citas con el doctor
        activePatients.push(patientObj);
      } else {
        // Este paciente NUNCA ha tenido una cita con el doctor
        newPatients.push(patientObj);
      }
    });

    console.log('✅ Pacientes activos (con citas):', activePatients.length);
    console.log('🆕 Pacientes nuevos (sin citas):', newPatients.length);

    // 6️⃣ Responder
    res.json({
      activePatients,
      newPatients
    });

  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({ error: error.message });
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
    }
};

console.log('DoctorController exportado con keys:', Object.keys(doctorController));

module.exports = doctorController;
