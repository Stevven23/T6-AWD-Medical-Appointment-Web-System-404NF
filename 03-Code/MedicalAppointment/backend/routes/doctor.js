const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authMiddleware } = require('../middleware/auth');

// ========== RUTAS ESPECÍFICAS PRIMERO (para evitar conflictos con :id) ==========

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
router.get('/:id', doctorController.getDoctorById);

// PUT /api/doctors/:id - Actualizar un doctor (sin authMiddleware para pruebas)
router.put('/:id', doctorController.updateDoctor);

// DELETE /api/doctors/:id - Eliminar un doctor (sin authMiddleware para pruebas)
router.delete('/:id', doctorController.deleteDoctor);

// ========== RUTAS ADICIONALES CON PARÁMETROS ==========

// GET /api/doctors/:id/schedules - Obtener horarios de un doctor
router.get('/:id/schedules', doctorController.getDoctorSchedules);

// PATCH /api/doctors/:id/status - Actualizar solo el estado de un doctor
router.patch('/:id/status', doctorController.updateDoctorStatus);

module.exports = router;