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

          // 1. Campos permitidos en la tabla 'users'
          const userFields = ['first_name', 'last_name', 'phone_number'];
          
          // 2. Campos permitidos en la tabla 'patients' (TODOS los de tu formulario)
          const patientFields = [
              'date_of_birth', 'gender', 'address', 'city', 'state',
              'postal_code', 'country', 'insurance_plan', 'insurance_number',
              'emergency_contact_name', 'emergency_contact_phone',
              'allergies', 'medical_conditions', 'current_medications',
              'blood_type', 'height', 'weight', 'home_phone', 'emergency_contact_relation'
          ];

          // 3. Crear objetos de actualización limpios
          const userUpdates = {};
          const patientUpdates = {};

          // Llenar userUpdates
          for (const field of userFields) {
              if (req.body[field] !== undefined) {
                  userUpdates[field] = req.body[field] === '' ? null : req.body[field];
              }
          }

          // Llenar patientUpdates
          for (const field of patientFields) {
              if (req.body[field] !== undefined) {
                  patientUpdates[field] = req.body[field] === '' ? null : req.body[field];
              }
          }

          // 4. Ejecutar actualizaciones
          if (Object.keys(userUpdates).length > 0) {
              userUpdates.updated_at = new Date().toISOString();
              const { error: userError } = await supabase
                  .from('users')
                  .update(userUpdates)
                  .eq('id', userId);
              if (userError) throw userError;
          }

          if (Object.keys(patientUpdates).length > 0) {
              patientUpdates.updated_at = new Date().toISOString();
              const { error: patientError } = await supabase
                  .from('patients')
                  .update(patientUpdates) // <-- Ahora SÍ incluye blood_type, etc.
                  .eq('user_id', userId);
              if (patientError) throw patientError;
          }

          // 5. Devolver respuesta (usando tu patrón original, que es más seguro)
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
              // El frontend espera un objeto 'profile' combinado
              profile: { 
                  ...updatedUser,
                  ...updatedPatient
              }
          });

      } catch (error) {
          console.error('Error al actualizar perfil:', error);
          // Devolvemos el mensaje de error real
          res.status(500).json({ error: error.message || 'Error al actualizar perfil' });
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
  },

  // Completar perfil para usuarios de Google OAuth
  completeProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      const { cedula, date_of_birth, phone_number, gender, address } = req.body;

      // Validaciones
      if (!cedula || !date_of_birth) {
        return res.status(400).json({ 
          error: 'Cédula y fecha de nacimiento son obligatorios' 
        });
      }

      // Verificar si la cédula ya existe en otro usuario
      const { data: existingCedula } = await supabase
        .from('users')
        .select('id')
        .eq('cedula', cedula)
        .neq('id', userId)
        .single();

      if (existingCedula) {
        return res.status(400).json({ error: 'La cédula ya está registrada' });
      }

      // Actualizar tabla users (solo cedula y phone_number)
      const { error: userError } = await supabase
        .from('users')
        .update({
          cedula,
          phone_number: phone_number || null
        })
        .eq('id', userId);

      if (userError) {
        console.error('Error actualizando users:', userError);
        throw userError;
      }

      // Actualizar tabla patients (date_of_birth, gender y address)
      const { error: patientError } = await supabase
        .from('patients')
        .update({
          date_of_birth,
          gender: gender || null,
          address: address || null
        })
        .eq('user_id', userId);

      if (patientError) {
        console.error('Error actualizando patients:', patientError);
        throw patientError;
      }

      // Obtener datos actualizados
      const { data: updatedUser } = await supabase
        .from('users')
        .select(`
          *,
          roles (name)
        `)
        .eq('id', userId)
        .single();

      res.json({
        message: 'Perfil completado exitosamente',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          first_name: updatedUser.first_name,
          last_name: updatedUser.last_name,
          role: updatedUser.roles.name,
          cedula: updatedUser.cedula
        }
      });

    } catch (error) {
      console.error('Error al completar perfil:', error);
      res.status(500).json({ error: 'Error al completar perfil' });
    }
  }
};

module.exports = patientController;
