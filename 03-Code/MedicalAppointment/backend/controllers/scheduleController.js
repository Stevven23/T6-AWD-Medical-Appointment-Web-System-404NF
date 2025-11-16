const supabase = require('../database');

const scheduleController = {
    getAllSchedules: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('doctor_schedules')
                .select('*')
                .order('id', { ascending: true });

            if (error) throw error;

            res.json(data);
        } catch (error) {
            console.error('Error fetching schedules:', error);
            res.status(400).json({ error: error.message });
        }
    },

    getScheduleById: async (req, res) => {
        try {
            const { id } = req.params;

            const { data, error } = await supabase
                .from('doctor_schedules')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (!data) {
                return res.status(404).json({ error: 'Horario no encontrado' });
            }

            res.json(data);
        } catch (error) {
            console.error('Error fetching schedule:', error);
            res.status(400).json({ error: error.message });
        }
    },

    createSchedule: async (req, res) => {
        try {
            const {
                name,
                start_time,
                end_time,
                days_of_week,
                hours_per_week,
                is_telemedicine
            } = req.body;

            const { data, error } = await supabase
                .from('doctor_schedules')
                .insert([{
                    doctor_id: req.body.doctor_id,
                    day_of_week: req.body.day_of_week,
                    start_time,
                    end_time,
                    is_working_day: req.body.is_working_day !== false,
                    break_start_time: req.body.break_start_time || null,
                    break_end_time: req.body.break_end_time || null
                }])
                .select()
                .single();

            if (error) throw error;

            res.status(201).json(data);
        } catch (error) {
            console.error('Error creating schedule:', error);
            res.status(400).json({ error: error.message });
        }
    },

    updateSchedule: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                name,
                start_time,
                end_time,
                days_of_week,
                hours_per_week,
                is_telemedicine
            } = req.body;

            const { data, error } = await supabase
                .from('doctor_schedules')
                .update({
                    day_of_week: req.body.day_of_week,
                    start_time,
                    end_time,
                    is_working_day: req.body.is_working_day,
                    break_start_time: req.body.break_start_time,
                    break_end_time: req.body.break_end_time
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            if (!data) {
                return res.status(404).json({ error: 'Horario no encontrado' });
            }

            res.json(data);
        } catch (error) {
            console.error('Error updating schedule:', error);
            res.status(400).json({ error: error.message });
        }
    },

    deleteSchedule: async (req, res) => {
        try {
            const { id } = req.params;

            const { data: doctorsUsingSchedule } = await supabase
                .from('doctors_schedule')
                .select('id')
                .eq('schedule_id', id);

            if (doctorsUsingSchedule && doctorsUsingSchedule.length > 0) {
                return res.status(400).json({
                    error: 'No se puede eliminar el horario porque hay doctores asignados a él'
                });
            }

            const { error } = await supabase
                .from('doctor_schedules')
                .delete()
                .eq('id', id);

            if (error) throw error;

            res.json({ message: 'Horario eliminado exitosamente' });
        } catch (error) {
            console.error('Error deleting schedule:', error);
            res.status(400).json({ error: error.message });
        }
    },

    getSchedulesByContractType: async (req, res) => {
        try {
            const { contractType } = req.params;

            let query = supabase.from('doctor_schedules').select('*');

            // Filtrar según tipo de contrato
            if (contractType === 'full-time') {
                query = query.gte('hours_per_week', 40);
            } else if (contractType === 'part-time') {
                query = query.lt('hours_per_week', 40).gt('hours_per_week', 0);
            } else if (contractType === 'telemedicine') {
                query = query.eq('is_telemedicine', true);
            }

            const { data, error } = await query.order('name', { ascending: true });

            if (error) throw error;

            res.json(data);
        } catch (error) {
            console.error('Error fetching schedules by contract type:', error);
            res.status(400).json({ error: error.message });
        }
    },

    getDoctorsBySchedule: async (req, res) => {
        try {
            const { id } = req.params;

            const { data, error } = await supabase
                .from('doctors_schedule')
                .select(`
                    *,
                    doctors (*)
                `)
                .eq('schedule_id', id);

            if (error) throw error;

            res.json(data);
        } catch (error) {
            console.error('Error fetching doctors by schedule:', error);
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = scheduleController;