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

        // 5. Enviar respuesta
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

// Registro (ejemplo básico)
router.post('/register', async (req, res) => {
    try {
        const { email, password, role } = req.body;

        // 1. Verificar si el usuario ya existe
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            return res.status(400).json({ error: 'Email ya registrado' });
        }

        // 2. Obtener role_id
        const { data: roleData } = await supabase
            .from('roles')
            .select('id')
            .eq('name', role)
            .single();

        if (!roleData) {
            return res.status(400).json({ error: 'Rol no válido' });
        }

        // 3. Hashear contraseña
        const password_hash = await bcrypt.hash(password, 10);

        // 4. Crear usuario
        const { data: newUser, error } = await supabase
            .from('users')
            .insert([
                {
                    email,
                    password_hash,
                    role_id: roleData.id
                }
            ])
            .select()
            .single();

        if (error) {
            throw error;
        }

        // 5. Si es doctor o paciente, crear registro adicional
        if (role === 'doctor') {
            await supabase.from('doctors').insert([{
                user_id: newUser.id
            }]);
        }

        res.status(201).json({ message: 'Usuario registrado correctamente' });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

module.exports = router;