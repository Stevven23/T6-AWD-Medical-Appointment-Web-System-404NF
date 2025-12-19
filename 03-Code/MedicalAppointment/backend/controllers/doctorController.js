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

        // 1️⃣ Obtener doctor_id desde user_id
        const { data: doctor, error: doctorError } = await supabase
            .from('doctors')
            .select('id')
            .eq('user_id', userId)
            .single();

        if (doctorError || !doctor) {
            return res.status(404).json({ error: 'Doctor no encontrado' });
        }

        // 2️⃣ Obtener TODOS los pacientes activos del sistema
        const { data: allPatients, error: patientsError } = await supabase
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
            `)
            .order('created_at', { ascending: false });

        if (patientsError) throw patientsError;

        const formattedPatients = (allPatients || [])
            .filter(p => p.users && p.users.is_active)
            .map(p => p.users);

        // 3️⃣ Obtener citas ACTIVAS del doctor (status_id = 1)
        const { data: appointments, error: appointmentError } = await supabase
            .from('appointments')
            .select('patient_user_id, scheduled_start')
            .eq('doctor_id', doctor.id)
            .eq('status_id', 1);

        if (appointmentError) throw appointmentError;

        // 4️⃣ Mapear pacientes con cita
        const activePatientIds = new Set();
        const firstAppointmentMap = {};

        (appointments || []).forEach(a => {
            activePatientIds.add(a.patient_user_id);
            if (!firstAppointmentMap[a.patient_user_id]) {
                firstAppointmentMap[a.patient_user_id] = a.scheduled_start;
            }
        });

        // 5️⃣ Pacientes activos (tienen cita con este doctor)
        const activePatients = formattedPatients.filter(p =>
            activePatientIds.has(p.id)
        );

        // 6️⃣ Pacientes nuevos (primera cita ≤ 7 días)
        const newPatients = activePatients.filter(p => {
            const firstDate = new Date(firstAppointmentMap[p.id]);
            const diffDays = (Date.now() - firstDate) / (1000 * 60 * 60 * 24);
            return diffDays <= 7;
        });

        // 7️⃣ Orden alfabético
        const sortByName = (a, b) =>
            `${a.first_name} ${a.last_name}`.localeCompare(
                `${b.first_name} ${b.last_name}`
            );

        res.json({
            activePatients: activePatients.sort(sortByName),
            newPatients: newPatients.sort(sortByName)
        });

    } catch (error) {
        console.error('Error fetching doctor patients:', error);
        res.status(500).json({ error: error.message });
    }
    }
};

console.log('DoctorController exportado con keys:', Object.keys(doctorController));

module.exports = doctorController;
