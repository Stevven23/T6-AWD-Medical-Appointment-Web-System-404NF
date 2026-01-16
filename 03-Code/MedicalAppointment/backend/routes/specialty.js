const express = require('express');
const router = express.Router();
const specialtyController = require('../controllers/specialtyController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// ============================================
// APLICAR AUTENTICACIÓN A TODAS LAS RUTAS
// ============================================
router.use(authMiddleware);

// ============================================
// RUTAS PÚBLICAS (solo autenticadas)
// ============================================
router.get('/active', specialtyController.getActiveSpecialties);

// ============================================
// RUTAS DE ESTADÍSTICAS (Admin/Doctor)
// ============================================
router.get('/stats', requireRole('admin', 'doctor'), specialtyController.getSpecialtyStats);
router.get('/filter', requireRole('admin', 'doctor'), specialtyController.filterSpecialties);

// ============================================
// RUTAS GENERALES
// ============================================
router.get('/', specialtyController.getAllSpecialties);
router.get('/:id', specialtyController.getSpecialtyById);
router.get('/:id/doctors', specialtyController.getSpecialtyWithDoctors);
// ============================================
// RUTAS ADMINISTRATIVAS (Solo Admin)
// ============================================
router.post('/', requireRole('admin'), specialtyController.createSpecialty);
router.put('/:id', requireRole('admin'), specialtyController.updateSpecialty);
router.delete('/:id', requireRole('admin'), specialtyController.deleteSpecialty);
router.patch('/:id/status', requireRole('admin'), specialtyController.updateSpecialtyStatus);

module.exports = router;