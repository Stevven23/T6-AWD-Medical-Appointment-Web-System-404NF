/**
 * Notification Routes
 * @module external-api/routes/notification.routes
 */

const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notification.controller');
const { authMiddleware, requireRole } = require('../../shared/middleware/auth.middleware');

// All notification routes require authentication
router.use(authMiddleware);

/**
 * @route POST /notifications/appointment-confirmation
 * @desc Send appointment confirmation email
 * @access Admin, Doctor
 */
router.post(
  '/appointment-confirmation',
  requireRole('admin', 'doctor'),
  notificationController.sendAppointmentConfirmation
);

/**
 * @route POST /notifications/appointment-cancellation
 * @desc Send appointment cancellation email
 * @access Admin, Doctor
 */
router.post(
  '/appointment-cancellation',
  requireRole('admin', 'doctor'),
  notificationController.sendAppointmentCancellation
);

/**
 * @route POST /notifications/prescription
 * @desc Send prescription notification email
 * @access Admin, Doctor
 */
router.post(
  '/prescription',
  requireRole('admin', 'doctor'),
  notificationController.sendPrescriptionNotification
);

/**
 * @route POST /notifications/custom
 * @desc Send custom notification email
 * @access Admin
 */
router.post(
  '/custom',
  requireRole('admin'),
  notificationController.sendCustomNotification
);

module.exports = router;
