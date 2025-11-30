const express = require('express');
const router = express.Router();
const supabase = require('../database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

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