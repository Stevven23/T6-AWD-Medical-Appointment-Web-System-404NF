const supabase = require('../database');

const doctorController = {
    // Crear un nuevo doctor
    createDoctor: async (req, res) => {
        try {
            const { 
                cedula, 
                name, 
                phone, 
                email, 
                specialty, 
                contract_type, 
                status,
                schedule_id 
            } = req.body;

            // Validar cédula ecuatoriana
            if (!validateCedula(cedula)) {
                return res.status(400).json({ error: 'Cédula ecuatoriana inválida' });
            }

            // Verificar si la cédula ya existe
            const { data: existingDoctor } = await supabase
                .from('doctors')
                .select('id')
                .eq('cedula', cedula)
                .single();

            if (existingDoctor) {
                return res.status(400).json({ error: 'La cédula ya está registrada' });
            }

            // Insertar doctor
            const { data: doctor, error: doctorError } = await supabase
                .from('doctors')
                .insert([{
                    cedula,
                    name,
                    phone,
                    email,
                    specialty,
                    contract_type,
                    status: status || 'active'
                }])
                .select()
                .single();

            if (doctorError) throw doctorError;

            // Si hay un schedule_id, crear la relación
            if (schedule_id) {
                const { error: scheduleError } = await supabase
                    .from('doctor_schedules')
                    .insert([{
                        doctor_id: doctor.id,
                        schedule_id: schedule_id
                    }]);

                if (scheduleError) throw scheduleError;
            }

            // Obtener el doctor completo con sus horarios
            const { data: fullDoctor, error: fetchError } = await supabase
                .from('doctors')
            .select(`
                *,
                doctor_schedules (*),
                user:users (
                    first_name,
                    last_name
                )
            `)
                .eq('id', doctor.id)
                .single();

            if (fetchError) throw fetchError;

            res.status(201).json(fullDoctor);
        } catch (error) {
            console.error('Error creating doctor:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener todos los doctores
    getAllDoctors: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('doctors')
            .select(`
                *,
                doctor_schedules (*),
                user:users (
                    first_name,
                    last_name
                )
            `)
                .order('id', { ascending: true });

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
                doctor_schedules (*),
                user:users (
                    first_name,
                    last_name
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
                cedula, 
                name, 
                phone, 
                email, 
                specialty, 
                contract_type, 
                status,
                schedule_id 
            } = req.body;

            // Validar cédula si se está actualizando
            if (cedula && !validateCedula(cedula)) {
                return res.status(400).json({ error: 'Cédula ecuatoriana inválida' });
            }

            // Verificar si el doctor existe
            const { data: existingDoctor } = await supabase
                .from('doctors')
                .select('id')
                .eq('id', id)
                .single();

            if (!existingDoctor) {
                return res.status(404).json({ error: 'Doctor no encontrado' });
            }

            // Actualizar datos del doctor
            const { data: doctor, error: doctorError } = await supabase
                .from('doctors')
                .update({
                    cedula,
                    name,
                    phone,
                    email,
                    specialty,
                    contract_type,
                    status
                })
                .eq('id', id)
                .select()
                .single();

            if (doctorError) throw doctorError;

            // Actualizar horario si es necesario
            if (schedule_id) {
                // Eliminar horarios antiguos
                await supabase
                    .from('doctor_schedules')
                    .delete()
                    .eq('doctor_id', id);

                // Insertar nuevo horario
                const { error: scheduleError } = await supabase
                    .from('doctor_schedules')
                    .insert([{
                        doctor_id: id,
                        schedule_id: schedule_id
                    }]);

                if (scheduleError) throw scheduleError;
            }

            // Obtener el doctor actualizado con sus horarios
            const { data: fullDoctor, error: fetchError } = await supabase
                .from('doctors')
            .select(`
                *,
                doctor_schedules (*),
                user:users (
                    first_name,
                    last_name
                )
            `)
                .eq('id', id)
                .single();

            if (fetchError) throw fetchError;

            res.json(fullDoctor);
        } catch (error) {
            console.error('Error updating doctor:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Eliminar un doctor
    deleteDoctor: async (req, res) => {
        try {
            const { id } = req.params;

            // Verificar si el doctor existe
            const { data: existingDoctor } = await supabase
                .from('doctors')
                .select('id, name')
                .eq('id', id)
                .single();

            if (!existingDoctor) {
                return res.status(404).json({ error: 'Doctor no encontrado' });
            }

            // Verificar si tiene citas pendientes
            const { data: appointments } = await supabase
                .from('appointments')
                .select('id')
                .eq('doctor_id', id)
                .in('status', ['pending', 'confirmed']);

            if (appointments && appointments.length > 0) {
                return res.status(400).json({ 
                    error: 'No se puede eliminar el doctor porque tiene citas pendientes o confirmadas' 
                });
            }

            // Eliminar relaciones en doctors_schedule
            const { error: scheduleError } = await supabase
                .from('doctor_schedules')
                .delete()
                .eq('doctor_id', id);

            if (scheduleError) throw scheduleError;

            // Eliminar el doctor
            const { error: doctorError } = await supabase
                .from('doctors')
                .delete()
                .eq('id', id);

            if (doctorError) throw doctorError;

            res.json({ 
                message: 'Doctor eliminado exitosamente',
                deleted: existingDoctor 
            });
        } catch (error) {
            console.error('Error deleting doctor:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Filtrar doctores
    filterDoctors: async (req, res) => {
        try {
            const { specialty, status, contract_type, search } = req.query;

            let query = supabase
                .from('doctors')
            .select(`
                *,
                doctor_schedules (*),
                user:users (
                    first_name,
                    last_name
                )
            `);

            // Aplicar filtros
            if (specialty) {
                query = query.eq('specialty', specialty);
            }
            if (status) {
                query = query.eq('status', status);
            }
            if (contract_type) {
                query = query.eq('contract_type', contract_type);
            }
            if (search) {
                // Buscar en nombre, cédula o ID
                const searchNumber = parseInt(search);
                if (!isNaN(searchNumber)) {
                    query = query.or(`name.ilike.%${search}%,cedula.ilike.%${search}%,id.eq.${searchNumber}`);
                } else {
                    query = query.or(`name.ilike.%${search}%,cedula.ilike.%${search}%`);
                }
            }

            const { data, error } = await query.order('id', { ascending: true });

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
            const { specialty } = req.params;

            const { data, error } = await supabase
                .from('doctors')
            .select(`
                *,
                doctor_schedules (*),
                user:users (
                    first_name,
                    last_name
                )
            `)
                .eq('specialty', specialty)
                .eq('status', 'active')
                .order('name', { ascending: true });

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
                .select('status, created_at, specialty');

            if (error) throw error;

            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const stats = {
                total: doctors.length,
                active: doctors.filter(d => d.status === 'active').length,
                inactive: doctors.filter(d => d.status === 'inactive').length,
                vacation: doctors.filter(d => d.status === 'vacation').length,
                newThisMonth: doctors.filter(d => {
                    const created = new Date(d.created_at);
                    return created >= firstDayOfMonth;
                }).length,
                bySpecialty: doctors.reduce((acc, doctor) => {
                    acc[doctor.specialty] = (acc[doctor.specialty] || 0) + 1;
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
            const { status } = req.body;

            // Validar estado
            const validStatuses = ['active', 'inactive', 'vacation'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ 
                    error: 'Estado inválido. Debe ser: active, inactive o vacation' 
                });
            }

            const { data, error } = await supabase
                .from('doctors')
                .update({ status })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            if (!data) {
                return res.status(404).json({ error: 'Doctor no encontrado' });
            }

            res.json(data);
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
                .from('doctors')
            .select(`
                *,
                doctor_schedules (*),
                user:users (
                    first_name,
                    last_name
                )
            `)
                .eq('doctor_id', id);

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
