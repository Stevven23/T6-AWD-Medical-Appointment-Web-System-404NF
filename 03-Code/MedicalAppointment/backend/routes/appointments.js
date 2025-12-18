const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authMiddleware, requireRole } = require('../middleware/auth');

router.use(authMiddleware);

// Rutas públicas (authenticated users)
router.get('/doctors/:doctorId/available-slots', appointmentController.getAvailableSlots);
router.get('/upcoming', appointmentController.getUpcomingAppointments);

// Rutas de pacientes - CRUD completo
router.post('/', requireRole('patient'), appointmentController.createAppointment);
router.get('/patient', requireRole('patient'), appointmentController.getPatientAppointments);
router.get('/patient/:id', requireRole('patient'), appointmentController.getAppointmentById);
router.put('/:id', requireRole('patient'), appointmentController.updateAppointment);
router.patch('/:id/reschedule', requireRole('patient'), appointmentController.rescheduleAppointment);
router.delete('/:id', requireRole('patient'), appointmentController.cancelAppointment);

// Rutas de doctores - CRUD completo + acciones de negocio
router.get('/doctor', requireRole('doctor'), appointmentController.getDoctorAppointments);
router.post('/doctor/create', requireRole('doctor'), appointmentController.createAppointmentByDoctor);
router.get('/doctor/:id', requireRole('doctor'), appointmentController.getDoctorAppointmentById);
router.put('/doctor/:id', requireRole('doctor'), appointmentController.updateAppointmentByDoctor);
router.patch('/:id/status', requireRole('doctor'), appointmentController.updateAppointmentStatus);
router.post('/:id/confirm', requireRole('doctor'), appointmentController.confirmAppointment);
router.post('/:id/complete', requireRole('doctor'), appointmentController.completeAppointment);
router.post('/:id/no-show', requireRole('doctor'), appointmentController.markAsNoShow);

// Rutas admin - CRUD completo
router.get('/', requireRole('admin'), appointmentController.getAllAppointments);
router.get('/:id', requireRole('admin'), appointmentController.getAppointmentByIdAdmin);
router.delete('/:id/force', requireRole('admin'), appointmentController.forceDeleteAppointment);

module.exports = router;