require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const passport = require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3000;

/* ===============================
   CORS
================================ */
app.use(cors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'https://medical-appointment-frontend-ten.vercel.app',
    'https://t6-awd-medical-appointment-web-syst.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

/* ===============================
   LOG DE REQUESTS
================================ */
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

/* ===============================
   SESSION + PASSPORT
================================ */
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

app.use(passport.initialize());
app.use(passport.session());

/* ===============================
   IMPORTAR RUTAS
================================ */
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const doctorRoutes = require('./routes/doctor');
const appointmentRoutes = require('./routes/appointments');
const medicalRecordRoutes = require('./routes/medicalRecord');
const specialtyRoutes = require('./routes/specialty');
const prescriptionRoutes = require('./routes/prescriptions');
const consultationRoomRoutes = require('./routes/consultationRooms');

/* ===============================
   REGISTRO DE RUTAS (ORDEN CRÍTICO)
================================ */

// AUTH
app.use('/api/auth', authRoutes);

// PACIENTES
app.use('/api/patients', patientRoutes);

// ⚠️ PRESCRIPTIONS ANTES DE DOCTORS (OBLIGATORIO)
app.use('/api/prescriptions', prescriptionRoutes);

// DOCTORS (TIENE /:id)
app.use('/api/doctors', doctorRoutes);

// OTRAS
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/specialties', specialtyRoutes);
app.use('/api/consultation-rooms', consultationRoomRoutes);

/* ===============================
   TEST
================================ */
app.get('/api/test', (req, res) => {
  res.json({ message: 'API funcionando correctamente 🚀' });
});

/* ===============================
   404 JSON (NO HTML)
================================ */
app.use((req, res) => {
  res.status(404).json({
    error: `Ruta no encontrada: ${req.method} ${req.originalUrl}`
  });
});

/* ===============================
   ERROR HANDLER
================================ */
app.use((err, req, res, next) => {
  console.error('Error inesperado:', err);
  res.status(500).json({
    error: err.message || 'Error interno del servidor'
  });
});

/* ===============================
   START SERVER
================================ */
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
