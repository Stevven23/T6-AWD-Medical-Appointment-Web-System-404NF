const supabase = require('../database');

const appointmentController = {
    // Crear una nueva cita
    createAppointment: async (req, res) => {
        try {
            const { doctor_id, date_time, description } = req.body;
            const patient_id = req.user.id; // from auth middleware

            const { data, error } = await supabase
                .from('appointments')
                .insert([
                    { 
                        doctor_id, 
                        patient_id, 
                        date_time, 
                        description,
                        status: 'pending'
                    }
                ])
                .select();

            if (error) throw error;

            res.status(201).json(data[0]);
        } catch (error) {
            console.error('Error creating appointment:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener citas de un paciente
    getPatientAppointments: async (req, res) => {
        try {
            const patient_id = req.user.id;

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    doctors (
                        name,
                        specialty
                    )
                `)
                .eq('patient_id', patient_id)
                .order('date_time', { ascending: true });

            if (error) throw error;

            res.json(data);
        } catch (error) {
            console.error('Error fetching appointments:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener citas de un doctor
    getDoctorAppointments: async (req, res) => {
        try {
            const doctor_id = req.user.id;

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    patients (
                        name,
                        email
                    )
                `)
                .eq('doctor_id', doctor_id)
                .order('date_time', { ascending: true });

            if (error) throw error;

            res.json(data);
        } catch (error) {
            console.error('Error fetching doctor appointments:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Actualizar estado de una cita
    updateAppointmentStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            const { data, error } = await supabase
                .from('appointments')
                .update({ status })
                .eq('id', id)
                .select();

            if (error) throw error;

            res.json(data[0]);
        } catch (error) {
            console.error('Error updating appointment:', error);
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = appointmentController;