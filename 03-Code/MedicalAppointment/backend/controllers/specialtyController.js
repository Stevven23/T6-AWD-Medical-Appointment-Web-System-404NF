const supabase = require('../database');

const specialtyController = {
    // Crear una nueva especialidad
    createSpecialty: async (req, res) => {
        try {
            const { 
                name, 
                description, 
                status 
            } = req.body;

            // Validar que el nombre no esté vacío
            if (!name || name.trim() === '') {
                return res.status(400).json({ error: 'El nombre de la especialidad es requerido' });
            }

            // Verificar si la especialidad ya existe (ignorando mayúsculas/minúsculas)
            const { data: existingSpecialty } = await supabase
                .from('specialties')
                .select('id')
                .ilike('name', name.trim())
                .single();

            if (existingSpecialty) {
                return res.status(400).json({ error: 'La especialidad ya está registrada' });
            }

            // Insertar especialidad
            const { data: specialty, error: specialtyError } = await supabase
                .from('specialties')
                .insert([{
                    name: name.trim(),
                    description: description || null,
                    status: status || 'active'
                }])
                .select()
                .single();

            if (specialtyError) throw specialtyError;

            res.status(201).json(specialty);
        } catch (error) {
            console.error('Error creating specialty:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener todas las especialidades
    getAllSpecialties: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('specialties')
                .select('*')
                .order('name', { ascending: true });

            if (error) throw error;

            res.json(data);
        } catch (error) {
            console.error('Error fetching specialties:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener especialidades activas
    getActiveSpecialties: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('specialties')
                .select('*')
                .eq('status', 'active')
                .order('name', { ascending: true });

            if (error) throw error;

            res.json(data);
        } catch (error) {
            console.error('Error fetching active specialties:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener una especialidad por ID
    getSpecialtyById: async (req, res) => {
        try {
            const { id } = req.params;

            const { data, error } = await supabase
                .from('specialties')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            if (!data) {
                return res.status(404).json({ error: 'Especialidad no encontrada' });
            }

            res.json(data);
        } catch (error) {
            console.error('Error fetching specialty:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener especialidad con sus doctores
    getSpecialtyWithDoctors: async (req, res) => {
        try {
            const { id } = req.params;

            const { data: specialty, error: specialtyError } = await supabase
                .from('specialties')
                .select('*')
                .eq('id', id)
                .single();

            if (specialtyError) throw specialtyError;

            if (!specialty) {
                return res.status(404).json({ error: 'Especialidad no encontrada' });
            }

            // Obtener doctores de esta especialidad
            const { data: doctors, error: doctorsError } = await supabase
                .from('doctors')
                .select(`
                    id,
                    cedula,
                    name,
                    phone,
                    email,
                    contract_type,
                    status
                `)
                .eq('specialty_id', id)
                .order('name', { ascending: true });

            if (doctorsError) throw doctorsError;

            res.json({
                ...specialty,
                doctors: doctors || []
            });
        } catch (error) {
            console.error('Error fetching specialty with doctors:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Actualizar una especialidad
    updateSpecialty: async (req, res) => {
        try {
            const { id } = req.params;
            const { 
                name, 
                description, 
                status 
            } = req.body;

            // Verificar si la especialidad existe
            const { data: existingSpecialty } = await supabase
                .from('specialties')
                .select('id')
                .eq('id', id)
                .single();

            if (!existingSpecialty) {
                return res.status(404).json({ error: 'Especialidad no encontrada' });
            }

            // Si se está actualizando el nombre, verificar que no exista otra con ese nombre
            if (name && name.trim() !== '') {
                const { data: duplicateSpecialty } = await supabase
                    .from('specialties')
                    .select('id')
                    .ilike('name', name.trim())
                    .neq('id', id)
                    .single();

                if (duplicateSpecialty) {
                    return res.status(400).json({ error: 'Ya existe otra especialidad con ese nombre' });
                }
            }

            // Preparar datos para actualizar
            const updateData = {};
            if (name !== undefined) updateData.name = name.trim();
            if (description !== undefined) updateData.description = description || null;
            if (status !== undefined) updateData.status = status;

            // Actualizar especialidad
            const { data: specialty, error: specialtyError } = await supabase
                .from('specialties')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (specialtyError) throw specialtyError;

            res.json(specialty);
        } catch (error) {
            console.error('Error updating specialty:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Eliminar una especialidad
    deleteSpecialty: async (req, res) => {
        try {
            const { id } = req.params;

            // Verificar si la especialidad existe
            const { data: existingSpecialty } = await supabase
                .from('specialties')
                .select('id, name')
                .eq('id', id)
                .single();

            if (!existingSpecialty) {
                return res.status(404).json({ error: 'Especialidad no encontrada' });
            }

            // Verificar si hay doctores asociados a esta especialidad
            const { data: doctors } = await supabase
                .from('doctors')
                .select('id')
                .eq('specialty_id', id);

            if (doctors && doctors.length > 0) {
                return res.status(400).json({ 
                    error: 'No se puede eliminar la especialidad porque tiene doctores asociados',
                    doctorsCount: doctors.length
                });
            }

            // Eliminar la especialidad
            const { error: specialtyError } = await supabase
                .from('specialties')
                .delete()
                .eq('id', id);

            if (specialtyError) throw specialtyError;

            res.json({ 
                message: 'Especialidad eliminada exitosamente',
                deleted: existingSpecialty 
            });
        } catch (error) {
            console.error('Error deleting specialty:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Filtrar especialidades
    filterSpecialties: async (req, res) => {
        try {
            const { status, search } = req.query;

            let query = supabase
                .from('specialties')
                .select('*');

            // Aplicar filtros
            if (status) {
                query = query.eq('status', status);
            }
            if (search) {
                query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
            }

            const { data, error } = await query.order('name', { ascending: true });

            if (error) throw error;

            res.json(data);
        } catch (error) {
            console.error('Error filtering specialties:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Obtener estadísticas de especialidades
    getSpecialtyStats: async (req, res) => {
        try {
            const { data: specialties, error: specialtiesError } = await supabase
                .from('specialties')
                .select('id, name, status, created_at');

            if (specialtiesError) throw specialtiesError;

            // Obtener conteo de doctores por especialidad
            const { data: doctors, error: doctorsError } = await supabase
                .from('doctors')
                .select('specialty_id, status');

            if (doctorsError) throw doctorsError;

            const doctorsBySpecialty = doctors.reduce((acc, doctor) => {
                if (!acc[doctor.specialty_id]) {
                    acc[doctor.specialty_id] = { total: 0, active: 0 };
                }
                acc[doctor.specialty_id].total++;
                if (doctor.status === 'active') {
                    acc[doctor.specialty_id].active++;
                }
                return acc;
            }, {});

            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            const stats = {
                total: specialties.length,
                active: specialties.filter(s => s.status === 'active').length,
                inactive: specialties.filter(s => s.status === 'inactive').length,
                newThisMonth: specialties.filter(s => {
                    const created = new Date(s.created_at);
                    return created >= firstDayOfMonth;
                }).length,
                withDoctors: Object.keys(doctorsBySpecialty).length,
                withoutDoctors: specialties.length - Object.keys(doctorsBySpecialty).length,
                specialtyDetails: specialties.map(specialty => ({
                    id: specialty.id,
                    name: specialty.name,
                    status: specialty.status,
                    totalDoctors: doctorsBySpecialty[specialty.id]?.total || 0,
                    activeDoctors: doctorsBySpecialty[specialty.id]?.active || 0
                })).sort((a, b) => b.totalDoctors - a.totalDoctors)
            };

            res.json(stats);
        } catch (error) {
            console.error('Error fetching specialty stats:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Actualizar estado de una especialidad
    updateSpecialtyStatus: async (req, res) => {
        try {
            const { id } = req.params;
            const { status } = req.body;

            // Validar estado
            const validStatuses = ['active', 'inactive'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({ 
                    error: 'Estado inválido. Debe ser: active o inactive' 
                });
            }

            const { data, error } = await supabase
                .from('specialties')
                .update({ status })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            if (!data) {
                return res.status(404).json({ error: 'Especialidad no encontrada' });
            }

            res.json(data);
        } catch (error) {
            console.error('Error updating specialty status:', error);
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = specialtyController;