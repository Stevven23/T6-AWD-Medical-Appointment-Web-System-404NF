#!/usr/bin/env node
/**
 * Script para insertar horarios del doctor en doctor_schedules
 * Uso: node seed-doctor-schedule.js <doctor_id>
 * Ejemplo: node seed-doctor-schedule.js e3605d0f-5a47-4d97-b43a-863f7c8090e7
 */

const supabase = require('./database');

async function seedSchedule() {
  const doctorId = process.argv[2];

  if (!doctorId) {
    console.error('❌ Falta el doctor_id. Uso: node seed-doctor-schedule.js <doctor_id>');
    process.exit(1);
  }

  console.log(`📅 Insertando horarios para doctor: ${doctorId}`);

  // Lunes (0) a Viernes (4): 09:00 - 14:00
  const schedules = [
    { day: 0, label: 'Lunes' },
    { day: 1, label: 'Martes' },
    { day: 2, label: 'Miércoles' },
    { day: 3, label: 'Jueves' },
    { day: 4, label: 'Viernes' }
  ].map(d => ({
    doctor_id: doctorId,
    day_of_week: d.day,
    start_time: '09:00:00',
    end_time: '14:00:00',
    break_start_time: '11:30:00',
    break_end_time: '12:00:00',
    is_working_day: true
  }));

  try {
    const { data, error } = await supabase
      .from('doctor_schedules')
      .insert(schedules)
      .select();

    if (error) throw error;

    console.log(`✅ ${data.length} horarios creados exitosamente:`);
    data.forEach(s => {
      const dayNames = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
      console.log(`   ${dayNames[s.day_of_week]}: ${s.start_time} - ${s.end_time}`);
    });
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

seedSchedule();
