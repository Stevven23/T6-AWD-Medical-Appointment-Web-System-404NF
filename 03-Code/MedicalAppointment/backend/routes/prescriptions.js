const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');

// GET /api/doctors/prescriptions - Obtener todas las recetas
router.get('/', prescriptionController.getAllPrescriptions);

// GET /api/doctors/prescriptions/:id - Obtener una receta por ID
router.get('/:id', prescriptionController.getPrescriptionById);

// POST /api/doctors/prescriptions - Crear una nueva receta
router.post('/', prescriptionController.createPrescription);

// PUT /api/doctors/prescriptions/:id - Actualizar una receta
router.put('/:id', prescriptionController.updatePrescription);

// DELETE /api/doctors/prescriptions/:id - Eliminar una receta
router.delete('/:id', prescriptionController.deletePrescription);

module.exports = router;
