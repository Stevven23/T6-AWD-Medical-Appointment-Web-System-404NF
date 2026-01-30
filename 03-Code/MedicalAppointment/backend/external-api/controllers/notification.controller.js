/**
 * Notification Controller
 * Handles HTTP requests for notifications
 * 
 * @module external-api/controllers/NotificationController
 */

const emailService = require('../services/email.service');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { ValidationError } = require('../../shared/errors');

class NotificationController {
  /**
   * POST /notifications/appointment-confirmation
   * Send appointment confirmation email
   */
  sendAppointmentConfirmation = asyncHandler(async (req, res) => {
    const { patientEmail, patientName, doctorName, specialty, date, time } = req.body;

    if (!patientEmail || !patientName || !doctorName || !date || !time) {
      throw new ValidationError('Faltan campos requeridos');
    }

    await emailService.sendAppointmentConfirmation({
      patientEmail,
      patientName,
      doctorName,
      specialty,
      date,
      time
    });

    return ResponseBuilder.success(res, { 
      sent: true,
      type: 'appointment_confirmation'
    }, 200, 'Email de confirmación enviado');
  });

  /**
   * POST /notifications/appointment-cancellation
   * Send appointment cancellation email
   */
  sendAppointmentCancellation = asyncHandler(async (req, res) => {
    const { patientEmail, patientName, doctorName, date, time, reason } = req.body;

    if (!patientEmail || !patientName || !date || !time) {
      throw new ValidationError('Faltan campos requeridos');
    }

    await emailService.sendAppointmentCancellation({
      patientEmail,
      patientName,
      doctorName,
      date,
      time,
      reason
    });

    return ResponseBuilder.success(res, { 
      sent: true,
      type: 'appointment_cancellation'
    }, 200, 'Email de cancelación enviado');
  });

  /**
   * POST /notifications/prescription
   * Send prescription notification email
   */
  sendPrescriptionNotification = asyncHandler(async (req, res) => {
    const { patientEmail, patientName, doctorName, medications } = req.body;

    if (!patientEmail || !patientName || !doctorName || !medications) {
      throw new ValidationError('Faltan campos requeridos');
    }

    await emailService.sendPrescriptionNotification({
      patientEmail,
      patientName,
      doctorName,
      medications
    });

    return ResponseBuilder.success(res, { 
      sent: true,
      type: 'prescription'
    }, 200, 'Email de receta enviado');
  });

  /**
   * POST /notifications/custom
   * Send custom notification email
   */
  sendCustomNotification = asyncHandler(async (req, res) => {
    const { to, subject, title, message, actionUrl, actionText } = req.body;

    if (!to || !subject || !title || !message) {
      throw new ValidationError('to, subject, title y message son requeridos');
    }

    await emailService.sendNotification({
      to,
      subject,
      title,
      message,
      actionUrl,
      actionText
    });

    return ResponseBuilder.success(res, { 
      sent: true,
      type: 'custom'
    }, 200, 'Notificación enviada');
  });
}

module.exports = new NotificationController();
