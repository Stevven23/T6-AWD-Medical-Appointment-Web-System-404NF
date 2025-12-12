const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { authMiddleware } = require('../middleware/auth');

// GET /api/doctors/prescriptions o /api/prescriptions - Obtener todas las recetas
router.get('/', authMiddleware, prescriptionController.getAllPrescriptions);

// GET /api/doctors/prescriptions/:id o /api/prescriptions/:id - Obtener una receta por ID
router.get('/:id', authMiddleware, prescriptionController.getPrescriptionById);

// POST /api/doctors/prescriptions o /api/prescriptions - Crear una nueva receta
router.post('/', authMiddleware, prescriptionController.createPrescription);

// PUT /api/doctors/prescriptions/:id o /api/prescriptions/:id - Actualizar una receta
router.put('/:id', authMiddleware, prescriptionController.updatePrescription);

// DELETE /api/doctors/prescriptions/:id o /api/prescriptions/:id - Eliminar una receta
router.delete('/:id', authMiddleware, prescriptionController.deletePrescription);

module.exports = router;
