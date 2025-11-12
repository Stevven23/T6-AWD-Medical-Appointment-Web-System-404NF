const express = require('express');
const router = express.Router();
const medicalRecordController = require('../controllers/medicalRecordController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de paciente
router.use(authMiddleware);
router.use(requireRole('patient'));

router.get('/', medicalRecordController.getMedicalRecord);
router.get('/consultation-notes', medicalRecordController.getConsultationNotes);
router.get('/consultation-notes/:appointmentId', medicalRecordController.getConsultationNoteByAppointment);
router.get('/summary', medicalRecordController.getHistorySummary);

module.exports = router;
