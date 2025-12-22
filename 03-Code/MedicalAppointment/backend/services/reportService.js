// services/reportService.js
const supabase = require('../database');

const reportService = {
  /**
   * Obtiene citas por período con toda la información relacionada
   */
  async getAppointmentsByPeriod(doctorId, startDate, endDate, statusFilters = null) {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          users:patient_user_id (first_name, last_name, email),
          doctors!appointments_doctor_id_fkey (
            id,
            users (first_name, last_name),
            specialties (name)
          )
        `)
        .gte('scheduled_start', startDate)
        .lte('scheduled_start', endDate);

      // Filtrar por doctor si se proporciona
      if (doctorId) {
        query = query.eq('doctor_id', doctorId);
      }

      // Filtrar por estados si se proporciona
      if (statusFilters && statusFilters.length > 0) {
        query = query.in('status_id', statusFilters);
      }

      const { data, error } = await query.order('scheduled_start', { ascending: false });

      if (error) {
        console.error('Error en reportService.getAppointmentsByPeriod:', error);
        throw new Error('Error al obtener citas del período');
      }

      return data || [];
    } catch (error) {
      console.error('Error en reportService.getAppointmentsByPeriod:', error);
      throw error;
    }
  },

  /**
   * Calcula estadísticas de un doctor
   */
  async getDoctorStatistics(doctorId, startDate, endDate) {
    try {
      // Obtener todas las citas del doctor en el período
      const appointments = await this.getAppointmentsByPeriod(
        doctorId, 
        startDate, 
        endDate
      );

      const total = appointments.length;

      if (total === 0) {
        return {
          totalAppointments: 0,
          completedAppointments: 0,
          cancelledAppointments: 0,
          rescheduledAppointments: 0,
          noShowAppointments: 0,
          attendanceRate: 0,
          averageConsultationTime: 0,
          cancellationRatio: 0
        };
      }

      // Contar por estado
      const completed = appointments.filter(a => a.status_id === 3).length;
      const cancelled = appointments.filter(a => a.status_id === 4).length;
      const rescheduled = appointments.filter(a => a.status_id === 5).length;
      const noShow = appointments.filter(a => a.status_id === 6).length;

      // Calcular tasa de asistencia (AR)
      // AR = (completadas / (total - canceladas)) * 100
      const eligible = total - cancelled;
      const attendanceRate = eligible > 0 ? ((completed / eligible) * 100).toFixed(2) : 0;

      // Calcular tiempo promedio de consulta (ACT)
      const completedAppointments = appointments.filter(a => a.status_id === 3);
      let totalMinutes = 0;
      
      completedAppointments.forEach(apt => {
        const start = new Date(apt.scheduled_start);
        const end = new Date(apt.scheduled_end);
        const minutes = (end - start) / (1000 * 60);
        totalMinutes += minutes;
      });

      const averageConsultationTime = completedAppointments.length > 0 
        ? (totalMinutes / completedAppointments.length).toFixed(2)
        : 0;

      // Calcular ratio de cancelación (CR)
      // CR = (canceladas / total) * 100
      const cancellationRatio = ((cancelled / total) * 100).toFixed(2);

      return {
        totalAppointments: total,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        rescheduledAppointments: rescheduled,
        noShowAppointments: noShow,
        attendanceRate: parseFloat(attendanceRate),
        averageConsultationTime: parseFloat(averageConsultationTime),
        cancellationRatio: parseFloat(cancellationRatio)
      };
    } catch (error) {
      console.error('Error en reportService.getDoctorStatistics:', error);
      throw new Error('Error al calcular estadísticas');
    }
  },

  /**
   * Calcula estadísticas del sistema completo
   */
  async getSystemStatistics(startDate, endDate) {
    try {
      // Obtener todas las citas del sistema
      const appointments = await this.getAppointmentsByPeriod(null, startDate, endDate);

      // Contar doctores activos
      const { data: doctors, error: doctorsError } = await supabase
        .from('doctors')
        .select('id, active, specialties(name)', { count: 'exact' });

      if (doctorsError) throw doctorsError;

      const totalDoctors = doctors?.length || 0;
      const activeDoctors = doctors?.filter(d => d.active).length || 0;

      // Contar pacientes únicos
      const uniquePatients = new Set(appointments.map(a => a.patient_user_id)).size;

      // Estadísticas de citas
      const total = appointments.length;
      const completed = appointments.filter(a => a.status_id === 3).length;
      const cancelled = appointments.filter(a => a.status_id === 4).length;

      // Calcular tasa de asistencia del sistema
      const eligible = total - cancelled;
      const systemAttendanceRate = eligible > 0 
        ? parseFloat(((completed / eligible) * 100).toFixed(2))
        : 0;

      // Calcular ratio de cancelación del sistema
      const systemCancellationRatio = total > 0
        ? parseFloat(((cancelled / total) * 100).toFixed(2))
        : 0;

      // Promedio de consultas por doctor
      const averageConsultationsPerDoctor = activeDoctors > 0
        ? parseFloat((completed / activeDoctors).toFixed(2))
        : 0;

      // Top especialidades
      const specialtyCounts = {};
      appointments.forEach(apt => {
        if (apt.doctors?.specialties?.name) {
          const specialty = apt.doctors.specialties.name;
          specialtyCounts[specialty] = (specialtyCounts[specialty] || 0) + 1;
        }
      });

      const topSpecialties = Object.entries(specialtyCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([specialty, count]) => ({
          specialty,
          count,
          percentage: parseFloat(((count / total) * 100).toFixed(2))
        }));

      // Top doctores por número de citas completadas
      const doctorCounts = {};
      const doctorNames = {};

      appointments.filter(a => a.status_id === 3).forEach(apt => {
        const docId = apt.doctor_id;
        doctorCounts[docId] = (doctorCounts[docId] || 0) + 1;
        
        if (apt.doctors?.users) {
          doctorNames[docId] = `Dr. ${apt.doctors.users.first_name} ${apt.doctors.users.last_name}`;
        }
      });

      const topDoctors = Object.entries(doctorCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([doctorId, count]) => {
          const doctorAppointments = appointments.filter(a => a.doctor_id === doctorId);
          const doctorCompleted = doctorAppointments.filter(a => a.status_id === 3).length;
          const completionRate = doctorAppointments.length > 0
            ? parseFloat(((doctorCompleted / doctorAppointments.length) * 100).toFixed(2))
            : 0;

          return {
            doctorId,
            name: doctorNames[doctorId] || 'Desconocido',
            appointments: count,
            completionRate
          };
        });

      // Calcular índice de eficiencia operacional (OEI)
      // OEI = (AR + (100 - CR)) / 2
      const operationalEfficiencyIndex = parseFloat(
        ((systemAttendanceRate + (100 - systemCancellationRatio)) / 2).toFixed(2)
      );

      return {
        totalDoctors,
        activeDoctors,
        totalPatients: uniquePatients,
        totalAppointments: total,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        systemAttendanceRate,
        systemCancellationRatio,
        averageConsultationsPerDoctor,
        topSpecialties,
        topDoctors,
        operationalEfficiencyIndex
      };
    } catch (error) {
      console.error('Error en reportService.getSystemStatistics:', error);
      throw new Error('Error al calcular estadísticas del sistema');
    }
  },

  /**
   * Obtiene actividad semanal
   */
  async getWeeklyActivity(doctorId) {
    try {
      // Calcular fecha de inicio de la semana (domingo)
      const now = new Date();
      const dayOfWeek = now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - dayOfWeek);
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // Obtener citas de la semana
      const appointments = await this.getAppointmentsByPeriod(
        doctorId,
        startOfWeek.toISOString(),
        endOfWeek.toISOString()
      );

      // Contar por día
      const activityByDay = [0, 0, 0, 0, 0, 0, 0]; // Domingo a Sábado
      
      appointments.forEach(apt => {
        const aptDate = new Date(apt.scheduled_start);
        const day = aptDate.getDay();
        activityByDay[day]++;
      });

      return {
        activityByDay,
        labels: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
      };
    } catch (error) {
      console.error('Error en reportService.getWeeklyActivity:', error);
      throw new Error('Error al obtener actividad semanal');
    }
  },

  /**
   * Obtiene citas modificadas (canceladas/reprogramadas)
   */
  async getModifiedAppointments(doctorId, startDate, endDate, statusFilter = 'all') {
    try {
      let statusIds = [];
      
      if (statusFilter === 'canceladas') {
        statusIds = [4]; // Canceladas
      } else if (statusFilter === 'reprogramadas') {
        statusIds = [5]; // Reprogramadas
      } else {
        statusIds = [4, 5]; // Ambas
      }

      const appointments = await this.getAppointmentsByPeriod(
        doctorId,
        startDate,
        endDate,
        statusIds
      );

      const modifiedAppointments = appointments.map(apt => ({
        fechaOriginal: new Date(apt.scheduled_start).toISOString().split('T')[0],
        nuevaFecha: apt.status_id === 5 ? new Date(apt.updated_at).toISOString().split('T')[0] : null,
        paciente: apt.users ? `${apt.users.first_name} ${apt.users.last_name}` : 'Desconocido',
        motivo: apt.status_id === 4 ? 'Cancelada' : 'Reprogramada',
        razon: apt.reason || 'No especificada'
      }));

      return {
        modifiedAppointments,
        total: modifiedAppointments.length
      };
    } catch (error) {
      console.error('Error en reportService.getModifiedAppointments:', error);
      throw new Error('Error al obtener citas modificadas');
    }
  }
};

module.exports = reportService;
