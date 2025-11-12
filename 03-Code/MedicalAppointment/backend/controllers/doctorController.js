const supabase = require('../database');

const doctorController = {
  // Obtener todas las especialidades
  getSpecialties: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('specialties')
        .select('id, name, description')
        .order('name');

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error('Error al obtener especialidades:', error);
      res.status(500).json({ error: 'Error al obtener especialidades' });
    }
  },

  // Obtener doctores (con filtro opcional por especialidad)
  getDoctors: async (req, res) => {
    try {
      const { specialty_id } = req.query;

      let query = supabase
        .from('doctors')
        .select(`
          id,
          professional_id,
          bio,
          active,
          users!inner (
            id,
            first_name,
            last_name,
            email,
            phone_number
          ),
          specialties (
            id,
            name,
            description
          )
        `)
        .eq('active', true)
        .eq('users.is_active', true);

      // Filtrar por especialidad si se proporciona
      if (specialty_id) {
        query = query.eq('specialty_id', specialty_id);
      }

      const { data, error } = await query.order('users(first_name)');

      if (error) throw error;

      // Transformar datos para formato más limpio
      const doctors = data.map(doctor => ({
        id: doctor.id,
        professional_id: doctor.professional_id,
        bio: doctor.bio,
        first_name: doctor.users.first_name,
        last_name: doctor.users.last_name,
        email: doctor.users.email,
        phone_number: doctor.users.phone_number,
        specialty_id: doctor.specialties?.id,
        specialty_name: doctor.specialties?.name
      }));

      res.json(doctors);

    } catch (error) {
      console.error('Error al obtener doctores:', error);
      res.status(500).json({ error: 'Error al obtener doctores' });
    }
  },

  // Obtener detalle de un doctor
  getDoctorById: async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('doctors')
        .select(`
          id,
          professional_id,
          bio,
          active,
          users!inner (
            id,
            first_name,
            last_name,
            email,
            phone_number
          ),
          specialties (
            id,
            name,
            description
          )
        `)
        .eq('id', id)
        .eq('active', true)
        .single();

      if (error) throw error;

      if (!data) {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }

      // Formatear respuesta
      const doctor = {
        id: data.id,
        professional_id: data.professional_id,
        bio: data.bio,
        first_name: data.users.first_name,
        last_name: data.users.last_name,
        email: data.users.email,
        phone_number: data.users.phone_number,
        specialty_id: data.specialties?.id,
        specialty_name: data.specialties?.name,
        specialty_description: data.specialties?.description
      };

      res.json(doctor);

    } catch (error) {
      console.error('Error al obtener doctor:', error);
      res.status(500).json({ error: 'Error al obtener información del doctor' });
    }
  }
};

module.exports = doctorController;
