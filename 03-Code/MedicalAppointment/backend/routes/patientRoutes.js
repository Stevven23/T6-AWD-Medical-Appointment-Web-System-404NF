// routes/patientRoutes.js
const express = require('express');
const router = express.Router();
// Importamos el controlador de gestión de pacientes
const patientController = require('../controllers/patientManagementController'); 
const { authMiddleware, requireRole } = require('../middleware/auth');

// Aplicamos autenticación y el rol (si es necesario)
router.use(authMiddleware);

// --- Rutas CRUD para que el Doctor gestione Pacientes ---

// GET /api/patients - Obtener lista de pacientes (Usamos getPatientList)
router.get('/', patientController.getPatientList); // CORREGIDO: Usar getPatientList

// POST /api/patients - Registrar un nuevo paciente (Usamos createPatient, que ya está bien)
router.post('/', patientController.createPatient);

// GET /api/patients/:id - Obtener detalles de un paciente (Usamos getPatientById)
router.get('/:id', patientController.getPatientById);

// PUT /api/patients/:id - Actualizar un paciente (Usamos updatePatient)
router.put('/:id', patientController.updatePatient);

// DELETE /api/patients/:id - Eliminar un paciente (Usamos deletePatient)
router.delete('/:id', patientController.deletePatient);

module.exports = router;