const supabase = require('../database');

/**
 * Obtiene el doctor_id REAL desde la tabla doctors
 * a partir del user_id del token
 */
const getDoctorIdFromUser = async (userId) => {
    const { data: doctor, error } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', userId)
        .single();

    if (error || !doctor) {
        throw new Error('El usuario autenticado no está registrado como doctor');
    }

    return doctor.id;
};

const prescriptionController = {

    /**
     * GET /api/prescriptions
     * Obtiene todas las recetas del doctor logueado
     */
    getAllPrescriptions: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Doctor no autenticado' });
            }

            const doctorId = await getDoctorIdFromUser(userId);

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
                .eq('doctor_id', doctorId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.status(200).json(prescriptions || []);
        } catch (error) {
            console.error('Error en getAllPrescriptions:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/prescriptions/:id
     * Obtiene una receta específica por ID
     */
    getPrescriptionById: async (req, res) => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Doctor no autenticado' });
            }

            const doctorId = await getDoctorIdFromUser(userId);

            const { data: prescription, error } = await supabase
                .from('prescriptions')
                .select('*')
                .eq('id', id)
                .eq('doctor_id', doctorId)
                .single();

            if (error || !prescription) {
                return res.status(404).json({ error: 'Receta no encontrada' });
            }

            res.status(200).json(prescription);
        } catch (error) {
            console.error('Error en getPrescriptionById:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * POST /api/prescriptions
     * Crea una nueva receta médica
     */
    createPrescription: async (req, res) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ error: 'Doctor no autenticado' });
            }

            const doctorId = await getDoctorIdFromUser(userId);

            const {
                patient_user_id,
                diagnosis,
                medications,
                instructions,
                duration
            } = req.body;

            if (!patient_user_id || !diagnosis || !medications) {
                return res.status(400).json({
                    error: 'patient_user_id, diagnosis y medications son requeridos'
                });
            }

            let medsToStore;
            if (Array.isArray(medications)) {
                medsToStore = medications.join('\n');
            } else if (typeof medications === 'object') {
                medsToStore = JSON.stringify(medications);
            } else {
                medsToStore = String(medications).trim();
            }

            if (!medsToStore) {
                return res.status(400).json({ error: 'medications no puede estar vacío' });
            }

            const { data: prescription, error } = await supabase
                .from('prescriptions')
                .insert([{
                    patient_user_id,
                    doctor_id: doctorId,
                    diagnosis: diagnosis.trim(),
                    medications: medsToStore,
                    instructions: instructions?.trim() || null,
                    duration: duration?.trim() || null
                }])
                .select()
                .single();

            if (error) throw error;

            res.status(201).json({
                message: 'Receta creada exitosamente',
                prescription
            });

        } catch (error) {
            console.error('Error en createPrescription:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * PUT /api/prescriptions/:id
     * Actualiza una receta existente
     */
    updatePrescription: async (req, res) => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Doctor no autenticado' });
            }

            const doctorId = await getDoctorIdFromUser(userId);

            const { data: existing, error: fetchError } = await supabase
                .from('prescriptions')
                .select('doctor_id')
                .eq('id', id)
                .single();

            if (fetchError || !existing || existing.doctor_id !== doctorId) {
                return res.status(403).json({ error: 'No tienes permisos para esta receta' });
            }

            const updateData = {};
            const { diagnosis, medications, instructions, duration } = req.body;

            if (diagnosis) updateData.diagnosis = diagnosis.trim();
            if (instructions !== undefined) updateData.instructions = instructions?.trim() || null;
            if (duration !== undefined) updateData.duration = duration?.trim() || null;

            if (medications) {
                updateData.medications = Array.isArray(medications)
                    ? medications.join('\n')
                    : typeof medications === 'object'
                        ? JSON.stringify(medications)
                        : medications.trim();
            }

            updateData.updated_at = new Date().toISOString();

            const { data: updated, error } = await supabase
                .from('prescriptions')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            res.status(200).json({
                message: 'Receta actualizada exitosamente',
                prescription: updated
            });

        } catch (error) {
            console.error('Error en updatePrescription:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * DELETE /api/prescriptions/:id
     * Elimina una receta
     */
    deletePrescription: async (req, res) => {
        try {
            const userId = req.user?.id;
            const { id } = req.params;

            if (!userId) {
                return res.status(401).json({ error: 'Doctor no autenticado' });
            }

            const doctorId = await getDoctorIdFromUser(userId);

            const { data: existing, error: fetchError } = await supabase
                .from('prescriptions')
                .select('doctor_id')
                .eq('id', id)
                .single();

            if (fetchError || !existing || existing.doctor_id !== doctorId) {
                return res.status(403).json({ error: 'No tienes permisos para eliminar esta receta' });
            }

            const { error } = await supabase
                .from('prescriptions')
                .delete()
                .eq('id', id);

            if (error) throw error;

            res.status(200).json({ message: 'Receta eliminada exitosamente' });

        } catch (error) {
            console.error('Error en deletePrescription:', error.message);
            res.status(500).json({ error: error.message });
        }
    }
};

module.exports = prescriptionController;