const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener slots disponibles (cualquier usuario autenticado)
router.get('/doctors/:doctorId/available-slots', appointmentController.getAvailableSlots);

// Rutas de pacientes
router.post('/', requireRole('patient'), appointmentController.createAppointment);
router.get('/patient', requireRole('patient'), appointmentController.getPatientAppointments);
router.get('/:id', requireRole('patient'), appointmentController.getAppointmentById);
router.delete('/:id', requireRole('patient'), appointmentController.cancelAppointment);
router.put('/:id/reschedule', requireRole('patient'), appointmentController.rescheduleAppointment);

// Rutas de doctores (mantener las existentes)
router.get('/doctor', appointmentController.getDoctorAppointments);
router.patch('/:id/status', appointmentController.updateAppointmentStatus);

module.exports = router;
