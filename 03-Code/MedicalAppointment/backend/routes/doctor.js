const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { authMiddleware } = require('../middleware/auth');

// Rutas públicas sin autenticación
// GET /api/doctors - Obtener todos los doctores
router.get('/', doctorController.getAllDoctors);

// GET /api/doctors/specialties - Obtener especialidades
router.get('/specialties', doctorController.getSpecialties);

// GET /api/doctors/stats - Obtener estadísticas de doctores
router.get('/stats', doctorController.getDoctorStats);

// GET /api/doctors/specialty/:specialty - Obtener doctores por especialidad
router.get('/specialty/:specialty', doctorController.getDoctorsBySpecialty);

// GET /api/doctors/filter - Filtrar doctores
router.get('/filter', doctorController.filterDoctors);

// GET /api/doctors/:id - Obtener un doctor por ID
router.get('/:id', doctorController.getDoctorById);

// GET /api/doctors/:id/schedules - Obtener horarios de un doctor
router.get('/:id/schedules', doctorController.getDoctorSchedules);

// Rutas protegidas con autenticación
// POST /api/doctors - Crear un nuevo doctor
router.post('/', authMiddleware, doctorController.createDoctor);

// PUT /api/doctors/:id - Actualizar un doctor
router.put('/:id', authMiddleware, doctorController.updateDoctor);

// PATCH /api/doctors/:id/status - Actualizar solo el estado de un doctor
router.patch('/:id/status', authMiddleware, doctorController.updateDoctorStatus);

// DELETE /api/doctors/:id - Eliminar un doctor
router.delete('/:id', authMiddleware, doctorController.deleteDoctor);

module.exports = router;
