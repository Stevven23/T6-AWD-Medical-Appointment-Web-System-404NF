// Test manual del scheduler de recordatorios
require('dotenv').config();
const reminderScheduler = require('./services/reminderScheduler');

console.log('🧪 Ejecutando test manual del scheduler...\n');

// Ejecutar el processReminders directamente
reminderScheduler.processReminders()
  .then(() => {
    console.log('\n✅ Test completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Error en test:', error);
    process.exit(1);
  });
