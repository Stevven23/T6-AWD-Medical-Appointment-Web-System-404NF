// backend/routes/v1/reports.js

const express = require('express');
const router = express.Router();
const reportController = require('../../controllers/reportController');
const { authMiddleware, requireRole } = require('../../middleware/auth');

/**
 * @route   /api/v1/reports
 * @desc    Reports and analytics routes with versioning
 */

// Apply authentication to all routes
router.use(authMiddleware);

// ============================================
// DOCTOR REPORTS
// ============================================

/**
 * @route   GET /api/v1/reports/appointments
 * @desc    Get appointments report for a doctor in a date range
 * @access  Doctor, Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), status, doctorId (admin only)
 */
router.get('/appointments', 
  requireRole('doctor', 'admin'), 
  reportController.getAppointmentsReport
);

/**
 * @route   GET /api/v1/reports/modified-appointments
 * @desc    Get cancelled/rescheduled appointments report
 * @access  Doctor, Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), modificationType, doctorId (admin only)
 */
router.get('/modified-appointments', 
  requireRole('doctor', 'admin'), 
  reportController.getModifiedAppointmentsReport
);

/**
 * @route   GET /api/v1/reports/doctor-statistics
 * @desc    Get comprehensive doctor statistics
 * @access  Doctor (own stats), Admin (any doctor)
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), doctorId (admin only)
 */
router.get('/doctor-statistics', 
  requireRole('doctor', 'admin'), 
  reportController.getDoctorStatistics
);

/**
 * @route   GET /api/v1/reports/patient-history
 * @desc    Get patient consultation history report
 * @access  Doctor, Admin
 * @query   patientId (required), startDate, endDate
 */
router.get('/patient-history', 
  requireRole('doctor', 'admin'), 
  reportController.getPatientHistoryReport
);

/**
 * @route   GET /api/v1/reports/consultation-notes
 * @desc    Get consultation notes report
 * @access  Doctor, Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), patientId, doctorId (admin only)
 */
router.get('/consultation-notes', 
  requireRole('doctor', 'admin'), 
  reportController.getConsultationNotesReport
);

// ============================================
// ADMIN REPORTS
// ============================================

/**
 * @route   GET /api/v1/reports/system-statistics
 * @desc    Get system-wide statistics
 * @access  Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */
router.get('/system-statistics', 
  requireRole('admin'), 
  reportController.getSystemStatistics
);

/**
 * @route   GET /api/v1/reports/doctors-performance
 * @desc    Get performance metrics for all doctors
 * @access  Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), specialtyId, limit
 */
router.get('/doctors-performance', 
  requireRole('admin'), 
  reportController.getDoctorsPerformanceReport
);

/**
 * @route   GET /api/v1/reports/specialties-overview
 * @desc    Get overview of all specialties with metrics
 * @access  Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */
router.get('/specialties-overview', 
  requireRole('admin'), 
  reportController.getSpecialtiesOverviewReport
);

/**
 * @route   GET /api/v1/reports/revenue
 * @desc    Get revenue and financial reports
 * @access  Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), groupBy (day|week|month)
 */
router.get('/revenue', 
  requireRole('admin'), 
  reportController.getRevenueReport
);

/**
 * @route   GET /api/v1/reports/patient-demographics
 * @desc    Get patient demographics and statistics
 * @access  Admin
 */
router.get('/patient-demographics', 
  requireRole('admin'), 
  reportController.getPatientDemographicsReport
);

/**
 * @route   GET /api/v1/reports/consultation-rooms-usage
 * @desc    Get consultation rooms usage statistics
 * @access  Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */
router.get('/consultation-rooms-usage', 
  requireRole('admin'), 
  reportController.getConsultationRoomsUsageReport
);

/**
 * @route   GET /api/v1/reports/no-show-analysis
 * @desc    Get analysis of no-show appointments
 * @access  Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), doctorId, specialtyId
 */
router.get('/no-show-analysis', 
  requireRole('admin'), 
  reportController.getNoShowAnalysisReport
);

// ============================================
// EXPORT ROUTES (Multiple Formats)
// ============================================

/**
 * @route   GET /api/v1/reports/export/appointments/csv
 * @desc    Export appointments to CSV
 * @access  Doctor, Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), status, doctorId (admin only)
 */
router.get('/export/appointments/csv', 
  requireRole('doctor', 'admin'), 
  reportController.exportAppointmentsCSV
);

/**
 * @route   GET /api/v1/reports/export/appointments/excel
 * @desc    Export appointments to Excel
 * @access  Doctor, Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), status, doctorId (admin only)
 */
router.get('/export/appointments/excel', 
  requireRole('doctor', 'admin'), 
  reportController.exportAppointmentsExcel
);

/**
 * @route   GET /api/v1/reports/export/appointments/pdf
 * @desc    Export appointments to PDF
 * @access  Doctor, Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), status, doctorId (admin only)
 */
router.get('/export/appointments/pdf', 
  requireRole('doctor', 'admin'), 
  reportController.exportAppointmentsPDF
);

/**
 * @route   GET /api/v1/reports/export/statistics/csv
 * @desc    Export statistics to CSV
 * @access  Doctor, Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), reportType
 */
router.get('/export/statistics/csv', 
  requireRole('doctor', 'admin'), 
  reportController.exportStatisticsCSV
);

/**
 * @route   GET /api/v1/reports/export/system-report/pdf
 * @desc    Export comprehensive system report to PDF
 * @access  Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */
router.get('/export/system-report/pdf', 
  requireRole('admin'), 
  reportController.exportSystemReportPDF
);

/**
 * @route   GET /api/v1/reports/export/consultation-notes/pdf
 * @desc    Export consultation notes to PDF (batch)
 * @access  Doctor, Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), patientId, doctorId (admin only)
 */
router.get('/export/consultation-notes/pdf', 
  requireRole('doctor', 'admin'), 
  reportController.exportConsultationNotesPDF
);

// ============================================
// DASHBOARD & ANALYTICS
// ============================================

/**
 * @route   GET /api/v1/reports/dashboard/doctor
 * @desc    Get doctor dashboard data (quick stats & metrics)
 * @access  Doctor
 */
router.get('/dashboard/doctor', 
  requireRole('doctor'), 
  reportController.getDoctorDashboard
);

/**
 * @route   GET /api/v1/reports/dashboard/admin
 * @desc    Get admin dashboard data (system overview)
 * @access  Admin
 */
router.get('/dashboard/admin', 
  requireRole('admin'), 
  reportController.getAdminDashboard
);

/**
 * @route   GET /api/v1/reports/analytics/trends
 * @desc    Get appointment trends and patterns
 * @access  Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), groupBy (day|week|month)
 */
router.get('/analytics/trends', 
  requireRole('admin'), 
  reportController.getAppointmentTrends
);

/**
 * @route   GET /api/v1/reports/analytics/peak-hours
 * @desc    Get peak appointment hours analysis
 * @access  Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD), specialtyId
 */
router.get('/analytics/peak-hours', 
  requireRole('admin'), 
  reportController.getPeakHoursAnalysis
);

module.exports = router;