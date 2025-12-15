// backend/routes/v1/consultationNotes.js

const express = require('express');
const router = express.Router();
const consultationNoteController = require('../../controllers/consultationNoteController');
const { authMiddleware, requireRole } = require('../../middleware/auth');

/**
 * @route   /api/v1/consultation-notes
 * @desc    Consultation notes routes - Medical records for appointments
 */

// Apply authentication to all routes
router.use(authMiddleware);

// ============================================
// DOCTOR ROUTES
// ============================================

/**
 * @route   POST /api/v1/consultation-notes
 * @desc    Create a consultation note for an appointment
 * @access  Doctor
 * @body    { 
 *            appointmentId, 
 *            chiefComplaint, 
 *            historyOfPresentIllness,
 *            vitalSigns: { bloodPressure, heartRate, temperature, weight, height },
 *            physicalExamination,
 *            diagnosis,
 *            treatment,
 *            prescriptions: [{ medication, dosage, frequency, duration, instructions }],
 *            labTests: [{ testName, reason, status }],
 *            followUpInstructions,
 *            followUpDate,
 *            notes
 *          }
 */
router.post('/', requireRole('doctor'), consultationNoteController.createConsultationNote);

/**
 * @route   GET /api/v1/consultation-notes/doctor
 * @desc    Get all consultation notes created by the authenticated doctor
 * @access  Doctor
 * @query   patientId, startDate, endDate, page, limit
 */
router.get('/doctor', requireRole('doctor'), consultationNoteController.getDoctorConsultationNotes);

/**
 * @route   GET /api/v1/consultation-notes/appointment/:appointmentId
 * @desc    Get consultation note by appointment ID
 * @access  Doctor, Patient (only their own)
 */
router.get('/appointment/:appointmentId', consultationNoteController.getConsultationNoteByAppointment);

/**
 * @route   GET /api/v1/consultation-notes/patient/:patientId
 * @desc    Get all consultation notes for a specific patient
 * @access  Doctor (treating doctor), Patient (own records), Admin
 */
router.get('/patient/:patientId', consultationNoteController.getPatientConsultationNotes);

/**
 * @route   PUT /api/v1/consultation-notes/:id
 * @desc    Update a consultation note
 * @access  Doctor (only the doctor who created it)
 * @body    { Same fields as POST, all optional }
 */
router.put('/:id', requireRole('doctor'), consultationNoteController.updateConsultationNote);

/**
 * @route   PATCH /api/v1/consultation-notes/:id/addendum
 * @desc    Add an addendum to an existing consultation note
 * @access  Doctor (only the doctor who created it)
 * @body    { addendumText }
 */
router.patch('/:id/addendum', requireRole('doctor'), consultationNoteController.addAddendum);

/**
 * @route   DELETE /api/v1/consultation-notes/:id
 * @desc    Delete a consultation note (soft delete)
 * @access  Doctor (only the doctor who created it), Admin
 */
router.delete('/:id', requireRole('doctor', 'admin'), consultationNoteController.deleteConsultationNote);

// ============================================
// PATIENT ROUTES
// ============================================

/**
 * @route   GET /api/v1/consultation-notes/my-records
 * @desc    Get all consultation notes for the authenticated patient
 * @access  Patient
 * @query   startDate, endDate, doctorId, page, limit
 */
router.get('/my-records', requireRole('patient'), consultationNoteController.getMyConsultationNotes);

/**
 * @route   GET /api/v1/consultation-notes/:id/download
 * @desc    Download consultation note as PDF
 * @access  Doctor (creator), Patient (own records), Admin
 */
router.get('/:id/download', consultationNoteController.downloadConsultationNotePDF);

// ============================================
// SHARED ROUTES (Doctor & Patient)
// ============================================

/**
 * @route   GET /api/v1/consultation-notes/:id
 * @desc    Get a specific consultation note by ID
 * @access  Doctor (creator), Patient (own records), Admin
 */
router.get('/:id', consultationNoteController.getConsultationNoteById);

// ============================================
// ADMIN ROUTES
// ============================================

/**
 * @route   GET /api/v1/consultation-notes
 * @desc    Get all consultation notes (admin overview)
 * @access  Admin
 * @query   doctorId, patientId, startDate, endDate, page, limit
 */
router.get('/', requireRole('admin'), consultationNoteController.getAllConsultationNotes);

/**
 * @route   GET /api/v1/consultation-notes/statistics
 * @desc    Get consultation notes statistics
 * @access  Admin
 * @query   startDate, endDate, doctorId
 */
router.get('/statistics', requireRole('admin'), consultationNoteController.getConsultationNoteStatistics);

/**
 * @route   DELETE /api/v1/consultation-notes/:id/permanent
 * @desc    Permanently delete a consultation note
 * @access  Admin only
 */
router.delete('/:id/permanent', requireRole('admin'), consultationNoteController.permanentDeleteConsultationNote);

module.exports = router;