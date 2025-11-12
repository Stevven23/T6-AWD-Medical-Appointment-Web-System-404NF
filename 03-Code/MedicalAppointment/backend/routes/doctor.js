const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
<<<<<<< HEAD
// const authMiddleware = require('../middleware/auth'); // Descomenta si usas autenticación

// Rutas públicas (o protegidas con middleware de autenticación)

// GET /api/doctors - Obtener todos los doctores
router.get('/', doctorController.getAllDoctors);

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

// POST /api/doctors - Crear un nuevo doctor (requiere autenticación de admin)
router.post('/', 
    // authMiddleware.isAdmin, // Descomenta para proteger la ruta
    doctorController.createDoctor
);

// PUT /api/doctors/:id - Actualizar un doctor (requiere autenticación de admin)
router.put('/:id', 
    // authMiddleware.isAdmin, // Descomenta para proteger la ruta
    doctorController.updateDoctor
);

// PATCH /api/doctors/:id/status - Actualizar solo el estado de un doctor
router.patch('/:id/status', 
    // authMiddleware.isAdmin, // Descomenta para proteger la ruta
    doctorController.updateDoctorStatus
);

// DELETE /api/doctors/:id - Eliminar un doctor (requiere autenticación de admin)
router.delete('/:id', 
    // authMiddleware.isAdmin, // Descomenta para proteger la ruta
    doctorController.deleteDoctor
);

module.exports = router;
=======
const { authMiddleware } = require('../middleware/auth');

// Requiere autenticación
router.use(authMiddleware);

router.get('/specialties', doctorController.getSpecialties);
router.get('/', doctorController.getDoctors);
router.get('/:id', doctorController.getDoctorById);

module.exports = router;
>>>>>>> c3d4174d18b6f5e0ee3daef1c98cce4a82711889
