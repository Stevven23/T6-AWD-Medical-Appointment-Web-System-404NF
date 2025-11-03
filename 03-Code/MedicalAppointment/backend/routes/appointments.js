const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const authMiddleware = require('../middleware/auth');

// Proteger todas las rutas con autenticación
router.use(authMiddleware);

// Rutas de citas
router.post('/', appointmentController.createAppointment);
router.get('/patient', appointmentController.getPatientAppointments);
router.get('/doctor', appointmentController.getDoctorAppointments);
router.patch('/:id/status', appointmentController.updateAppointmentStatus);

module.exports = router;