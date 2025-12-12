const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { authMiddleware } = require('../middleware/auth');

// GET /api/doctors/prescriptions o /api/prescriptions - Obtener todas las recetas
// Esta ruta debe ser ANTES de la ruta /:id para evitar conflictos de routing
router.get('/', authMiddleware, prescriptionController.getAllPrescriptions);

// POST /api/doctors/prescriptions o /api/prescriptions - Crear una nueva receta
router.post('/', authMiddleware, prescriptionController.createPrescription);

// GET /api/doctors/prescriptions/:id o /api/prescriptions/:id - Obtener una receta por ID
// Patrón UUID para asegurar que solo UUIDs válidos sean capturados
router.get('/:id([0-9a-fA-F\\-]{36})', authMiddleware, prescriptionController.getPrescriptionById);

// PUT /api/doctors/prescriptions/:id o /api/prescriptions/:id - Actualizar una receta
router.put('/:id([0-9a-fA-F\\-]{36})', authMiddleware, prescriptionController.updatePrescription);

// DELETE /api/doctors/prescriptions/:id o /api/prescriptions/:id - Eliminar una receta
router.delete('/:id([0-9a-fA-F\\-]{36})', authMiddleware, prescriptionController.deletePrescription);

module.exports = router;
