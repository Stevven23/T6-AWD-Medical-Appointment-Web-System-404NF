// controllers/patientManagementController.js

// Importamos el servicio que contiene toda la lógica de la base de datos (Supabase)
const patientService = require('../services/patientService'); 

// Eliminamos los datos simulados (mockPatients y nextPatientId)

// --- Funciones del Controlador (solo llaman al servicio) ---

/**
 * GET /api/doctors/patients
 * Obtiene la lista de todos los pacientes desde la base de datos para la tabla del doctor.
 */
exports.getPatientList = async (req, res) => {
    try {
        // En un entorno real, pasarías el ID del doctor logueado para filtrar
        // const doctorId = req.user.doctorId; 
        
        const patients = await patientService.getPatientsList(/* doctorId */);
        
        res.status(200).json(patients);
    } catch (error) {
        console.error('Error en getPatientList (Controller):', error);
        // Devolvemos un error genérico, el error específico es manejado en el servicio
        res.status(500).json({ error: 'Fallo al cargar la lista de pacientes.' });
    }
};

/**
 * GET /api/doctors/patients/:userId/record
 * Obtiene el historial clínico detallado de un paciente.
 */
exports.getPatientRecordDetails = async (req, res) => {
    const { userId } = req.params;
    try {
        if (!userId) {
            return res.status(400).json({ error: 'ID de paciente requerido.' });
        }
        
        const recordDetails = await patientService.getPatientRecordDetails(userId);
        
        res.status(200).json(recordDetails);
        
    } catch (error) {
        console.error(`Error en getPatientRecordDetails (Controller) para ${userId}:`, error);
        res.status(500).json({ error: 'Fallo al obtener el historial del paciente.' });
    }
};

/**
 * POST /api/doctors/patients
 * Crea un nuevo usuario y registro de paciente usando los datos del formulario del doctor.
 */
exports.createPatient = async (req, res) => {
    try {
        // El controlador pasa el cuerpo de la petición directamente al servicio
        const newPatientData = await patientService.createPatient(req.body); 
        
        res.status(201).json({
            message: 'Paciente registrado exitosamente',
            patient: newPatientData
        });

    } catch (error) {
        console.error('Error en createPatient (Controller):', error);
        // Manejo básico de errores de validación vs. servidor
        const status = error.message.includes('ya está registrado') ? 400 : 500;
        res.status(status).json({ error: error.message });
    }
};

// =========================================================
// FUNCIONES ANTERIORES CON MOCKS (Actualizadas para no usarlos)
// =========================================================

// Esta función es renombrada a getPatientList arriba.
// exports.getAllPatients ya no existe en la nueva estructura.

/**
 * GET /api/patients/:id - Obtener un paciente por ID
 * NOTA: Esta ruta debería estar disponible para ser llamada por el doctor si necesita editar.
 * Por ahora, simplemente indica que no está implementada con el servicio.
 */
exports.getPatientById = (req, res) => {
    res.status(501).json({ message: "Función getPatientById pendiente de implementación con el servicio." });
};

/**
 * PUT /api/patients/:id - Actualizar un paciente
 */
exports.updatePatient = (req, res) => {
    res.status(501).json({ message: "Función updatePatient pendiente de implementación con el servicio." });
};

/**
 * DELETE /api/patients/:id - Eliminar un paciente
 */
exports.deletePatient = (req, res) => {
    res.status(501).json({ message: "Función deletePatient pendiente de implementación con el servicio." });
};