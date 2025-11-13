const express = require('express');
const router = express.Router();
const specialtyController = require('../controllers/specialtyController');

// CRUD básico - Primero las rutas generales
router.post('/', specialtyController.createSpecialty);
router.get('/', specialtyController.getAllSpecialties);

// RUTAS ESPECÍFICAS - DESPUÉS (antes de :id)
router.get('/stats', specialtyController.getSpecialtyStats);
router.get('/filter', specialtyController.filterSpecialties);

// RUTAS CON PARÁMETRO - ÚLTIMAS
router.get('/:id/doctors', specialtyController.getSpecialtyWithDoctors);
router.get('/:id', specialtyController.getSpecialtyById);
router.put('/:id', specialtyController.updateSpecialty);
router.delete('/:id', specialtyController.deleteSpecialty);
router.patch('/:id/status', specialtyController.updateSpecialtyStatus);

// Rutas de especialidades activas
router.get('/active', specialtyController.getActiveSpecialties);

module.exports = router;