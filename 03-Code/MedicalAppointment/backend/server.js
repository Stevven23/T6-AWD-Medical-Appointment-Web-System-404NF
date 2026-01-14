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
   🔥 CORS PREFLIGHT GLOBAL (DEBE IR PRIMERO)
   ===================================================== */
app.use((req, res, next) => {
  const origin = req.headers.origin;

  const allowedOrigins = [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:5173',
    'https://medical-appointment-frontend-ten.vercel.app',
    'https://t6-awd-medical-appointment-web-syst.vercel.app'
  ];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Accept, Origin, X-Requested-With'
  );
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  // 🔥 RESPUESTA DIRECTA AL PREFLIGHT
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

/* =====================================================
   CORS NORMAL
   ===================================================== */
app.use(cors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:5173',
    'https://medical-appointment-frontend-ten.vercel.app',
    'https://t6-awd-medical-appointment-web-syst.vercel.app'
  ],
  credentials: true
}));

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
   (orden IMPORTANTE)
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

// ⚠️ Ruta parametrizada AL FINAL
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
