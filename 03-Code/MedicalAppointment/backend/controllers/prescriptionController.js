const supabase = require('../database');
const qrService = require('../services/qrService');
const QRCode = require('qrcode');

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
     * Obtiene todas las recetas del doctor logueado con sus QR codes
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

            // Enriquecer cada receta con su información de QR
            const enrichedPrescriptions = await Promise.all(
                (prescriptions || []).map(async (prescription) => {
                    try {
                        const { data: qrRecord } = await supabase
                            .from('prescription_qr_codes')
                            .select('qr_token, verification_url, is_valid')
                            .eq('prescription_id', prescription.id)
                            .eq('is_valid', true)
                            .single();

                        return {
                            ...prescription,
                            qr_token: qrRecord?.qr_token || null,
                            qr_url: qrRecord?.verification_url || null
                        };
                    } catch (err) {
                        // Si no hay QR, solo retornar sin el
                        return {
                            ...prescription,
                            qr_token: null,
                            qr_url: null
                        };
                    }
                })
            );

            res.status(200).json(enrichedPrescriptions || []);
        } catch (error) {
            console.error('Error en getAllPrescriptions:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/prescriptions/:id
     * Obtiene una receta específica por ID con su QR
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

            console.log('📋 Buscando QR para receta:', id);

            // Obtener QR si existe
            let qrRecord = null;
            try {
                const { data } = await supabase
                    .from('prescription_qr_codes')
                    .select('qr_token, verification_url, is_valid')
                    .eq('prescription_id', id)
                    .eq('is_valid', true)
                    .single();
                qrRecord = data;
                console.log('✅ QR encontrado en BD:', qrRecord?.qr_token?.substring(0, 10));
            } catch (err) {
                console.log('⚠️ QR no encontrado en BD, se generará uno nuevo');
            }

            // Si no existe QR, generarlo
            if (!qrRecord) {
                try {
                    console.log('🔄 Generando nuevo QR...');
                    const apiUrl = process.env.API_URL || 'http://localhost:3000';
                    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
                    const prescriptionCode = `RX-${prescription.id.substring(0, 8).toUpperCase()}`;
                    const newQR = await qrService.generateQR(prescription.id, prescriptionCode, apiUrl, frontendUrl);
                    
                    console.log('✅ QR generado exitosamente');
                    return res.status(200).json({
                        ...prescription,
                        prescription_code: prescriptionCode,
                        qr_token: newQR.qrToken,
                        qr_url: newQR.qrDataUrl
                    });
                } catch (qrError) {
                    console.error('❌ Error generando QR:', qrError.message);
                    return res.status(200).json({
                        ...prescription,
                        qr_token: null,
                        qr_url: null
                    });
                }
            }

            // Si existe QR, generar la imagen
            try {
                console.log('🖼️ Regenerando imagen QR desde URL:', qrRecord.verification_url.substring(0, 50));
                const qrDataUrl = await QRCode.toDataURL(qrRecord.verification_url, {
                    errorCorrectionLevel: 'H',
                    type: 'image/png',
                    width: 300,
                    margin: 2,
                });

                console.log('✅ Imagen QR regenerada, tamaño:', qrDataUrl.length);
                return res.status(200).json({
                    ...prescription,
                    qr_token: qrRecord.qr_token,
                    qr_url: qrDataUrl
                });
            } catch (err) {
                console.error('❌ Error regenerando imagen QR:', err.message);
                return res.status(200).json({
                    ...prescription,
                    qr_token: qrRecord.qr_token || null,
                    qr_url: null
                });
            }
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

            // Generar código QR para la receta
            const apiUrl = process.env.API_URL || 'http://localhost:3000';
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
            const prescriptionCode = `RX-${prescription.id.substring(0, 8).toUpperCase()}`;
            
            let qrData = null;
            try {
                qrData = await qrService.generateQR(prescription.id, prescriptionCode, apiUrl, frontendUrl);
            } catch (qrError) {
                console.warn('QR generation failed, continuing without QR:', qrError.message);
            }

            const response = {
                message: 'Receta creada exitosamente',
                prescription: {
                    ...prescription,
                    prescription_code: prescriptionCode,
                    qr_token: qrData?.qrToken || null,
                    qr_url: qrData?.qrDataUrl || null
                }
            };

            res.status(201).json(response);

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
    },

    /**
     * GET /api/prescriptions/patient
     * Obtiene todas las recetas del paciente logueado
     */
    getPatientPrescriptions: async (req, res) => {
        try {
            const patientUserId = req.user?.id;
            if (!patientUserId) {
                return res.status(401).json({ error: 'Usuario no autenticado' });
            }

            console.log('🔍 Getting prescriptions for patient:', patientUserId);

            const { data: prescriptions, error } = await supabase
                .from('prescriptions')
                .select(`
                    id,
                    diagnosis,
                    medications,
                    instructions,
                    duration,
                    created_at,
                    updated_at,
                    doctors!inner (
                        id,
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
                .order('created_at', { ascending: false });

            console.log('📋 Prescriptions found:', prescriptions?.length || 0);
            console.log('❌ Query error:', error);

            if (error) throw error;

            // Formatear respuesta con datos del doctor
            const formattedPrescriptions = prescriptions?.map(p => ({
                ...p,
                doctor_first_name: p.doctors?.users?.first_name,
                doctor_last_name: p.doctors?.users?.last_name,
                specialty_name: p.doctors?.specialties?.name,
                doctors: undefined // Remover objeto anidado
            })) || [];

            res.status(200).json(formattedPrescriptions);
        } catch (error) {
            console.error('Error en getPatientPrescriptions:', error.message);
            res.status(500).json({ error: error.message });
        }
    },

    /**
     * GET /api/prescriptions/verify-qr/:qrToken
     * Verifica la autenticidad de un código QR de receta
     * NO requiere autenticación (endpoint público)
     */
    verifyQRCode: async (req, res) => {
        try {
            const { qrToken } = req.params;

            if (!qrToken) {
                return res.status(400).json({
                    error: 'QR token es requerido'
                });
            }

            // Verificar QR usando el servicio
            const verificationResult = await qrService.verifyQR(qrToken);

            if (!verificationResult.valid) {
                return res.status(401).json({
                    error: verificationResult.message,
                    errorCode: verificationResult.error
                });
            }

            // Retornar datos de la receta verificada
            res.status(200).json({
                valid: true,
                message: 'Receta auténtica verificada',
                data: {
                    prescription: verificationResult.prescription,
                    doctor: verificationResult.doctor
                }
            });

        } catch (error) {
            console.error('Error en verifyQRCode:', error.message);
            res.status(500).json({
                error: 'Error al verificar QR',
                message: error.message
            });
        }
    },

    /**
     * GET /api/prescriptions/qr-image/:qrToken
     * Devuelve solo la imagen PNG del QR
     * Genera la imagen bajo demanda si no está almacenada en BD
     */
    getQRImage: async (req, res) => {
        try {
            const { qrToken } = req.params;

            if (!qrToken) {
                return res.status(400).json({
                    error: 'QR token es requerido'
                });
            }

            // Obtener el record de QR de la base de datos
            const { data: qrRecord, error } = await supabase
                .from('prescription_qr_codes')
                .select('qr_image, is_valid, verification_url')
                .eq('qr_token', qrToken)
                .single();

            if (error || !qrRecord) {
                return res.status(404).json({ error: 'QR no encontrado' });
            }

            if (!qrRecord.is_valid) {
                return res.status(401).json({ error: 'QR inválido o expirado' });
            }

            let imageData = qrRecord.qr_image;

            // Si no está almacenada en BD, generar bajo demanda
            if (!imageData && qrRecord.verification_url) {
                console.log('🔄 Generando imagen QR bajo demanda para token:', qrToken);
                try {
                    imageData = await QRCode.toDataURL(qrRecord.verification_url, {
                        errorCorrectionLevel: 'H',
                        type: 'image/png',
                        width: 300,
                        margin: 2,
                    });
                } catch (err) {
                    console.error('Error generando QR bajo demanda:', err.message);
                    return res.status(500).json({ error: 'No se pudo generar imagen QR' });
                }
            }

            if (!imageData) {
                return res.status(500).json({ error: 'Imagen QR no disponible' });
            }

            // Extraer datos base64 y convertir a buffer
            const base64Data = imageData.replace(/^data:image\/png;base64,/, '');
            const imageBuffer = Buffer.from(base64Data, 'base64');

            // Enviar como imagen PNG
            res.setHeader('Content-Type', 'image/png');
            res.setHeader('Content-Length', imageBuffer.length);
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.send(imageBuffer);

        } catch (error) {
            console.error('Error en getQRImage:', error.message);
            res.status(500).json({
                error: 'Error al obtener imagen QR',
                message: error.message
            });
        }
    }
};

module.exports = prescriptionController;