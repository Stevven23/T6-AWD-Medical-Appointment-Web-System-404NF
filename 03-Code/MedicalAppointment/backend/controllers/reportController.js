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
  },

  /**
   * GET /api/reports/appointments (versión con más detalles para el frontend)
   * Alias mejorado de getAppointments con formato esperado por report.js
   */
  getAppointmentsReport: async (req, res) => {
    try {
      const { startDate, endDate, period = 'dia' } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log('getAppointmentsReport - userId:', userId, 'role:', userRole);
      console.log('Fechas:', startDate, endDate, 'Periodo:', period);

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate y endDate son requeridos' });
      }

      const supabase = require('../database');

      // Construir query base
      let query = supabase
        .from('appointments')
        .select(`
          id,
          scheduled_start,
          scheduled_end,
          status_id,
          reason,
          patient_user_id,
          doctor_id
        `)
        .gte('scheduled_start', startDate)
        .lte('scheduled_start', endDate + 'T23:59:59')
        .order('scheduled_start', { ascending: false });

      // Filtrar por rol
      if (userRole === 'doctor') {
        const { data: doctorData, error: doctorError } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (doctorError || !doctorData) {
          console.error('Error obteniendo doctor:', doctorError);
          return res.status(404).json({ error: 'Datos de doctor no encontrados' });
        }

        console.log('Doctor ID:', doctorData.id);
        query = query.eq('doctor_id', doctorData.id);
      }

      const { data: appointments, error } = await query;

      if (error) {
        console.error('Error obteniendo citas:', error);
        return res.status(500).json({ error: 'Error al obtener citas', details: error.message });
      }

      console.log('Citas encontradas:', appointments.length);

      // Obtener información de pacientes y doctores
      const patientUserIds = [...new Set(appointments.map(a => a.patient_user_id).filter(Boolean))];
      const doctorIds = [...new Set(appointments.map(a => a.doctor_id).filter(Boolean))];

      const { data: patients } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', patientUserIds);

      const { data: doctors } = await supabase
        .from('doctors')
        .select('id, user_id, specialty_id, users(first_name, last_name), specialties(name)')
        .in('id', doctorIds);

      const patientMap = {};
      patients?.forEach(p => {
        patientMap[p.id] = p;
      });

      const doctorMap = {};
      doctors?.forEach(d => {
        doctorMap[d.id] = d;
      });

      // Formatear datos
      const formattedAppointments = appointments.map(apt => {
        const patient = patientMap[apt.patient_user_id];
        const doctor = doctorMap[apt.doctor_id];

        const scheduledDate = new Date(apt.scheduled_start);
        const fecha = scheduledDate.toISOString().split('T')[0];
        const hora = scheduledDate.toTimeString().substring(0, 5);

        function getStatusName(statusId) {
          const statusMap = {
            1: 'scheduled',
            2: 'confirmed',
            3: 'completed',
            4: 'cancelled',
            5: 'rescheduled'
          };
          return statusMap[statusId] || 'unknown';
        }

        return {
          id: apt.id,
          fecha: fecha,
          hora: hora,
          paciente: patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : 'N/A',
          doctor: doctor ? `${doctor.users?.first_name || ''} ${doctor.users?.last_name || ''}`.trim() : 'N/A',
          especialidad: doctor?.specialties?.name || 'N/A',
          tipo: apt.reason || 'Consulta General',
          estado: getStatusName(apt.status_id)
        };
      });

      // Calcular estadísticas
      const stats = {
        total: formattedAppointments.length,
        confirmadas: formattedAppointments.filter(a => a.estado === 'confirmed').length,
        pendientes: formattedAppointments.filter(a => a.estado === 'scheduled').length,
        canceladas: formattedAppointments.filter(a => a.estado === 'cancelled').length,
        completadas: formattedAppointments.filter(a => a.estado === 'completed').length
      };

      // Pacientes únicos
      const uniquePatients = [...new Set(formattedAppointments.map(a => a.paciente))];

      // Tipos de consulta
      const consultaTypes = {};
      formattedAppointments.forEach(apt => {
        consultaTypes[apt.tipo] = (consultaTypes[apt.tipo] || 0) + 1;
      });

      res.json({
        appointments: formattedAppointments,
        stats,
        uniquePatients,
        consultaTypes,
        period,
        dateRange: { startDate, endDate }
      });

    } catch (error) {
      console.error('Error en getAppointmentsReport:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  /**
   * GET /api/reports/weekly-activity
   * Obtiene la actividad semanal agrupada por día
   */
  getWeeklyActivityReport: async (req, res) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;

      // Calcular inicio y fin de la semana actual
      const today = new Date();
      const dayOfWeek = today.getDay();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const supabase = require('../database');

      // Construir query
      let query = supabase
        .from('appointments')
        .select('scheduled_start, status_id, doctor_id')
        .gte('scheduled_start', startOfWeek.toISOString())
        .lte('scheduled_start', endOfWeek.toISOString());

      // Filtrar por doctor si no es admin
      if (userRole === 'doctor') {
        const { data: doctorData } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (doctorData) {
          query = query.eq('doctor_id', doctorData.id);
        }
      }

      const { data: appointments, error } = await query;

      if (error) {
        console.error('Error obteniendo actividad semanal:', error);
        return res.status(500).json({ error: 'Error al obtener actividad semanal' });
      }

      // Agrupar por día de la semana
      const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      const activityByDay = new Array(7).fill(0);

      appointments.forEach(apt => {
        const date = new Date(apt.scheduled_start);
        const dayIndex = date.getDay();
        activityByDay[dayIndex]++;
      });

      res.json({
        activityByDay,
        labels: daysOfWeek
      });

    } catch (error) {
      console.error('Error en getWeeklyActivityReport:', error);
      res.status(500).json({ error: 'Error al obtener actividad semanal' });
    }
  },

  /**
   * GET /api/reports/modified
   * Obtiene consultas modificadas (canceladas o reprogramadas)
   */
  getModifiedAppointmentsReport: async (req, res) => {
    try {
      const { startDate, endDate, status } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;

      console.log('getModifiedAppointmentsReport - status:', status);

      if (!startDate || !endDate) {
        return res.status(400).json({ error: 'startDate y endDate son requeridos' });
      }

      const supabase = require('../database');

      // Construir query
      let query = supabase
        .from('appointments')
        .select(`
          id,
          scheduled_start,
          created_at,
          status_id,
          patient_user_id,
          doctor_id,
          reason
        `)
        .gte('scheduled_start', startDate)
        .lte('scheduled_start', endDate + 'T23:59:59');

      // Filtrar por status (4=canceladas, 5=reprogramadas)
      if (status === 'canceladas') {
        query = query.eq('status_id', 4);
      } else if (status === 'reprogramadas') {
        query = query.eq('status_id', 5);
      } else {
        query = query.in('status_id', [4, 5]);
      }

      // Filtrar por doctor si no es admin
      if (userRole === 'doctor') {
        const { data: doctorData } = await supabase
          .from('doctors')
          .select('id')
          .eq('user_id', userId)
          .single();

        if (doctorData) {
          query = query.eq('doctor_id', doctorData.id);
        }
      }

      query = query.order('scheduled_start', { ascending: false });

      const { data: appointments, error } = await query;

      if (error) {
        console.error('Error obteniendo consultas modificadas:', error);
        return res.status(500).json({ error: 'Error al obtener consultas modificadas', details: error.message });
      }

      // Obtener información de pacientes
      const patientUserIds = [...new Set(appointments.map(a => a.patient_user_id).filter(Boolean))];
      const { data: patients } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', patientUserIds);

      const patientMap = {};
      patients?.forEach(p => {
        patientMap[p.id] = p;
      });

      const modifiedAppointments = appointments.map(apt => {
        const patient = patientMap[apt.patient_user_id];
        return {
          fechaOriginal: apt.created_at?.split('T')[0] || apt.scheduled_start?.split('T')[0],
          nuevaFecha: apt.scheduled_start?.split('T')[0],
          paciente: patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : 'N/A',
          motivo: apt.status_id === 4 ? 'Cancelada' : 'Reprogramada',
          razon: apt.reason || 'No especificado'
        };
      });

      res.json({
        modifiedAppointments,
        total: modifiedAppointments.length
      });

    } catch (error) {
      console.error('Error en getModifiedAppointmentsReport:', error);
      res.status(500).json({ error: 'Error al obtener consultas modificadas' });
    }
  }, 

  // Dashboard del doctor
  getDoctorDashboard: async (req, res) => {
    try {
      const userId = req.user.id;

      const { data: doctor } = await supabase
        .from('doctors')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!doctor) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      // Citas de hoy
      const { data: todayAppointments } = await supabase
        .from('appointments')
        .select('id, status_id')
        .eq('doctor_id', doctor.id)
        .gte('scheduled_start', today)
        .lt('scheduled_start', today + 'T23:59:59');

      // Citas de la semana
      const { data: weekAppointments } = await supabase
        .from('appointments')
        .select('id, status_id')
        .eq('doctor_id', doctor.id)
        .gte('scheduled_start', weekAgo.toISOString());

      // Pacientes únicos del mes
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);

      const { data: monthPatients } = await supabase
        .from('appointments')
        .select('patient_user_id')
        .eq('doctor_id', doctor.id)
        .gte('scheduled_start', monthAgo.toISOString());

      const uniquePatients = new Set(monthPatients?.map(a => a.patient_user_id) || []);

      res.json({
        today: {
          total: todayAppointments?.length || 0,
          confirmed: todayAppointments?.filter(a => a.status_id === 2).length || 0
        },
        week: {
          total: weekAppointments?.length || 0,
          completed: weekAppointments?.filter(a => a.status_id === 3).length || 0
        },
        month: {
          uniquePatients: uniquePatients.size
        }
      });
    } catch (error) {
      console.error('Error getting doctor dashboard:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Dashboard del admin
  getAdminDashboard: async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Total de doctores activos
      const { data: doctors } = await supabase
        .from('doctors')
        .select('id')
        .eq('active', true);

      // Total de pacientes
      const { data: patients } = await supabase
        .from('users')
        .select('id, role_id')
        .eq('role_id', 3); // patient role

      // Citas de hoy
      const { data: todayAppointments } = await supabase
        .from('appointments')
        .select('id, status_id')
        .gte('scheduled_start', today)
        .lt('scheduled_start', today + 'T23:59:59');

      // Citas del mes
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { data: monthAppointments } = await supabase
        .from('appointments')
        .select('id, status_id')
        .gte('scheduled_start', monthStart.toISOString());

      res.json({
        doctors: {
          total: doctors?.length || 0
        },
        patients: {
          total: patients?.length || 0
        },
        appointments: {
          today: todayAppointments?.length || 0,
          month: monthAppointments?.length || 0,
          pending: todayAppointments?.filter(a => a.status_id === 1).length || 0
        }
      });
    } catch (error) {
      console.error('Error getting admin dashboard:', error);
      res.status(500).json({ error: error.message });
    }
  }

};

module.exports = reportController;