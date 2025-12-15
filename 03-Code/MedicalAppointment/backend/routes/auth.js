const express = require('express');
const router = express.Router();
const supabase = require('../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('../config/passport');

// ========== GOOGLE OAUTH ROUTES ==========

// Iniciar autenticación con Google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Callback de Google OAuth
router.get('/google/callback',
    passport.authenticate('google', { 
        session: false,
        failureRedirect: '/panels/login.html?error=google_auth_failed'
    }),
    async (req, res) => {
        try {
            console.log('Google callback - Usuario autenticado:', req.user.id);

            // Generar JWT
            const token = jwt.sign(
                {
                    id: req.user.id,
                    email: req.user.email,
                    role_id: req.user.role_id
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            const roleName = req.user.roles.name;

            // Preparar datos del usuario para el frontend
            // Sanitizar strings para evitar problemas con caracteres especiales corruptos
            const sanitizeString = (str) => {
                if (!str) return '';
                // Reemplazar caracteres problemáticos:
                // - Caracteres de control (0x00-0x1F, 0x7F-0x9F)
                // - Carácter de reemplazo Unicode (U+FFFD / 65533)
                return str
                    .replace(/\uFFFD/g, 'Ñ')  // Reemplazar � con Ñ
                    .replace(/[\x00-\x1F\x7F-\x9F]/g, '')  // Eliminar caracteres de control
                    .trim();
            };

            const userData = {
                id: req.user.id,
                email: req.user.email,
                first_name: sanitizeString(req.user.first_name),
                last_name: sanitizeString(req.user.last_name),
                role: roleName,
                cedula: req.user.cedula
            };

            console.log('UserData antes de enviar:', userData);
            console.log('last_name original:', req.user.last_name);
            console.log('last_name sanitizado:', userData.last_name);

            // Verificar si es un nuevo usuario de Google (sin datos completos)
            const { data: patientData } = await supabase
                .from('patients')
                .select('date_of_birth')
                .eq('user_id', req.user.id)
                .single();

            const needsCompletion = !patientData?.date_of_birth || !req.user.cedula;

            // Determinar redirección y codificar datos
            const payload = {
                token,
                user: userData
            };
            const payloadEncoded = Buffer.from(JSON.stringify(payload)).toString('base64');

            // Obtener URL del frontend desde variable de entorno
            // Local: http://127.0.0.1:5500/MedicalAppointment
            // Producción: https://t6-awd-medical-appointment-web-syst-vercel.app
            const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5500/MedicalAppointment';

            // Redirigir directamente según necesidad
            let redirectUrl;
            if (needsCompletion) {
                redirectUrl = `${frontendUrl}/panels/completeProfile.html?oauth=${payloadEncoded}`;
            } else {
                const dashboardRoutes = {
                    patient: 'patient/patientDashboard.html',
                    doctor: 'doctor/doctorHome.html',
                    admin: 'Admin/DashboardAdmin.html'
                };
                const dashboard = dashboardRoutes[roleName] || 'patient/patientDashboard.html';
                redirectUrl = `${frontendUrl}/panels/${dashboard}?oauth=${payloadEncoded}`;
            }

            console.log('Redirigiendo a:', redirectUrl);
            res.redirect(redirectUrl);

        } catch (error) {
            console.error('Error en Google callback:', error);
            const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5500/MedicalAppointment';
            res.redirect(`${frontendUrl}/panels/login.html?error=callback_failed`);
        }
    }
);

// ========== TRADITIONAL AUTH ROUTES ==========

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // 1. Buscar usuario por email y obtener su rol
        const { data: user, error } = await supabase
            .from('users')
            .select(`
                *,
                roles (name)
            `)
            .eq('email', email)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        // 2. Verificar contraseña
        const validPassword = await bcrypt.compare(password, user.password_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Contraseña incorrecta' });
        }

        // 4. Generar token JWT
        const token = jwt.sign(
            { 
                userId: user.id,
                role: user.roles.name,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // 5. Enviar respuesta con todos los datos del usuario
        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.roles.name,
                first_name: user.first_name,
                last_name: user.last_name,
                phone_number: user.phone_number,
                cedula: user.cedula
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Registro (ejemplo básico)
router.post('/register', async (req, res) => {
    try {
        const { 
            email, 
            password, 
            first_name, 
            last_name,
            cedula,
            phone_number,
            date_of_birth
        } = req.body;

        // 1. Validaciones básicas
        if (!email || !password || !first_name || !last_name || !cedula || !date_of_birth) {
            return res.status(400).json({ error: 'Los campos email, password, nombres, apellidos, cédula y fecha de nacimiento son obligatorios' });
        }

        // 2. Verificar si el email ya existe
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado' });
        }

        // 3. Verificar si la cédula ya existe
        const { data: existingCedula } = await supabase
            .from('users')
            .select('id')
            .eq('cedula', cedula)
            .single();

        if (existingCedula) {
            return res.status(400).json({ error: 'La cédula ya está registrada' });
        }

        // 4. Obtener role_id para 'patient'
        const { data: roleData } = await supabase
            .from('roles')
            .select('id')
            .eq('name', 'patient')
            .single();

        if (!roleData) {
            return res.status(500).json({ error: 'Error al obtener el rol de paciente' });
        }

        // 5. Hashear contraseña
        const password_hash = await bcrypt.hash(password, 10);

        // 6. Crear usuario en la tabla users
        const { data: newUser, error: userError } = await supabase
            .from('users')
            .insert([
                {
                    email,
                    password_hash,
                    role_id: roleData.id,
                    first_name,
                    last_name,
                    cedula,
                    phone_number: phone_number || null
                }
            ])
            .select()
            .single();

        if (userError) {
            console.error('Error al crear usuario:', userError);
            throw userError;
        }

        // 7. Crear registro en la tabla patients con datos básicos
        const { error: patientError } = await supabase
            .from('patients')
            .insert([{
                user_id: newUser.id,
                date_of_birth
            }]);

        if (patientError) {
            // Si falla la creación del paciente, eliminar el usuario creado
            await supabase.from('users').delete().eq('id', newUser.id);
            console.error('Error al crear registro de paciente:', patientError);
            throw patientError;
        }

        res.status(201).json({ 
            message: 'Paciente registrado correctamente',
            user: {
                id: newUser.id,
                email: newUser.email,
                first_name: newUser.first_name,
                last_name: newUser.last_name
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error al registrar el paciente. Por favor intente nuevamente.' });
    }
});

module.exports = router;