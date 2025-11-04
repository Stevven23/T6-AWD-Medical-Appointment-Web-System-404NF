require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const supabase = require('./database');
const app = express();
// Use environment port when deployed (Render, Heroku, etc.)
const PORT = process.env.PORT || 3000;

// Configuración de CORS
app.use(cors({
    origin: [
        'http://127.0.0.1:5500',
        'http://localhost:5500',
        // NOTE: no trailing slash — origin must match exactly
        'https://medical-appointment-frontend-ten.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));


// Middleware para leer JSON en las peticiones
app.use(express.json());

// ========== RUTAS DE AUTENTICACIÓN ==========
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
                    name
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
                role: user.roles.name
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// ========== RUTAS DE PRUEBA ==========
app.get('/api/test', (req, res) => {
    res.json({ mensaje: '¡El servidor funciona correctamente!' });
});

// ========== RUTAS DE PACIENTES/USUARIOS ==========

// Obtener todos los pacientes (usuarios con rol de paciente)
app.get('/api/pacientes', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('role_id', 2); // Asumiendo que 2 = paciente
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Obtener un paciente por ID
app.get('/api/pacientes/:id', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', req.params.id)
            .single();
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear un nuevo paciente
app.post('/api/pacientes', async (req, res) => {
    try {
        const { first_name, last_name, email, phone } = req.body;
        
        const { data, error } = await supabase
            .from('users')
            .insert([{
                first_name,
                last_name,
                email,
                phone,
                role_id: 2 // Rol de paciente
            }])
            .select();
        
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Actualizar un paciente
app.put('/api/pacientes/:id', async (req, res) => {
    try {
        const { first_name, last_name, email, phone } = req.body;
        
        const { data, error } = await supabase
            .from('users')
            .update({ first_name, last_name, email, phone })
            .eq('id', req.params.id)
            .select();
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Eliminar un paciente
app.delete('/api/pacientes/:id', async (req, res) => {
    try {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', req.params.id);
        
        if (error) throw error;
        res.json({ mensaje: 'Paciente eliminado correctamente' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== RUTAS DE DOCTORES ==========

// Obtener todos los doctores
app.get('/api/doctores', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('doctors')
            .select(`
                *,
                users (first_name, last_name, email, phone),
                specialties (name)
            `);
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ========== RUTAS DE CITAS ==========

// Obtener todas las citas
app.get('/api/citas', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('appointments')
            .select(`
                *,
                doctors (
                    users (first_name, last_name)
                ),
                appointment_status (name)
            `);
        
        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Crear una nueva cita
app.post('/api/citas', async (req, res) => {
    try {
        const { patient_id, doctor_id, appointment_date, reason } = req.body;
        
        const { data, error } = await supabase
            .from('appointments')
            .insert([{
                patient_id,
                doctor_id,
                appointment_date,
                reason,
                status_id: 1 // Asumiendo que 1 = Pendiente
            }])
            .select();
        
        if (error) throw error;
        res.status(201).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📝 Prueba la API en http://localhost:${PORT}/api/test`);
});
