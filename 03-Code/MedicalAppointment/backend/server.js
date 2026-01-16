require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('./database');
const passport = require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================================================
   🔥 CORS GLOBAL + PREFLIGHT (DEBE IR PRIMERO)
   ===================================================== */
const corsOptions = {
  origin: (origin, callback) => {
    if (
      !origin ||
      origin.includes('vercel.app') ||
      origin.includes('localhost')
    ) {
      callback(null, true);
    } else {
      callback(new Error('CORS no permitido'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // 🔥 CLAVE PARA PREFLIGHT

/* =====================================================
   MIDDLEWARES BASE
   ===================================================== */
app.use(express.json());

// Log simple de requests
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// Passport (JWT stateless)
app.use(passport.initialize());

/* =====================================================
   IMPORTACIÓN DE RUTAS
   ===================================================== */
const authRoutes = require('./routes/auth');
const sessionsRoutes = require('./routes/sessions');
const passwordResetsRoutes = require('./routes/passwordResets');
const patientRoutes = require('./routes/patient');
const doctorRoutes = require('./routes/doctor');
const appointmentRoutes = require('./routes/appointments');
const medicalRecordRoutes = require('./routes/medicalRecord');
const specialtyRoutes = require('./routes/specialty');
const prescriptionRoutes = require('./routes/prescriptions');
const consultationRoomRoutes = require('./routes/consultationRooms');
const reportRoutes = require('./routes/reports');
const reminderRoutes = require('./routes/reminders');
const billingRoutes = require('./routes/billings');
const auditLogRoutes = require('./routes/auditLogs');

/* =====================================================
   RUTAS API
   ===================================================== */
app.use('/api/auth', authRoutes);
app.use('/api/sessions', sessionsRoutes);
app.use('/api/password-resets', passwordResetsRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/consultation-rooms', consultationRoomRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/billings', billingRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// ⚠️ Rutas parametrizadas al final
app.use('/api/doctors', doctorRoutes);
app.use('/api/reminders', reminderRoutes);

/* =====================================================
   RUTA TEST
   ===================================================== */
app.get('/api/test', (req, res) => {
  res.json({ mensaje: '¡El servidor funciona correctamente!' });
});

/* =====================================================
   404 JSON
   ===================================================== */
app.use((req, res) => {
  console.warn('Ruta no encontrada:', req.method, req.originalUrl);
  res.status(404).json({ error: `Ruta no encontrada: ${req.originalUrl}` });
});

/* =====================================================
   ERROR HANDLER GLOBAL
   ===================================================== */
app.use((err, req, res, next) => {
  console.error('Error inesperado:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor'
  });
});

/* =====================================================
   START SERVER
   ===================================================== */
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Test: http://localhost:${PORT}/api/test`);
});
