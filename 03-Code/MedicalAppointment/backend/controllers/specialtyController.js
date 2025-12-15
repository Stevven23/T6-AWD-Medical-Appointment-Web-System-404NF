const supabase = require('../database');

const specialtyController = {
    // Crear una nueva especialidad
    createSpecialty: async (req, res) => {
        try {
            const { name, description } = req.body;

            if (!name || name.trim() === '') {
                return res.status(400).json({ error: 'El nombre de la especialidad es requerido' });
            }

            const { data: existingSpecialty, error: existingError } = await supabase
                .from('specialties')
                .select('id')
                .ilike('name', name.trim())
                .maybeSingle();

            if (existingError) throw existingError;
            if (existingSpecialty) {
                return res.status(400).json({ error: 'La especialidad ya está registrada' });
            }

            const { data: specialty, error: specialtyError } = await supabase
                .from('specialties')
                .insert([{
                    name: name.trim(),
                    description: description || null
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

    // Obtener especialidades activas (todas, ya que no hay campo status)
    getActiveSpecialties: async (req, res) => {
        try {
            const { data, error } = await supabase
                .from('specialties')
                .select('*')
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

            if (error) {
                if (error.code === 'PGRST116' || error.message?.includes('Result contains no rows')) {
                    return res.status(404).json({ error: 'Especialidad no encontrada' });
                }
                throw error;
            }

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

            if (specialtyError) {
                if (specialtyError.code === 'PGRST116' || specialtyError.message?.includes('Result contains no rows')) {
                    return res.status(404).json({ error: 'Especialidad no encontrada' });
                }
                throw specialtyError;
            }
            if (!specialty) {
                return res.status(404).json({ error: 'Especialidad no encontrada' });
            }


            const { data: doctors, error: doctorsError } = await supabase
                .from('doctors')
                .select('id, user_id, professional_id, bio, active')
                .eq('specialty_id', id)
                .order('created_at', { ascending: false });

            if (doctorsError) {
                console.warn('Warning: error fetching doctors for specialty', doctorsError);
            }

            res.json({
                ...specialty,
                doctors: doctors || [],
                doctorCount: doctors?.length || 0
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
            const { name, description } = req.body;

            const { data: existingSpecialty, error: existingError } = await supabase
                .from('specialties')
                .select('id')
                .eq('id', id)
                .single();

            if (existingError) {
                if (existingError.code === 'PGRST116' || existingError.message?.includes('Result contains no rows')) {
                    return res.status(404).json({ error: 'Especialidad no encontrada' });
                }
                throw existingError;
            }

            if (!existingSpecialty) {
                return res.status(404).json({ error: 'Especialidad no encontrada' });
            }

            if (name !== undefined) {
                if (typeof name !== 'string' || name.trim() === '') {
                    return res.status(400).json({ error: 'El nombre de la especialidad no puede estar vacío' });
                }
                const { data: duplicateSpecialty, error: dupError } = await supabase
                    .from('specialties')
                    .select('id')
                    .ilike('name', name.trim())
                    .neq('id', id)
                    .maybeSingle();

                if (dupError) throw dupError;

                if (duplicateSpecialty) {
                    return res.status(400).json({ error: 'Ya existe otra especialidad con ese nombre' });
                }
            }

            const updateData = {};
            if (name !== undefined) updateData.name = name.trim();
            if (description !== undefined) updateData.description = description || null;


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

            const { data: existingSpecialty, error: existingError } = await supabase
                .from('specialties')
                .select('id, name')
                .eq('id', id)
                .single();

            if (existingError) {
                if (existingError.code === 'PGRST116' || existingError.message?.includes('Result contains no rows')) {
                    return res.status(404).json({ error: 'Especialidad no encontrada' });
                }
                throw existingError;
            }

            if (!existingSpecialty) {
                return res.status(404).json({ error: 'Especialidad no encontrada' });
            }

            const { data: doctors, error: doctorsError } = await supabase
                .from('doctors')
                .select('id')
                .eq('specialty_id', id);

            if (doctorsError) throw doctorsError;

            if (doctors && doctors.length > 0) {
                return res.status(400).json({ 
                    error: 'No se puede eliminar la especialidad porque tiene doctores asociados',
                    doctorsCount: doctors.length
                });
            }

            const { data: deleted, error: specialtyError } = await supabase
                .from('specialties')
                .delete()
                .eq('id', id)
                .select()
                .single();

            if (specialtyError) throw specialtyError;

            res.json({ 
                message: 'Especialidad eliminada exitosamente',
                deleted: deleted || existingSpecialty
            });
        } catch (error) {
            console.error('Error deleting specialty:', error);
            res.status(400).json({ error: error.message });
        }
    },

    // Filtrar especialidades
    filterSpecialties: async (req, res) => {
        try {
            const { search } = req.query;

            let query = supabase
                .from('specialties')
                .select('*');

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
            console.log('Iniciando getSpecialtyStats...');
            
            // Obtener especialidades (sin created_at porque no existe en el schema)
            const { data: specialties, error: specialtiesError } = await supabase
                .from('specialties')
                .select('id, name, description');

            if (specialtiesError) {
                console.error('Error fetching specialties:', specialtiesError);
                return res.status(500).json({ 
                    error: 'Error al obtener especialidades', 
                    details: specialtiesError.message 
                });
            }

            console.log('Especialidades obtenidas:', specialties?.length);

            // Obtener doctores - intentar con manejo de error
            let doctors = [];
            try {
                const { data: doctorsData, error: doctorsError } = await supabase
                    .from('doctors')
                    .select('specialty_id, active');

                if (doctorsError) {
                    console.warn('Error fetching doctors:', doctorsError);
                    // Continuar sin doctores si la tabla no existe o está vacía
                } else {
                    doctors = doctorsData || [];
                }
            } catch (docError) {
                console.warn('Error al consultar doctors:', docError);
                // Continuar con array vacío
            }

            console.log('Doctores obtenidos:', doctors.length);

            // Agrupar doctores por especialidad
            const doctorsBySpecialty = doctors.reduce((acc, doctor) => {
                if (doctor.specialty_id) {
                    if (!acc[doctor.specialty_id]) {
                        acc[doctor.specialty_id] = { total: 0, active: 0 };
                    }
                    acc[doctor.specialty_id].total++;
                    if (doctor.active === true) {
                        acc[doctor.specialty_id].active++;
                    }
                }
                return acc;
            }, {});

            // Calcular estadísticas (sin newThisMonth ya que no hay created_at)
            const stats = {
                total: specialties?.length || 0,
                active: specialties?.length || 0, // Todas son activas
                newThisMonth: 0, // No podemos calcularlo sin created_at
                withDoctors: Object.keys(doctorsBySpecialty).length,
                withoutDoctors: (specialties?.length || 0) - Object.keys(doctorsBySpecialty).length,
                specialtyDetails: (specialties || []).map(specialty => ({
                    id: specialty.id,
                    name: specialty.name,
                    totalDoctors: doctorsBySpecialty[specialty.id]?.total || 0,
                    activeDoctors: doctorsBySpecialty[specialty.id]?.active || 0
                })).sort((a, b) => b.totalDoctors - a.totalDoctors)
            };

            console.log('Stats calculadas:', stats);
            res.json(stats);
        } catch (error) {
            console.error('Error general en getSpecialtyStats:', error);
            res.status(500).json({ 
                error: 'Error al obtener estadísticas', 
                details: error.message,
                stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    },

    // Actualizar estado (dummy function ya que no hay campo status)
    updateSpecialtyStatus: async (req, res) => {
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
            console.error('Error updating specialty status:', error);
            res.status(400).json({ error: error.message });
        }
    }
};

module.exports = specialtyController;