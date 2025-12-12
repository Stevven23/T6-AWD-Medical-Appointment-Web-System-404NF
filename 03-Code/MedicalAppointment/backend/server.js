require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('./database');
const session = require('express-session');
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

// Configurar sesiones para Passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Inicializar Passport
app.use(passport.initialize());
app.use(passport.session());

// ========== IMPORTAR RUTAS NUEVAS ==========
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patient');
const doctorRoutes = require('./routes/doctor');
const appointmentRoutes = require('./routes/appointments');
const medicalRecordRoutes = require('./routes/medicalRecord');
const specialtyRoutes = require('./routes/specialty');
const prescriptionRoutes = require('./routes/prescriptions');


// ========== MANTENER TU RUTA DE LOGIN EXISTENTE ==========
app.post('/api/auth/login', async (req, res) => {
  try {
    console.log('Recibida petición de login:', req.body);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email y contraseña son requeridos' });
    }

    // Buscar usuario
    const { data: user, error } = await supabase
      .from('users')
      .select(`
        *,
        roles:role_id (
          name,
          code
        )
      `)
      .eq('email', email)
      .single();

    console.log('Usuario encontrado:', user);
    console.log('Error de búsqueda:', error);

    if (error || !user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.roles.name
      },
      process.env.JWT_SECRET || 'tu_secreto_temporal',
      { expiresIn: '24h' }
    );

    // Enviar respuesta
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.roles.name
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// ========== NUEVAS RUTAS DE PACIENTES ==========
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/doctors/prescriptions', prescriptionRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/medical-records', medicalRecordRoutes);
app.use('/api/specialties', specialtyRoutes);

// ========== MANTENER TUS RUTAS EXISTENTES ==========
app.get('/api/test', (req, res) => {
  res.json({ mensaje: '¡El servidor funciona correctamente!' });
});


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📝 Prueba la API en http://localhost:${PORT}/api/test`);
});

// En tu app.js o server.js
const patientApiRoutes = require('./routes/patientRoutes'); // El NUEVO archivo de rutas


// Asigna las rutas a un prefijo de API, por ejemplo /api/patients
app.use('/api/patients', patientApiRoutes);

// ...