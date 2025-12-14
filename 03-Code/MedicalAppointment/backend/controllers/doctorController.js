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
        res.json([]);
    }
};

console.log('DoctorController exportado con keys:', Object.keys(doctorController));

module.exports = doctorController;
