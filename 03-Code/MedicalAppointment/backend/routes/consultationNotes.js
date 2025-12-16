const express = require('express');
const router = express.Router();
const consultationNoteController = require('../../controllers/consultationNoteController');
const { authMiddleware, requireRole } = require('../../middleware/auth');

router.use(authMiddleware);

// Rutas de doctores
router.post('/', requireRole('doctor'), consultationNoteController.createConsultationNote);
router.get('/doctor', requireRole('doctor'), consultationNoteController.getDoctorConsultationNotes);
router.get('/:id', requireRole('doctor'), consultationNoteController.getConsultationNoteById);
router.put('/:id', requireRole('doctor'), consultationNoteController.updateConsultationNote);
router.delete('/:id', requireRole('doctor', 'admin'), consultationNoteController.deleteConsultationNote);

// Rutas de pacientes
router.get('/patient', requireRole('patient'), consultationNoteController.getPatientConsultationNotes);
router.get('/appointment/:appointmentId', requireRole('patient', 'doctor'), consultationNoteController.getConsultationNoteByAppointment);

// Rutas admin
router.get('/', requireRole('admin'), consultationNoteController.getAllConsultationNotes);

module.exports = router;