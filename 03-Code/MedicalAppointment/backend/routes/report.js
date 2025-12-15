// backend/routes/reports.js

const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/reports/appointments
 * @desc    Get appointments for a doctor in a date range
 * @access  Doctor, Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */
router.get('/appointments', 
  requireRole('doctor', 'admin'), 
  reportController.getAppointments
);

/**
 * @route   GET /api/reports/modified-appointments
 * @desc    Get modified appointments (cancelled/rescheduled)
 * @access  Doctor, Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */
router.get('/modified-appointments', 
  requireRole('doctor', 'admin'), 
  reportController.getModifiedAppointments
);

/**
 * @route   GET /api/reports/statistics
 * @desc    Get doctor statistics for a period
 * @access  Doctor, Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */
router.get('/statistics', 
  requireRole('doctor', 'admin'), 
  reportController.getDoctorStatistics
);

/**
 * @route   GET /api/reports/system-statistics
 * @desc    Get system-wide statistics (admin only)
 * @access  Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */
router.get('/system-statistics', 
  requireRole('admin'), 
  reportController.getSystemStatistics
);

/**
 * @route   GET /api/reports/export/csv
 * @desc    Export appointments to CSV
 * @access  Doctor, Admin
 * @query   startDate (YYYY-MM-DD), endDate (YYYY-MM-DD)
 */
router.get('/export/csv', 
  requireRole('doctor', 'admin'), 
  reportController.exportToCSV
);

module.exports = router;