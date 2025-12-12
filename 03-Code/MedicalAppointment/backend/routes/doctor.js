const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authMiddleware } = require('../middleware/auth');


// routes/doctor.js (Fragmento clave)
const patientManagementController = require('../controllers/patientManagementController'); 
// ...
router.get('/patients', patientManagementController.getPatientList);
router.post('/patients', patientManagementController.createPatient); 
router.get('/patients/:userId/record', patientManagementController.getPatientRecordDetails);

// ========== RUTAS ESPECÍFICAS PRIMERO (para evitar conflictos con :id) ==========

// GET /api/doctors/specialties - Obtener todas las especialidades
router.get('/specialties', doctorController.getSpecialties);

// GET /api/doctors/stats - Obtener estadísticas de doctores
router.get('/stats', doctorController.getDoctorStats);

// GET /api/doctors/filter - Filtrar doctores
router.get('/filter', doctorController.filterDoctors);

// GET /api/doctors/specialty/:specialty_id - Obtener doctores por especialidad
router.get('/specialty/:specialty_id', doctorController.getDoctorsBySpecialty);

// ========== RUTAS CRUD BÁSICAS ==========

// POST /api/doctors - Crear un nuevo doctor (ahora sin authMiddleware para pruebas)
router.post('/', doctorController.createDoctor);

// GET /api/doctors - Obtener todos los doctores
router.get('/', doctorController.getAllDoctors);

// GET /api/doctors/:id - Obtener un doctor por ID
// Restringir :id a UUID para evitar que rutas como 'prescriptions' sean interpretadas como id
router.get('/:id([0-9a-fA-F\-]{36})', doctorController.getDoctorById);

// PUT /api/doctors/:id - Actualizar un doctor (sin authMiddleware para pruebas)
router.put('/:id([0-9a-fA-F\-]{36})', doctorController.updateDoctor);

// DELETE /api/doctors/:id - Eliminar un doctor (sin authMiddleware para pruebas)
router.delete('/:id([0-9a-fA-F\-]{36})', doctorController.deleteDoctor);

// ========== RUTAS ADICIONALES CON PARÁMETROS ==========

// GET /api/doctors/:id/schedules - Obtener horarios de un doctor
router.get('/:id([0-9a-fA-F\-]{36})/schedules', doctorController.getDoctorSchedules);

// PATCH /api/doctors/:id/status - Actualizar solo el estado de un doctor
router.patch('/:id([0-9a-fA-F\-]{36})/status', doctorController.updateDoctorStatus);

module.exports = router;