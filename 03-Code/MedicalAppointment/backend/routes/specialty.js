const express = require('express');
const router = express.Router();
const specialtyController = require('../controllers/specialtyController');

// Rutas de estadísticas (debe ir antes de las rutas con :id)
router.get('/stats', specialtyController.getSpecialtyStats);

// Rutas de filtrado
router.get('/filter', specialtyController.filterSpecialties);

// Rutas de especialidades activas
router.get('/active', specialtyController.getActiveSpecialties);

// CRUD básico
router.post('/', specialtyController.createSpecialty);
router.get('/', specialtyController.getAllSpecialties);
router.get('/:id', specialtyController.getSpecialtyById);
router.put('/:id', specialtyController.updateSpecialty);
router.delete('/:id', specialtyController.deleteSpecialty);

// Rutas específicas
router.get('/:id/doctors', specialtyController.getSpecialtyWithDoctors);
router.patch('/:id/status', specialtyController.updateSpecialtyStatus);

module.exports = router;