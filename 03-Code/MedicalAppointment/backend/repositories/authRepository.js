const supabase = require('../database');
const bcrypt = require('bcrypt');

/**
 * Repositorio de autenticación - Acceso a datos
 * Maneja todas las operaciones de base de datos relacionadas con autenticación
 */
const authRepository = {
  /**
   * Buscar usuario por email con su rol
   */
  async findUserByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        roles (name)
      `)
      .eq('email', email)
      .single();

    if (error) {
      return null;
    }

    return data;
  },

  /**
   * Buscar usuario por ID con su rol
   */
  async findUserById(userId) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        roles (name)
      `)
      .eq('id', userId)
      .single();

    if (error) {
      return null;
    }

    return data;
  },

  /**
   * Buscar usuario por Google ID
   */
  async findUserByGoogleId(googleId) {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        roles (name)
      `)
      .eq('google_id', googleId)
      .single();

    if (error) {
      return null;
    }

    return data;
  },

  /**
   * Verificar si un email ya está registrado
   */
  async emailExists(email) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    return !!data && !error;
  },

  /**
   * Verificar si una cédula ya está registrada
   */
  async cedulaExists(cedula) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('cedula', cedula)
      .single();

    return !!data && !error;
  },

  /**
   * Crear nuevo usuario
   */
  async createUser(userData) {
    const { data, error } = await supabase
      .from('users')
      .insert([userData])
      .select(`
        *,
        roles (name)
      `)
      .single();

    if (error) {
      throw new Error(`Error al crear usuario: ${error.message}`);
    }

    return data;
  },

  /**
   * Actualizar usuario
   */
  async updateUser(userId, updateData) {
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select(`
        *,
        roles (name)
      `)
      .single();

    if (error) {
      throw new Error(`Error al actualizar usuario: ${error.message}`);
    }

    return data;
  },

  /**
   * Crear registro de paciente
   */
  async createPatient(patientData) {
    const { data, error } = await supabase
      .from('patients')
      .insert([patientData])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al crear paciente: ${error.message}`);
    }

    return data;
  },

  /**
   * Obtener rol por nombre
   */
  async getRoleByName(roleName) {
    const { data, error } = await supabase
      .from('roles')
      .select('id, name')
      .eq('name', roleName)
      .single();

    if (error) {
      return null;
    }

    return data;
  },

  /**
   * Verificar contraseña
   */
  async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },

  /**
   * Hash de contraseña
   */
  async hashPassword(password) {
    return await bcrypt.hash(password, 10);
  },

  /**
   * Guardar token de reset de contraseña
   */
  async savePasswordResetToken(userId, token, expiresAt) {
    const { data, error } = await supabase
      .from('password_resets')
      .insert([{
        user_id: userId,
        token: token,
        expires_at: expiresAt,
        used: false
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Error al guardar token de reset: ${error.message}`);
    }

    return data;
  },

  /**
   * Buscar token de reset válido
   */
  async findValidResetToken(token) {
    const { data, error } = await supabase
      .from('password_resets')
      .select(`
        *,
        users (id, email, first_name, last_name)
      `)
      .eq('token', token)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error) {
      return null;
    }

    return data;
  },

  /**
   * Marcar token de reset como usado
   */
  async markResetTokenAsUsed(token) {
    const { error } = await supabase
      .from('password_resets')
      .update({ used: true })
      .eq('token', token);

    if (error) {
      throw new Error(`Error al marcar token como usado: ${error.message}`);
    }
  },

  /**
   * Actualizar contraseña del usuario
   */
  async updatePassword(userId, hashedPassword) {
    const { error } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', userId);

    if (error) {
      throw new Error(`Error al actualizar contraseña: ${error.message}`);
    }
  }
};

module.exports = authRepository;
