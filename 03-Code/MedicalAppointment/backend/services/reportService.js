// backend/services/reportService.js

const supabase = require('../database');

/**
 * Servicio para generar reportes y estadísticas del sistema
 */
const reportService = {

  /**
   * Obtiene las citas de un doctor en un rango de fechas
   * @param {number} doctorId - ID del doctor
   * @param {string} startDate - Fecha inicio (YYYY-MM-DD)
   * @param {string} endDate - Fecha fin (YYYY-MM-DD)
   */
  getAppointmentsByPeriod: async (doctorId, startDate, endDate) => {
    try {
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_start,
          scheduled_end,
          reason,
          status_code,
          
          patients!inner(
            user_id,
            users!inner(
              first_name,
              last_name,
              email
            )
          ),
          
          doctors!inner(
            id,
            users!inner(
              first_name,
              last_name
            )
          ),
          
          appointment_statuses(
            name,
            code
          )
        `)
        .eq('doctor_id', doctorId)
        .gte('scheduled_start', `${startDate}T00:00:00`)
        .lte('scheduled_start', `${endDate}T23:59:59`)
        .order('scheduled_start', { ascending: false });

      if (error) throw error;

      // Transform data to flatten structure
      const transformedAppointments = appointments.map(apt => ({
        id: apt.id,
        scheduled_start: apt.scheduled_start,
        scheduled_end: apt.scheduled_end,
        reason: apt.reason,
        status_code: apt.status_code,
        status_name: apt.appointment_statuses?.name || 'Unknown',
        patient_user_id: apt.patients?.user_id,
        patient_first_name: apt.patients?.users?.first_name,
        patient_last_name: apt.patients?.users?.last_name,
        patient_email: apt.patients?.users?.email,
        doctor_first_name: apt.doctors?.users?.first_name,
        doctor_last_name: apt.doctors?.users?.last_name,
        appointment_type: determineAppointmentType(apt.reason)
      }));

      return transformedAppointments;

    } catch (error) {
      console.error('Error en reportService.getAppointmentsByPeriod:', error);
      throw new Error('Error al obtener citas del período');
    }
  },

  /**
   * Obtiene consultas modificadas (canceladas o reprogramadas) en un período
   * @param {number} doctorId - ID del doctor
   * @param {string} startDate - Fecha inicio (YYYY-MM-DD)
   * @param {string} endDate - Fecha fin (YYYY-MM-DD)
   */
  getModifiedAppointments: async (doctorId, startDate, endDate) => {
    try {
      // Get cancelled appointments
      const { data: cancelled, error: cancelError } = await supabase
        .from('appointments')
        .select(`
          id,
          scheduled_start,
          cancelled_at,
          cancellation_reason,
          
          patients!inner(
            users!inner(
              first_name,
              last_name
            )
          )
        `)
        .eq('doctor_id', doctorId)
        .eq('status_code', 'cancelled')
        .gte('cancelled_at', `${startDate}T00:00:00`)
        .lte('cancelled_at', `${endDate}T23:59:59`)
        .order('cancelled_at', { ascending: false });

      if (cancelError) throw cancelError;

      // Get rescheduled appointments (assuming you have an audit table or modification history)
      // If not, you'll need to create a table to track this
      const { data: rescheduled, error: reschedError } = await supabase
        .from('appointment_modifications')
        .select(`
          appointment_id,
          original_date,
          new_date,
          modification_type,
          modification_reason,
          modified_at,
          
          appointments!inner(
            doctor_id,
            patients!inner(
              users!inner(
                first_name,
                last_name
              )
            )
          )
        `)
        .eq('appointments.doctor_id', doctorId)
        .gte('modified_at', `${startDate}T00:00:00`)
        .lte('modified_at', `${endDate}T23:59:59`)
        .eq('modification_type', 'rescheduled')
        .order('modified_at', { ascending: false });

      // Note: If appointment_modifications table doesn't exist, return only cancelled
      const rescheduledData = reschedError ? [] : rescheduled;

      // Combine and transform data
      const modifications = [
        ...cancelled.map(apt => ({
          type: 'cancelled',
          original_date: apt.scheduled_start,
          new_date: null,
          cancelled_at: apt.cancelled_at,
          patient_first_name: apt.patients?.users?.first_name,
          patient_last_name: apt.patients?.users?.last_name,
          modification_reason: `Cancelada: ${apt.cancellation_reason || 'No especificado'}`
        })),
        ...rescheduledData.map(mod => ({
          type: 'rescheduled',
          original_date: mod.original_date,
          new_date: mod.new_date,
          cancelled_at: null,
          patient_first_name: mod.appointments?.patients?.users?.first_name,
          patient_last_name: mod.appointments?.patients?.users?.last_name,
          modification_reason: `Reprogramada: ${mod.modification_reason || 'No especificado'}`
        }))
      ];

      return modifications;

    } catch (error) {
      console.error('Error en reportService.getModifiedAppointments:', error);
      throw new Error('Error al obtener consultas modificadas');
    }
  },

  /**
   * Genera estadísticas del doctor para un período
   * @param {number} doctorId - ID del doctor
   * @param {string} startDate - Fecha inicio (YYYY-MM-DD)
   * @param {string} endDate - Fecha fin (YYYY-MM-DD)
   */
  getDoctorStatistics: async (doctorId, startDate, endDate) => {
    try {
      // Get all appointments in period
      const appointments = await reportService.getAppointmentsByPeriod(doctorId, startDate, endDate);

      // Calculate statistics
      const stats = {
        total_appointments: appointments.length,
        by_status: {},
        by_type: {},
        by_day_of_week: {
          0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0
        },
        unique_patients: new Set(),
        average_appointments_per_day: 0
      };

      // Count by status
      appointments.forEach(apt => {
        // Status count
        stats.by_status[apt.status_code] = (stats.by_status[apt.status_code] || 0) + 1;
        
        // Type count
        stats.by_type[apt.appointment_type] = (stats.by_type[apt.appointment_type] || 0) + 1;
        
        // Day of week count
        const date = new Date(apt.scheduled_start);
        const dayOfWeek = date.getDay();
        stats.by_day_of_week[dayOfWeek]++;
        
        // Unique patients
        stats.unique_patients.add(apt.patient_user_id);
      });

      // Calculate averages
      const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) + 1;
      stats.average_appointments_per_day = (stats.total_appointments / daysDiff).toFixed(2);
      
      // Convert Set to count
      stats.unique_patients_count = stats.unique_patients.size;
      delete stats.unique_patients; // Remove Set object

      return stats;

    } catch (error) {
      console.error('Error en reportService.getDoctorStatistics:', error);
      throw new Error('Error al calcular estadísticas');
    }
  },

  /**
   * Obtiene estadísticas globales del sistema (para admin)
   * @param {string} startDate - Fecha inicio (YYYY-MM-DD)
   * @param {string} endDate - Fecha fin (YYYY-MM-DD)
   */
  getSystemStatistics: async (startDate, endDate) => {
    try {
      // Total appointments
      const { count: totalAppointments, error: aptError } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_start', `${startDate}T00:00:00`)
        .lte('scheduled_start', `${endDate}T23:59:59`);

      if (aptError) throw aptError;

      // Active doctors
      const { count: activeDoctors, error: docError } = await supabase
        .from('doctors')
        .select('*', { count: 'exact', head: true })
        .eq('active', true);

      if (docError) throw docError;

      // Active patients
      const { count: activePatients, error: patError } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      if (patError) throw patError;

      // Appointments by status
      const { data: appointmentsByStatus, error: statusError } = await supabase
        .from('appointments')
        .select('status_code')
        .gte('scheduled_start', `${startDate}T00:00:00`)
        .lte('scheduled_start', `${endDate}T23:59:59`);

      if (statusError) throw statusError;

      const statusCounts = {};
      appointmentsByStatus.forEach(apt => {
        statusCounts[apt.status_code] = (statusCounts[apt.status_code] || 0) + 1;
      });

      // Specialties distribution
      const { data: specialties, error: specError } = await supabase
        .from('specialties')
        .select(`
          id,
          name,
          doctors(count)
        `);

      if (specError) throw specError;

      return {
        period: {
          start: startDate,
          end: endDate
        },
        total_appointments: totalAppointments,
        active_doctors: activeDoctors,
        active_patients: activePatients,
        appointments_by_status: statusCounts,
        specialties_distribution: specialties.map(spec => ({
          specialty: spec.name,
          doctor_count: spec.doctors?.length || 0
        }))
      };

    } catch (error) {
      console.error('Error en reportService.getSystemStatistics:', error);
      throw new Error('Error al obtener estadísticas del sistema');
    }
  },

  /**
   * Exporta datos de citas a CSV
   * @param {number} doctorId - ID del doctor
   * @param {string} startDate - Fecha inicio
   * @param {string} endDate - Fecha fin
   */
  exportAppointmentsToCSV: async (doctorId, startDate, endDate) => {
    try {
      const appointments = await reportService.getAppointmentsByPeriod(doctorId, startDate, endDate);

      // CSV Headers
      const headers = [
        'ID',
        'Fecha',
        'Hora',
        'Paciente',
        'Email',
        'Tipo de Consulta',
        'Motivo',
        'Estado'
      ];

      // CSV Rows
      const rows = appointments.map(apt => [
        apt.id,
        apt.scheduled_start.split('T')[0],
        apt.scheduled_start.split('T')[1].substring(0, 5),
        `${apt.patient_first_name} ${apt.patient_last_name}`,
        apt.patient_email,
        apt.appointment_type,
        apt.reason || 'N/A',
        apt.status_name
      ]);

      // Build CSV string
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      return csvContent;

    } catch (error) {
      console.error('Error en reportService.exportAppointmentsToCSV:', error);
      throw new Error('Error al exportar datos a CSV');
    }
  }
};

/**
 * Helper function to determine appointment type based on reason
 * @param {string} reason - Appointment reason
 * @returns {string} - Appointment type
 */
function determineAppointmentType(reason) {
  if (!reason) return 'Consulta General';
  
  const reasonLower = reason.toLowerCase();
  
  if (reasonLower.includes('urgencia') || reasonLower.includes('emergencia')) {
    return 'Urgencia';
  } else if (reasonLower.includes('seguimiento') || reasonLower.includes('control')) {
    return 'Seguimiento';
  } else if (reasonLower.includes('revisión') || reasonLower.includes('revision')) {
    return 'Revisión';
  } else if (reasonLower.includes('vacuna')) {
    return 'Vacunación';
  } else if (reasonLower.includes('examen') || reasonLower.includes('análisis')) {
    return 'Exámenes';
  } else {
    return 'Consulta General';
  }
}

/**
 * Helper function to get day name in Spanish
 * @param {number} dayIndex - Day of week (0-6)
 * @returns {string} - Day name
 */
function getDayName(dayIndex) {
  const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  return days[dayIndex] || 'Unknown';
}

module.exports = reportService;