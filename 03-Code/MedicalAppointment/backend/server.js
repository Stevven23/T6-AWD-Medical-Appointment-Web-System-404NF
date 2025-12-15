require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('./database');
const passport = require('./config/passport');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: [
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'https://medical-appointment-frontend-ten.vercel.app',
    'https://t6-awd-medical-appointment-web-syst.vercel.app'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  exposedHeaders: ['Content-Length', 'X-Requested-With'],
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Simple request logging for debugging (method + path)
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.originalUrl}`);
  next();
});

// Inicializar Passport (sin sesión - stateless JWT OAuth)
app.use(passport.initialize());

// ========== IMPORTAR RUTAS NUEVAS ==========
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


// ========== RUTAS DE LA API ==========
// IMPORTANTE: Las rutas más específicas DEBEN ir ANTES de las parametrizadas
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
// IMPORTANTE: /api/doctors debe ir DESPUÉS de las otras rutas porque tiene :id parametrizado
app.use('/api/doctors', doctorRoutes);

app.get('/api/test', (req, res) => {
  res.json({ mensaje: '¡El servidor funciona correctamente!' });
});

// Manejador 404 para devolver JSON en lugar de HTML (debe estar ANTES de app.listen())
app.use((req, res) => {
  console.warn('Ruta no encontrada:', req.method, req.originalUrl);
  res.status(404).json({ error: `Ruta no encontrada: ${req.originalUrl}` });
});

// Manejador de errores genérico para asegurar respuestas JSON (debe estar ANTES de app.listen())
app.use((err, req, res, next) => {
  console.error('Error inesperado:', err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Prueba la API en http://localhost:${PORT}/api/test`);
});