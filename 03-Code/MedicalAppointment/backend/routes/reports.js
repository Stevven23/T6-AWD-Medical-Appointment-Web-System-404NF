const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/reports/appointments?startDate=...&endDate=...
router.get('/appointments', requireRole('doctor', 'admin'), reportController.getAppointmentsReport);

// GET /api/reports/weekly-activity
router.get('/weekly-activity', requireRole('doctor', 'admin'), reportController.getWeeklyActivityReport);

// GET /api/reports/modified?startDate=...&endDate=...&status=...
router.get('/modified', requireRole('doctor', 'admin'), reportController.getModifiedAppointmentsReport);

// GET /api/reports/modified-appointments?startDate=...&endDate=...
router.get('/modified-appointments', requireRole('doctor', 'admin'), reportController.getModifiedAppointments);

// GET /api/reports/statistics?startDate=...&endDate=...
router.get('/statistics', requireRole('doctor', 'admin'), reportController.getDoctorStatistics);

// GET /api/reports/system-statistics (solo admin)
router.get('/system-statistics', requireRole('admin'), reportController.getSystemStatistics);

// GET /api/reports/export/csv?startDate=...&endDate=...
router.get('/export/csv', requireRole('doctor', 'admin'), reportController.exportToCSV);

module.exports = router;
