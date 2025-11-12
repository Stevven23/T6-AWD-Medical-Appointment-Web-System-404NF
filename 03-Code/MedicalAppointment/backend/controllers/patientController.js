const supabase = require('../database');
const bcrypt = require('bcrypt');

const patientController = {
  // Obtener perfil completo del paciente
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;

      // Obtener datos del usuario y paciente
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Obtener datos adicionales del paciente
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Si no existe registro de paciente, crearlo
      if (patientError && patientError.code === 'PGRST116') {
        const { data: newPatient } = await supabase
          .from('patients')
          .insert([{ user_id: userId }])
          .select()
          .single();
        
        return res.json({
          ...userData,
          ...newPatient
        });
      }

      if (patientError) throw patientError;

      // Combinar datos
      res.json({
        ...userData,
        ...patientData
      });

    } catch (error) {
      console.error('Error al obtener perfil:', error);
      res.status(500).json({ error: 'Error al obtener perfil del paciente' });
    }
  },

  // Actualizar perfil del paciente
  updateProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        first_name,
        last_name,
        phone_number,
        date_of_birth,
        gender,
        address,
        city,
        state,
        postal_code,
        country,
        insurance_plan,
        insurance_number,
        emergency_contact_name,
        emergency_contact_phone,
        allergies,
        medical_conditions,
        current_medications
      } = req.body;

      // Actualizar tabla users
      const userUpdates = {};
      if (first_name) userUpdates.first_name = first_name;
      if (last_name) userUpdates.last_name = last_name;
      if (phone_number) userUpdates.phone_number = phone_number;

      if (Object.keys(userUpdates).length > 0) {
        userUpdates.updated_at = new Date().toISOString();
        
        const { error: userError } = await supabase
          .from('users')
          .update(userUpdates)
          .eq('id', userId);

        if (userError) throw userError;
      }

      // Actualizar tabla patients
      const patientUpdates = {};
      if (date_of_birth !== undefined) patientUpdates.date_of_birth = date_of_birth;
      if (gender !== undefined) patientUpdates.gender = gender;
      if (address !== undefined) patientUpdates.address = address;
      if (city !== undefined) patientUpdates.city = city;
      if (state !== undefined) patientUpdates.state = state;
      if (postal_code !== undefined) patientUpdates.postal_code = postal_code;
      if (country !== undefined) patientUpdates.country = country;
      if (insurance_plan !== undefined) patientUpdates.insurance_plan = insurance_plan;
      if (insurance_number !== undefined) patientUpdates.insurance_number = insurance_number;
      if (emergency_contact_name !== undefined) patientUpdates.emergency_contact_name = emergency_contact_name;
      if (emergency_contact_phone !== undefined) patientUpdates.emergency_contact_phone = emergency_contact_phone;
      if (allergies !== undefined) patientUpdates.allergies = allergies;
      if (medical_conditions !== undefined) patientUpdates.medical_conditions = medical_conditions;
      if (current_medications !== undefined) patientUpdates.current_medications = current_medications;

      if (Object.keys(patientUpdates).length > 0) {
        patientUpdates.updated_at = new Date().toISOString();

        const { error: patientError } = await supabase
          .from('patients')
          .update(patientUpdates)
          .eq('user_id', userId);

        if (patientError) throw patientError;
      }

      // Obtener perfil actualizado
      const { data: updatedUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: updatedPatient } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', userId)
        .single();

      res.json({
        message: 'Perfil actualizado exitosamente',
        profile: {
          ...updatedUser,
          ...updatedPatient
        }
      });

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      res.status(500).json({ error: 'Error al actualizar perfil' });
    }
  },

  // Cambiar contraseña
  changePassword: async (req, res) => {
    try {
      const userId = req.user.id;
      const { current_password, new_password } = req.body;

      if (!current_password || !new_password) {
        return res.status(400).json({ error: 'Faltan datos requeridos' });
      }

      if (new_password.length < 8) {
        return res.status(400).json({ 
          error: 'La nueva contraseña debe tener al menos 8 caracteres' 
        });
      }

      // Obtener hash actual
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (userError) throw userError;

      // Verificar contraseña actual
      const validPassword = await bcrypt.compare(current_password, user.password_hash);
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Contraseña actual incorrecta' });
      }

      // Generar nuevo hash
      const newPasswordHash = await bcrypt.hash(new_password, 10);

      // Actualizar contraseña
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      res.json({ message: 'Contraseña actualizada exitosamente' });

    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({ error: 'Error al cambiar contraseña' });
    }
  }
};

module.exports = patientController;
