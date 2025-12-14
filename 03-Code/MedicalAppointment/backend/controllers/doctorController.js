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

            if (doctorError || !doctor) {
                return res.status(404).json({ error: 'Doctor no encontrado' });
            }

            const { data: schedules, error } = await supabase
                .from('doctor_schedules')
                .select('*')
                .eq('doctor_id', doctor.id)
                .order('day_of_week', { ascending: true });

            if (error) throw error;

            res.json(schedules || []);
        } catch (error) {
            console.error('Error fetching doctor schedules:', error);
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

            // Get doctor_id from user_id
            const { data: doctor, error: doctorError } = await supabase
                .from('doctors')
                .select('id')
                .eq('user_id', userId)
                .single();

            if (doctorError || !doctor) {
                return res.status(404).json({ error: 'Doctor no encontrado' });
            }

            // Get patients from appointments
            const { data: patients, error } = await supabase
                .from('appointments')
                .select(`
                    patient_user_id,
                    users:patient_user_id (
                        id,
                        first_name,
                        last_name,
                        email,
                        phone_number,
                        cedula
                    )
                `)
                .eq('doctor_id', doctor.id)
                .neq('status_id', 5) // Exclude cancelled appointments
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Remove duplicates and format
            const uniquePatients = {};
            (patients || []).forEach(apt => {
                if (apt.users && !uniquePatients[apt.patient_user_id]) {
                    uniquePatients[apt.patient_user_id] = apt.users;
                }
            });

            res.json(Object.values(uniquePatients));
        } catch (error) {
            console.error('Error fetching doctor patients:', error);
            res.status(500).json({ error: error.message });
        }
    }
};

console.log('DoctorController exportado con keys:', Object.keys(doctorController));

module.exports = doctorController;
