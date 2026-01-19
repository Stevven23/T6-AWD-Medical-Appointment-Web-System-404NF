const QRCode = require('qrcode');
const crypto = require('crypto');
const supabase = require('../database');

/**
 * Servicio para generar y validar QR codes anti-fraude
 */
const qrService = {
    /**
     * Genera un QR único para una receta
     * El QR apunta a: https://frontend.example.com/verify-qr/{qrToken}
     * @param {number} prescriptionId - ID de la receta
     * @param {string} prescriptionCode - Código único generado para la receta
     * @param {string} apiUrl - URL base de la API (ej: https://api.example.com)
     * @param {string} frontendUrl - URL base del frontend (ej: https://app.example.com)
     * @returns {object} { qrToken, qrDataUrl }
     */
    generateQR: async (prescriptionId, prescriptionCode, apiUrl, frontendUrl = null) => {
        try {
            // Generar token único usando HMAC
            const qrToken = crypto
                .createHmac('sha256', process.env.JWT_SECRET || 'secret')
                .update(`${prescriptionId}-${prescriptionCode}-${Date.now()}`)
                .digest('hex')
                .substring(0, 32);

            // Usar frontendUrl si existe, sino construir desde apiUrl
            const baseUrl = frontendUrl || apiUrl.replace('/api', '');
            
            // URL que se escaneará - apunta a la página visual de verificación
            const verificationUrl = `${baseUrl}/verify-prescription/${qrToken}`;

            // Generar código QR en formato data URL
            const qrDataUrl = await QRCode.toDataURL(verificationUrl, {
                errorCorrectionLevel: 'H', // Nivel máximo de corrección de errores
                type: 'image/png',
                width: 300,
                margin: 2,
            });

            // Guardar el token y la imagen en la base de datos para validación posterior
            const { error } = await supabase
                .from('prescription_qr_codes')
                .insert([{
                    prescription_id: prescriptionId,
                    qr_token: qrToken,
                    qr_image: qrDataUrl,
                    verification_url: verificationUrl,
                    created_at: new Date(),
                    is_valid: true
                }]);

            if (error) throw error;

            return {
                qrToken,
                qrDataUrl,
                verificationUrl,
                qrImageUrl: `${apiUrl}/prescriptions/qr-image/${qrToken}`
            };
        } catch (error) {
            console.error('Error generating QR:', error.message);
            throw error;
        }
    },

    /**
     * Valida un QR code escaneado
     * @param {string} qrToken - Token del QR
     * @returns {object} Datos de la receta si es válido
     */
    verifyQR: async (qrToken) => {
        try {
            // Buscar el token en la base de datos
            const { data: qrRecord, error: qrError } = await supabase
                .from('prescription_qr_codes')
                .select('*')
                .eq('qr_token', qrToken)
                .eq('is_valid', true)
                .single();

            if (qrError || !qrRecord) {
                return {
                    valid: false,
                    message: 'QR inválido o expirado',
                    error: 'INVALID_QR'
                };
            }

            // Obtener datos de la receta
            const { data: prescription, error: prescError } = await supabase
                .from('prescriptions')
                .select(`
                    id,
                    diagnosis,
                    medications,
                    instructions,
                    duration,
                    created_at,
                    updated_at,
                    patient_user_id,
                    doctor_id,
                    doctors (
                        id,
                        user_id,
                        users (
                            first_name,
                            last_name,
                            email
                        )
                    ),
                    patients:patient_user_id (
                        first_name,
                        last_name,
                        email
                    )
                `)
                .eq('id', qrRecord.prescription_id)
                .single();

            if (prescError || !prescription) {
                return {
                    valid: false,
                    message: 'Receta no encontrada',
                    error: 'PRESCRIPTION_NOT_FOUND'
                };
            }

            // Registrar acceso en auditoría
            await qrService.logQRAccess(qrToken, qrRecord.prescription_id, 'verified', null);

            // Verificar que la receta no esté vencida (90 días)
            const createdDate = new Date(prescription.created_at);
            const expiryDate = new Date(createdDate.getTime() + 90 * 24 * 60 * 60 * 1000);
            const isExpired = new Date() > expiryDate;

            return {
                valid: true,
                prescription: {
                    id: prescription.id,
                    diagnosis: prescription.diagnosis,
                    medications: prescription.medications,
                    instructions: prescription.instructions,
                    duration: prescription.duration,
                    created_at: prescription.created_at,
                    updated_at: prescription.updated_at,
                    expired: isExpired,
                    expiryDate: expiryDate.toISOString()
                },
                doctor: {
                    first_name: prescription.doctors?.users?.first_name,
                    last_name: prescription.doctors?.users?.last_name,
                    email: prescription.doctors?.users?.email
                }
            };
        } catch (error) {
            console.error('Error verifying QR:', error.message);
            return {
                valid: false,
                message: 'Error al verificar QR',
                error: 'VERIFICATION_ERROR'
            };
        }
    },

    /**
     * Registra acceso a un QR en auditoría
     * @param {string} qrToken - Token del QR
     * @param {number} prescriptionId - ID de la receta
     * @param {string} action - Acción realizada
     * @param {string} ipAddress - IP del que accede
     */
    logQRAccess: async (qrToken, prescriptionId, action, ipAddress) => {
        try {
            await supabase
                .from('qr_access_logs')
                .insert([{
                    qr_token: qrToken,
                    prescription_id: prescriptionId,
                    action,
                    ip_address: ipAddress,
                    accessed_at: new Date()
                }]);
        } catch (error) {
            console.error('Error logging QR access:', error.message);
        }
    },

    /**
     * Invalida un QR (ej: cuando se anula la receta)
     */
    invalidateQR: async (prescriptionId) => {
        try {
            const { error } = await supabase
                .from('prescription_qr_codes')
                .update({ is_valid: false })
                .eq('prescription_id', prescriptionId);

            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error invalidating QR:', error.message);
            throw error;
        }
    },

    /**
     * Obtiene QR de una receta existente
     */
    getQRByPrescriptionId: async (prescriptionId) => {
        try {
            const { data, error } = await supabase
                .from('prescription_qr_codes')
                .select('*')
                .eq('prescription_id', prescriptionId)
                .eq('is_valid', true)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error getting QR:', error.message);
            return null;
        }
    }
};

module.exports = qrService;
