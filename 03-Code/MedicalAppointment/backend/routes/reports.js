const express = require('express');
const router = express.Router();
const cors = require('cors');
const { authMiddleware, requireRole } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

/**
 * 🔥 PRE-FLIGHT CORS
 * Permite que el navegador complete OPTIONS antes del auth
 */
router.options('/*splat', cors());

/**
 * 🔐 AUTENTICACIÓN
 * Se aplica a todos EXCEPTO OPTIONS
 */
router.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  authMiddleware(req, res, next);
});

/**
 * 📊 REPORTES (PROTEGIDOS)
 */

// GET /api/reports/appointments?startDate=...&endDate=...
router.get(
  '/appointments',
  requireRole('doctor', 'admin'),
  reportController.getAppointmentsReport
);

// GET /api/reports/weekly-activity
router.get(
  '/weekly-activity',
  requireRole('doctor', 'admin'),
  reportController.getWeeklyActivityReport
);

// GET /api/reports/modified?startDate=...&endDate=...
router.get(
  '/modified',
  requireRole('doctor', 'admin'),
  reportController.getModifiedAppointmentsReport
);

// GET /api/reports/modified-appointments?startDate=...&endDate=...
router.get(
  '/modified-appointments',
  requireRole('doctor', 'admin'),
  reportController.getModifiedAppointments
);

// GET /api/reports/statistics?startDate=...&endDate=...
router.get(
  '/statistics',
  requireRole('doctor', 'admin'),
  reportController.getDoctorStatistics
);

// GET /api/reports/system-statistics (solo admin)
router.get(
  '/system-statistics',
  requireRole('admin'),
  reportController.getSystemStatistics
);

// GET /api/reports/export/csv?startDate=...&endDate=...
router.get(
  '/export/csv',
  requireRole('doctor', 'admin'),
  reportController.exportToCSV
);

module.exports = router;
