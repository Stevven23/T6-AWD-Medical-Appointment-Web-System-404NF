const supabase = require('../database');
const bcrypt = require('bcrypt');

const doctorController = {
    // Crear un nuevo doctor
    createDoctor: async (req, res) => {
        try {
            const { 
                email, 
                password,
                first_name, 
                last_name, 
                phone_number,
                cedula,
                professional_id,
                specialty_id,
                bio
            } = req.body;

            // Validar campos requeridos
            if (!email || !password || !first_name || !last_name) {
                return res.status(400).json({ 
                    error: 'Email, contraseña, nombre y apellido son requeridos' 
                });
            }

            // Validar cédula ecuatoriana si se proporciona
            if (cedula && !validateCedula(cedula)) {
                return res.status(400).json({ error: 'Cédula ecuatoriana inválida' });
            }

            // Verificar si el email ya existe
            const { data: existingUser } = await supabase
                .from('users')
                .select('id')
                .eq('email', email)
                .single();

            if (existingUser) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }

            // Obtener role_id de 'doctor'
            const { data: role, error: roleError } = await supabase
                .from('roles')
                .select('id')
                .eq('code', 'doctor')
                .single();

            if (roleError || !role) {
                return res.status(500).json({ error: 'Role doctor no encontrado en la base de datos' });
            }

            // Hash de contraseña
            const passwordHash = await bcrypt.hash(password, 10);

            // Crear usuario
            const { data: user, error: userError } = await supabase
                .from('users')
                .insert([{
                    email,
                    password_hash: passwordHash,
                    role_id: role.id,
                    first_name,
                    last_name,
                    phone_number: phone_number || null,
                    cedula: cedula || null,
                    is_active: true,
                    is_email_verified: false
                }])
                .select()
                .single();

            if (userError) throw userError;

            // Crear doctor
            const { data: doctor, error: doctorError } = await supabase
                .from('doctors')
                .insert([{
                    user_id: user.id,
                    professional_id: professional_id || null,
                    specialty_id: specialty_id || null,
                    bio: bio || null,
                    active: true
                }])
                .select(`
                    *,
                    users!inner (
                        id,
                        email,
                        first_name,
                        last_name,
                        phone_number,
                        cedula
                    ),
                    specialties (
                        id,
                        name,
                        description
                    )
                `)
                .single();

            if (doctorError) throw doctorError;

            res.status(201).json({
                message: 'Doctor creado exitosamente',
                doctor
            });

        } catch (error) {
            console.error('Error creating doctor:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener todos los doctores (o filtrados por especialidad)
    getAllDoctors: async (req, res) => {
        try {
            const { specialty_id } = req.query;

            let query = supabase
                .from('doctors')
                .select(`
                    *,
                    users!inner (
                        id,
                        email,
                        first_name,
                        last_name,
                        phone_number,
                        cedula
                    ),
                    specialties (
                        id,
                        name,
                        description
                    ),
                    doctor_schedules (
                        id,
                        day_of_week,
                        start_time,
                        end_time,
                        is_working_day
                    )
                `)
                .eq('active', true);

            // Filtrar por especialidad si se proporciona
            if (specialty_id) {
                query = query.eq('specialty_id', specialty_id);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            res.json(data);
        } catch (error) {
            console.error('Error fetching doctors:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener un doctor por ID
    getDoctorById: async (req, res) => {
        try {
            const { id } = req.params;

            const { data, error } = await supabase
                .from('doctors')
                .select(`
                    *,
                    users!inner (
                        id,
                        email,
                        first_name,
                        last_name,
                        phone_number,
                        cedula
                    ),
                    specialties (
                        id,
                        name,
                        description
                    ),
                    doctor_schedules (
                        id,
                        day_of_week,
                        start_time,
                        end_time,
                        is_working_day,
                        break_start_time,
                        break_end_time
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            if (!data) {
                return res.status(404).json({ error: 'Doctor no encontrado' });
            }

            res.json(data);
        } catch (error) {
            console.error('Error fetching doctor:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Actualizar un doctor
    updateDoctor: async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                email,
                first_name, 
                last_name, 
                phone_number,
                cedula,
                professional_id,
                specialty_id,
                bio,
                active
            } = req.body;

            // Verificar si el doctor existe
            const { data: existingDoctor } = await supabase
                .from('doctors')
                .select('user_id')
                .eq('id', id)
                .single();

            if (!existingDoctor) {
                return res.status(404).json({ error: 'Doctor no encontrado' });
            }

            // Validar cédula si se está actualizando
            if (cedula && !validateCedula(cedula)) {
                return res.status(400).json({ error: 'Cédula ecuatoriana inválida' });
            }

            // Actualizar datos del usuario
            const userUpdates = {};
            if (email) userUpdates.email = email;
            if (first_name) userUpdates.first_name = first_name;
            if (last_name) userUpdates.last_name = last_name;
            if (phone_number !== undefined) userUpdates.phone_number = phone_number;
            if (cedula !== undefined) userUpdates.cedula = cedula;

            if (Object.keys(userUpdates).length > 0) {
                const { error: userError } = await supabase
                    .from('users')
                    .update(userUpdates)
                    .eq('id', existingDoctor.user_id);

                if (userError) throw userError;
            }

            // Actualizar datos del doctor
            const doctorUpdates = {};
            if (professional_id !== undefined) doctorUpdates.professional_id = professional_id;
            if (specialty_id !== undefined) doctorUpdates.specialty_id = specialty_id;
            if (bio !== undefined) doctorUpdates.bio = bio;
            if (active !== undefined) doctorUpdates.active = active;

            if (Object.keys(doctorUpdates).length > 0) {
                const { error: doctorError } = await supabase
                    .from('doctors')
                    .update(doctorUpdates)
                    .eq('id', id);

                if (doctorError) throw doctorError;
            }

            // Obtener el doctor actualizado
            const { data: updatedDoctor, error: fetchError } = await supabase
                .from('doctors')
                .select(`
                    *,
                    users!inner (
                        id,
                        email,
                        first_name,
                        last_name,
                        phone_number,
                        cedula
                    ),
                    specialties (
                        id,
                        name,
                        description
                    )
                `)
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            res.json({
                message: 'Doctor actualizado exitosamente',
                doctor: updatedDoctor
            });
        } catch (error) {
            console.error('Error updating doctor:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Eliminar un doctor
    deleteDoctor: async (req, res) => {
        try {
            const { id } = req.params;

            // Verificar si el doctor existe y obtener user_id
            const { data: existingDoctor } = await supabase
                .from('doctors')
                .select('id, user_id, users!inner(first_name, last_name)')
                .eq('id', id)
                .single();

            if (!existingDoctor) {
                return res.status(404).json({ error: 'Doctor no encontrado' });
            }

            // Verificar si tiene citas pendientes o futuras
            const futureDate = new Date().toISOString();
            const { data: appointments } = await supabase
                .from('appointments')
                .select('id')
                .eq('doctor_id', id)
                .gte('scheduled_start', futureDate)
                .in('status_id', [1, 2]); // scheduled, confirmed

            if (appointments && appointments.length > 0) {
                return res.status(400).json({ 
                    error: `No se puede eliminar el doctor porque tiene ${appointments.length} cita(s) pendiente(s) o confirmada(s)` 
                });
            }

            // Eliminar horarios del doctor
            await supabase
                .from('doctor_schedules')
                .delete()
                .eq('doctor_id', id);

            // Eliminar el doctor (el CASCADE eliminará el usuario automáticamente)
            const { error: doctorError } = await supabase
                .from('doctors')
                .delete()
                .eq('id', id);

            if (doctorError) throw doctorError;

            res.json({ 
                message: 'Doctor y usuario eliminados exitosamente',
                deleted: {
                    id: existingDoctor.id,
                    name: `${existingDoctor.users.first_name} ${existingDoctor.users.last_name}`
                }
            });
        } catch (error) {
            console.error('Error deleting doctor:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Filtrar doctores
    filterDoctors: async (req, res) => {
        try {
            const { specialty_id, active, search } = req.query;

            let query = supabase
                .from('doctors')
                .select(`
                    *,
                    users!inner (
                        id,
                        email,
                        first_name,
                        last_name,
                        phone_number,
                        cedula
                    ),
                    specialties (
                        id,
                        name,
                        description
                    )
                `);

            // Aplicar filtros
            if (specialty_id) {
                query = query.eq('specialty_id', specialty_id);
            }
            if (active !== undefined) {
                query = query.eq('active', active === 'true');
            }
            if (search) {
                // Buscar en nombre del doctor (usuario)
                query = query.or(`users.first_name.ilike.%${search}%,users.last_name.ilike.%${search}%,users.cedula.ilike.%${search}%`);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            res.json(data);
        } catch (error) {
            console.error('Error filtering doctors:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener doctores por especialidad
    getDoctorsBySpecialty: async (req, res) => {
        try {
            const { specialty_id } = req.params;

            const { data, error } = await supabase
                .from('doctors')
                .select(`
                    *,
                    users!inner (
                        id,
                        email,
                        first_name,
                        last_name,
                        phone_number
                    ),
                    specialties (
                        id,
                        name,
                        description
                    ),
                    doctor_schedules (
                        id,
                        day_of_week,
                        start_time,
                        end_time
                    )
                `)
                .eq('specialty_id', specialty_id)
                .eq('active', true)
                .order('users.first_name', { ascending: true });

            if (error) throw error;

            res.json(data);
        } catch (error) {
            console.error('Error fetching doctors by specialty:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener estadísticas de doctores
    getDoctorStats: async (req, res) => {
        try {
            const { data: doctors, error } = await supabase
                .from('doctors')
                .select('active, created_at, specialty_id, specialties(name)');

            if (error) throw error;

            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const stats = {
                total: doctors.length,
                active: doctors.filter(d => d.active === true).length,
                inactive: doctors.filter(d => d.active === false).length,
                newThisMonth: doctors.filter(d => {
                    const created = new Date(d.created_at);
                    return created >= firstDayOfMonth;
                }).length,
                bySpecialty: doctors.reduce((acc, doctor) => {
                    const specialtyName = doctor.specialties?.name || 'Sin especialidad';
                    acc[specialtyName] = (acc[specialtyName] || 0) + 1;
                    return acc;
                }, {})
            };

            res.json(stats);
        } catch (error) {
            console.error('Error fetching doctor stats:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Actualizar estado de un doctor
    updateDoctorStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { active } = req.body;

            if (typeof active !== 'boolean') {
                return res.status(400).json({ 
                    error: 'El campo active debe ser booleano (true o false)' 
                });
            }

            const { data, error } = await supabase
                .from('doctors')
                .update({ active })
                .eq('id', id)
                .select(`
                    *,
                    users!inner (
                        first_name,
                        last_name,
                        email
                    )
                `)
                .single();

            if (error) throw error;

            if (!data) {
                return res.status(404).json({ error: 'Doctor no encontrado' });
            }

            res.json({
                message: `Doctor ${active ? 'activado' : 'desactivado'} exitosamente`,
                doctor: data
            });
        } catch (error) {
            console.error('Error updating doctor status:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener todas las especialidades únicas
    getSpecialties: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('specialties')
                .select('id, name, description');
            if (error) throw error;
            res.json(data);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener horarios de un doctor
    getDoctorSchedules: async (req, res) => {
        try {
            const { id } = req.params;

            const { data, error } = await supabase
                .from('doctor_schedules')
                .select(`
                    *,
                    doctors!inner (
                        id,
                        users!inner (
                            first_name,
                            last_name
                        )
                    )
                `)
                .eq('doctor_id', id)
                .order('day_of_week', { ascending: true });

            if (error) throw error;

            res.json(data);
        } catch (error) {
            console.error('Error fetching doctor schedules:', error);
            res.status(400).json({ error: error.message });
        }
    }
};

// Función auxiliar para validar cédula ecuatoriana
function validateCedula(cedula) {
    if (!cedula || cedula.length !== 10) return false;
    
    const digits = cedula.split('').map(Number);
    const province = parseInt(cedula.substring(0, 2));
    
    if (province < 1 || province > 24) return false;
    
    const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
        let value = digits[i] * coefficients[i];
        if (value > 9) value -= 9;
        sum += value;
    }
    
    const verifier = sum % 10 === 0 ? 0 : 10 - (sum % 10);
    return verifier === digits[9];
}

module.exports = doctorController;
