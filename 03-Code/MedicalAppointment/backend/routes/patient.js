const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de paciente
router.use(authMiddleware);
router.use(requireRole('patient'));

router.get('/profile', patientController.getProfile);
router.put('/profile', patientController.updateProfile);
router.put('/complete-profile', patientController.completeProfile);
router.post('/change-password', patientController.changePassword);

module.exports = router;
