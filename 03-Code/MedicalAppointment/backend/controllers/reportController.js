// backend/controllers/reportController.js

const reportService = require('../services/reportService');

const reportController = {

  /**
   * GET /api/reports/appointments
   * Obtiene las citas del doctor en un rango de fechas
   */
  getAppointments: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const doctorId = req.user.doctorId; // From auth middleware

      // Validate dates
      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren los parámetros startDate y endDate'
        });
      }

      // Validate date format (YYYY-MM-DD)
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
        return res.status(400).json({
          success: false,
          error: 'Formato de fecha inválido. Use YYYY-MM-DD'
        });
      }

      const appointments = await reportService.getAppointmentsByPeriod(
        doctorId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: {
          appointments,
          summary: {
            total: appointments.length,
            period: {
              start: startDate,
              end: endDate
            }
          }
        }
      });

    } catch (error) {
      console.error('Error en reportController.getAppointments:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener reporte de citas'
      });
    }
  },

  /**
   * GET /api/reports/modified-appointments
   * Obtiene las consultas modificadas (canceladas/reprogramadas)
   */
  getModifiedAppointments: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const doctorId = req.user.doctorId;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren los parámetros startDate y endDate'
        });
      }

      const modifications = await reportService.getModifiedAppointments(
        doctorId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: {
          modifications,
          summary: {
            total: modifications.length,
            cancelled: modifications.filter(m => m.type === 'cancelled').length,
            rescheduled: modifications.filter(m => m.type === 'rescheduled').length
          }
        }
      });

    } catch (error) {
      console.error('Error en reportController.getModifiedAppointments:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener consultas modificadas'
      });
    }
  },

  /**
   * GET /api/reports/statistics
   * Obtiene estadísticas del doctor
   */
  getDoctorStatistics: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const doctorId = req.user.doctorId;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren los parámetros startDate y endDate'
        });
      }

      const statistics = await reportService.getDoctorStatistics(
        doctorId,
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      console.error('Error en reportController.getDoctorStatistics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al calcular estadísticas'
      });
    }
  },

  /**
   * GET /api/reports/system-statistics
   * Obtiene estadísticas globales del sistema (solo admin)
   */
  getSystemStatistics: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      // Verify admin role
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          error: 'Acceso denegado. Solo administradores pueden ver estadísticas del sistema'
        });
      }

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren los parámetros startDate y endDate'
        });
      }

      const statistics = await reportService.getSystemStatistics(
        startDate,
        endDate
      );

      res.json({
        success: true,
        data: statistics
      });

    } catch (error) {
      console.error('Error en reportController.getSystemStatistics:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener estadísticas del sistema'
      });
    }
  },

  /**
   * GET /api/reports/export/csv
   * Exporta reporte de citas a CSV
   */
  exportToCSV: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      const doctorId = req.user.doctorId;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          error: 'Se requieren los parámetros startDate y endDate'
        });
      }

      const csvContent = await reportService.exportAppointmentsToCSV(
        doctorId,
        startDate,
        endDate
      );

      // Set headers for file download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=reporte_citas_${startDate}_${endDate}.csv`);
      res.send(csvContent);

    } catch (error) {
      console.error('Error en reportController.exportToCSV:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al exportar datos'
      });
    }
  }

};

module.exports = reportController;