const express = require('express');
const router = express.Router();
const specialtyController = require('../controllers/specialtyController');

// POST primero (crear)
router.post('/', specialtyController.createSpecialty);

// RUTAS ESPECÍFICAS ANTES DE GET general
router.get('/stats', specialtyController.getSpecialtyStats);
router.get('/filter', specialtyController.filterSpecialties);
router.get('/active', specialtyController.getActiveSpecialties);

// GET general (obtener todas)
router.get('/', specialtyController.getAllSpecialties);

// RUTAS CON PARÁMETRO - ÚLTIMAS
router.get('/:id/doctors', specialtyController.getSpecialtyWithDoctors);
router.get('/:id', specialtyController.getSpecialtyById);
router.put('/:id', specialtyController.updateSpecialty);
router.delete('/:id', specialtyController.deleteSpecialty);
router.patch('/:id/status', specialtyController.updateSpecialtyStatus);

module.exports = router;