const supabase = require('../database');

const prescriptionController = {
    /**
     * GET /api/doctors/prescriptions
     * Obtiene todas las recetas del doctor logueado
     */
    getAllPrescriptions: async (req, res) => {
        try {
            const { data: prescriptions, error } = await supabase
                .from('prescriptions')
                .select(`
                    id,
                    patient_user_id,
                    doctor_id,
                    diagnosis,
                    medications,
                    instructions,
                    duration,
                    created_at,
                    updated_at
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.status(200).json(prescriptions || []);
        } catch (error) {
            console.error('Error en getAllPrescriptions:', error);
            res.status(500).json({ error: 'Error al obtener recetas' });
        }
    },

    /**
     * GET /api/doctors/prescriptions/:id
     * Obtiene una receta específica por ID
     */
    getPrescriptionById: async (req, res) => {
        try {
            const { id } = req.params;

            const { data: prescription, error } = await supabase
                .from('prescriptions')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!prescription) {
                return res.status(404).json({ error: 'Receta no encontrada' });
            }

            res.status(200).json(prescription);
        } catch (error) {
            console.error('Error en getPrescriptionById:', error);
            res.status(500).json({ error: 'Error al obtener la receta' });
        }
    },

    /**
     * POST /api/doctors/prescriptions
     * Crea una nueva receta
     */
    createPrescription: async (req, res) => {
        try {
            const {
                patient_user_id,
                doctor_id,
                diagnosis,
                medications,
                instructions,
                duration
            } = req.body;

            // Validar campos requeridos
            if (!patient_user_id || !diagnosis || (medications === undefined || medications === null)) {
                return res.status(400).json({
                    error: 'patient_user_id, diagnosis y medications son requeridos'
                });
            }

            // Normalizar medications: si viene como arreglo, convertir a texto JSON/plano
            let medsToStore = medications;
            if (Array.isArray(medications)) {
                // Guardar como texto con saltos de línea para compatibilidad con front-end
                medsToStore = medications.join('\n');
            } else if (typeof medications === 'object') {
                // Si es objeto, stringifyarlo
                try { medsToStore = JSON.stringify(medications); } catch (e) { medsToStore = String(medications); }
            } else {
                medsToStore = String(medications);
            }

            const { data: prescription, error } = await supabase
                .from('prescriptions')
                .insert([{
                    patient_user_id,
                    doctor_id: doctor_id || null,
                    diagnosis: String(diagnosis),
                    medications: medsToStore,
                    instructions: instructions || null,
                    duration: duration || null
                }])
                .select()
                .single();

            if (error) throw error;

            res.status(201).json({
                message: 'Receta creada exitosamente',
                prescription
            });
        } catch (error) {
            console.error('Error en createPrescription:', error);
            res.status(500).json({ error: error.message || 'Error al crear la receta' });
        }
    },

    /**
     * PUT /api/doctors/prescriptions/:id
     * Actualiza una receta existente
     */
    updatePrescription: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                diagnosis,
                medications,
                instructions,
                duration
            } = req.body;

            const { data: prescription, error } = await supabase
                .from('prescriptions')
                .update({
                    diagnosis,
                    medications,
                    instructions,
                    duration,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (!prescription) {
                return res.status(404).json({ error: 'Receta no encontrada' });
            }

            res.status(200).json({
                message: 'Receta actualizada exitosamente',
                prescription
            });
        } catch (error) {
            console.error('Error en updatePrescription:', error);
            res.status(500).json({ error: error.message || 'Error al actualizar la receta' });
        }
    },

    /**
     * DELETE /api/doctors/prescriptions/:id
     * Elimina una receta
     */
    deletePrescription: async (req, res) => {
        try {
            const { id } = req.params;

            const { data, error } = await supabase
                .from('prescriptions')
                .delete()
                .eq('id', id)
                .select();

            if (error) throw error;

            if (!data || data.length === 0) {
                return res.status(404).json({ error: 'Receta no encontrada' });
            }

            res.status(200).json({
                message: 'Receta eliminada exitosamente'
            });
        } catch (error) {
            console.error('Error en deletePrescription:', error);
            res.status(500).json({ error: error.message || 'Error al eliminar la receta' });
        }
    }
};

module.exports = prescriptionController;
