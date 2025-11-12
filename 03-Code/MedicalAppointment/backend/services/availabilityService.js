const supabase = require('../database');

/**
 * Servicio para calcular slots disponibles de doctores
 */
const availabilityService = {
  /**
   * Obtiene los slots disponibles de un doctor para una fecha específica
   */
  getAvailableSlots: async (doctorId, dateString) => {
    try {
      const date = new Date(dateString + 'T00:00:00');
      const dayOfWeek = date.getDay(); // 0 = Domingo, 6 = Sábado

      // 1. Verificar excepciones (días libres, vacaciones)
      const { data: exceptions } = await supabase
        .from('schedule_exceptions')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('exception_date', dateString);

      if (exceptions && exceptions.length > 0) {
        const hasAllDayException = exceptions.some(
          exc => exc.is_all_day || exc.exception_type === 'vacation' || exc.exception_type === 'day_off'
        );
        
        if (hasAllDayException) {
          return []; // No hay disponibilidad este día
        }
      }

      // 2. Obtener horario regular del doctor
      const { data: schedules } = await supabase
        .from('doctor_schedules')
        .select('*')
        .eq('doctor_id', doctorId)
        .eq('day_of_week', dayOfWeek)
        .eq('is_working_day', true);

      if (!schedules || schedules.length === 0) {
        return []; // El doctor no trabaja este día
      }

      const schedule = schedules[0];

      // 3. Obtener citas existentes para ese día
      const startOfDay = `${dateString}T00:00:00Z`;
      const endOfDay = `${dateString}T23:59:59Z`;

      const { data: appointments } = await supabase
        .from('appointments')
        .select('scheduled_start, scheduled_end')
        .eq('doctor_id', doctorId)
        .gte('scheduled_start', startOfDay)
        .lte('scheduled_start', endOfDay)
        .in('status_id', [1, 2]); // 1=scheduled, 2=confirmed

      // 4. Generar slots de 30 minutos
      const slots = generateTimeSlots(
        schedule.start_time,
        schedule.end_time,
        schedule.break_start_time,
        schedule.break_end_time,
        30 // duración en minutos
      );

      // 5. Filtrar slots ocupados
      const availableSlots = slots.filter(slot => {
        const slotStart = new Date(`${dateString}T${slot.start}:00`);
        const slotEnd = new Date(`${dateString}T${slot.end}:00`);

        // Verificar si se solapa con alguna cita
        const isOccupied = appointments?.some(apt => {
          const aptStart = new Date(apt.scheduled_start);
          const aptEnd = new Date(apt.scheduled_end);

          return (
            (slotStart >= aptStart && slotStart < aptEnd) ||
            (slotEnd > aptStart && slotEnd <= aptEnd) ||
            (slotStart <= aptStart && slotEnd >= aptEnd)
          );
        });

        return !isOccupied;
      });

      return availableSlots;

    } catch (error) {
      console.error('Error en availabilityService:', error);
      throw error;
    }
  }
};

/**
 * Genera slots de tiempo entre start y end
 */
function generateTimeSlots(startTime, endTime, breakStart, breakEnd, durationMinutes) {
  const slots = [];
  
  const start = timeToMinutes(startTime);
  const end = timeToMinutes(endTime);
  const breakStartMin = breakStart ? timeToMinutes(breakStart) : null;
  const breakEndMin = breakEnd ? timeToMinutes(breakEnd) : null;

  let current = start;

  while (current + durationMinutes <= end) {
    const slotEnd = current + durationMinutes;

    // Verificar si está en horario de break
    const isDuringBreak = breakStartMin && breakEndMin &&
      (current >= breakStartMin && current < breakEndMin);

    if (!isDuringBreak) {
      slots.push({
        start: minutesToTime(current),
        end: minutesToTime(slotEnd)
      });
    }

    current += durationMinutes;
  }

  return slots;
}

/**
 * Convierte tiempo "HH:MM:SS" a minutos desde medianoche
 */
function timeToMinutes(timeStr) {
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convierte minutos desde medianoche a "HH:MM"
 */
function minutesToTime(minutes) {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

module.exports = availabilityService;
