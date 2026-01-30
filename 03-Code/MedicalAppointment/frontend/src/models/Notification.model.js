/**
 * Notification Model
 * Handles notification and messaging operations
 * 
 * @module models/Notification
 */

import { externalApi, crudApi } from '../services/httpClient';

class NotificationModel {
  // =========================================================================
  // Email Notifications (External API)
  // =========================================================================

  /**
   * Send appointment confirmation email
   * @param {Object} data - Notification data
   * @returns {Promise<void>}
   */
  static async sendAppointmentConfirmation(data) {
    const response = await externalApi.post('/notifications/appointment-confirmation', data);
    return response.data;
  }

  /**
   * Send appointment cancellation email
   * @param {Object} data - Notification data
   * @returns {Promise<void>}
   */
  static async sendAppointmentCancellation(data) {
    const response = await externalApi.post('/notifications/appointment-cancellation', data);
    return response.data;
  }

  /**
   * Send prescription notification
   * @param {Object} data - Notification data
   * @returns {Promise<void>}
   */
  static async sendPrescription(data) {
    const response = await externalApi.post('/notifications/prescription', data);
    return response.data;
  }

  /**
   * Send custom notification
   * @param {Object} data - Notification data
   * @returns {Promise<void>}
   */
  static async sendCustom(data) {
    const response = await externalApi.post('/notifications/custom', data);
    return response.data;
  }

  // =========================================================================
  // In-App Messaging (CRUD API)
  // =========================================================================

  /**
   * Get patient messages
   * @returns {Promise<Array>}
   */
  static async getPatientMessages() {
    // TODO: Implement when messages endpoint is available
    // const response = await crudApi.get('/messages');
    // return response.data;
    return { data: [] };
  }

  /**
   * Send message reply
   * @param {string} messageId - Message ID
   * @param {Object} data - Reply data
   * @returns {Promise<Object>}
   */
  static async sendReply(messageId, data) {
    // TODO: Implement when messages endpoint is available
    // const response = await crudApi.post(`/messages/${messageId}/reply`, data);
    // return response.data;
    throw new Error('Messaging feature coming soon');
  }

  /**
   * Get doctor messages
   * @returns {Promise<Array>}
   */
  static async getDoctorMessages() {
    // TODO: Implement when messages endpoint is available
    return { data: [] };
  }
}

export default NotificationModel;
