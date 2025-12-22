// routes/reminders.js
const express = require('express');
const router = express.Router();
const reminderController = require('../controllers/reminderController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /api/reminders/schedule - Programar recordatorio (doctor/admin)
router.post('/schedule', requireRole('doctor', 'admin'), reminderController.scheduleReminder);

// POST /api/reminders/send-now - Enviar inmediatamente (doctor/admin)
router.post('/send-now', requireRole('doctor', 'admin'), reminderController.sendReminderNow);

// GET /api/reminders - Obtener recordatorios (doctor/admin)
router.get('/', requireRole('doctor', 'admin'), reminderController.getReminders);

// GET /api/reminders/:id - Obtener recordatorio por ID
router.get('/:id', requireRole('doctor', 'admin'), reminderController.getReminderById);

// PUT /api/reminders/:id - Actualizar recordatorio
router.put('/:id', requireRole('doctor', 'admin'), reminderController.updateReminder);

// DELETE /api/reminders/:id - Eliminar recordatorio
router.delete('/:id', requireRole('doctor', 'admin'), reminderController.deleteReminder);

module.exports = router;
