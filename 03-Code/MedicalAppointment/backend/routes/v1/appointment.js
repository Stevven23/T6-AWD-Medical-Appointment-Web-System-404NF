// backend/routes/v1/appointments.js

const express = require('express');
const router = express.Router();
const appointmentController = require('../../controllers/appointmentController');
const { authMiddleware, requireRole } = require('../../middleware/auth');

/**
 * @route   /api/v1/appointments
 * @desc    Appointment routes with versioning
 */

// Apply authentication to all routes
router.use(authMiddleware);

// ============================================
// PUBLIC ROUTES (authenticated users)
// ============================================

/**
 * @route   GET /api/v1/appointments/doctors/:doctorId/available-slots
 * @desc    Get available time slots for a specific doctor
 * @access  Authenticated
 * @query   date (YYYY-MM-DD), specialtyId (optional)
 */
router.get('/doctors/:doctorId/available-slots', appointmentController.getAvailableSlots);

/**
 * @route   GET /api/v1/appointments/upcoming
 * @desc    Get upcoming appointments for the authenticated user (patient or doctor)
 * @access  Authenticated
 * @query   limit (number), days (number)
 */
router.get('/upcoming', appointmentController.getUpcomingAppointments);

// ============================================
// PATIENT ROUTES
// ============================================

/**
 * @route   POST /api/v1/appointments
 * @desc    Create a new appointment (patient booking)
 * @access  Patient
 * @body    { doctorId, specialtyId, appointmentDate, appointmentTime, consultationRoomId, reason }
 */
router.post('/', requireRole('patient'), appointmentController.createAppointment);

/**
 * @route   GET /api/v1/appointments/patient
 * @desc    Get all appointments for the authenticated patient
 * @access  Patient
 * @query   status, startDate, endDate, page, limit
 */
router.get('/patient', requireRole('patient'), appointmentController.getPatientAppointments);

/**
 * @route   GET /api/v1/appointments/patient/:id
 * @desc    Get a specific appointment by ID (patient view)
 * @access  Patient
 */
router.get('/patient/:id', requireRole('patient'), appointmentController.getAppointmentById);

/**
 * @route   PUT /api/v1/appointments/:id/reschedule
 * @desc    Reschedule an appointment
 * @access  Patient
 * @body    { newDate, newTime, reason }
 */
router.put('/:id/reschedule', requireRole('patient'), appointmentController.rescheduleAppointment);

/**
 * @route   DELETE /api/v1/appointments/:id
 * @desc    Cancel an appointment
 * @access  Patient
 * @body    { cancellationReason }
 */
router.delete('/:id', requireRole('patient'), appointmentController.cancelAppointment);

// ============================================
// DOCTOR ROUTES
// ============================================

/**
 * @route   GET /api/v1/appointments/doctor
 * @desc    Get all appointments for the authenticated doctor
 * @access  Doctor
 * @query   status, date, startDate, endDate, page, limit
 */
router.get('/doctor', requireRole('doctor'), appointmentController.getDoctorAppointments);

/**
 * @route   POST /api/v1/appointments/doctor/create
 * @desc    Create appointment on behalf of patient (doctor creates)
 * @access  Doctor
 * @body    { patientId, appointmentDate, appointmentTime, consultationRoomId, reason, specialtyId }
 */
router.post('/doctor/create', requireRole('doctor'), appointmentController.createAppointmentByDoctor);

/**
 * @route   GET /api/v1/appointments/doctor/:id
 * @desc    Get a specific appointment by ID (doctor view)
 * @access  Doctor
 */
router.get('/doctor/:id', requireRole('doctor'), appointmentController.getDoctorAppointmentById);

/**
 * @route   PATCH /api/v1/appointments/:id/status
 * @desc    Update appointment status
 * @access  Doctor
 * @body    { status: 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show' }
 */
router.patch('/:id/status', requireRole('doctor'), appointmentController.updateAppointmentStatus);

/**
 * @route   PATCH /api/v1/appointments/:id/confirm
 * @desc    Confirm an appointment
 * @access  Doctor
 * @body    { notes }
 */
router.patch('/:id/confirm', requireRole('doctor'), appointmentController.confirmAppointment);

/**
 * @route   PATCH /api/v1/appointments/:id/complete
 * @desc    Mark appointment as completed
 * @access  Doctor
 * @body    { diagnosis, treatment, notes }
 */
router.patch('/:id/complete', requireRole('doctor'), appointmentController.completeAppointment);

/**
 * @route   PATCH /api/v1/appointments/:id/no-show
 * @desc    Mark appointment as no-show
 * @access  Doctor
 * @body    { notes }
 */
router.patch('/:id/no-show', requireRole('doctor'), appointmentController.markAsNoShow);

/**
 * @route   PUT /api/v1/appointments/:id
 * @desc    Update appointment details
 * @access  Doctor
 * @body    { appointmentDate, appointmentTime, consultationRoomId, reason, notes }
 */
router.put('/:id', requireRole('doctor'), appointmentController.updateAppointment);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @route   GET /api/v1/appointments
 * @desc    Get all appointments (admin overview)
 * @access  Admin
 * @query   status, doctorId, patientId, specialtyId, startDate, endDate, page, limit
 */
router.get('/', requireRole('admin'), appointmentController.getAllAppointments);

/**
 * @route   GET /api/v1/appointments/:id
 * @desc    Get appointment by ID (admin view - full details)
 * @access  Admin
 */
router.get('/:id', requireRole('admin'), appointmentController.getAppointmentByIdAdmin);

/**
 * @route   DELETE /api/v1/appointments/:id/force
 * @desc    Force delete an appointment (admin only)
 * @access  Admin
 * @body    { reason }
 */
router.delete('/:id/force', requireRole('admin'), appointmentController.forceDeleteAppointment);

module.exports = router;