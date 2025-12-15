const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authRepository = require('../repositories/authRepository');
const emailService = require('./emailService');

/**
 * Servicio de autenticación - Lógica de negocio
 * Centraliza toda la lógica de autenticación
 */
const authService = {
  /**
   * Login de usuario
   */
  async login(email, password) {
    // 1. Buscar usuario
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // 2. Verificar contraseña
    const validPassword = await authRepository.verifyPassword(password, user.password_hash);
    if (!validPassword) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // 3. Generar token JWT
    const token = this.generateToken(user);

    // 4. Generar refresh token
    const refreshToken = this.generateRefreshToken(user);

    // 5. Preparar datos del usuario
    const userData = {
      id: user.id,
      email: user.email,
      role: user.roles.name,
      first_name: user.first_name,
      last_name: user.last_name,
      phone_number: user.phone_number,
      cedula: user.cedula
    };

    return {
      token,
      refreshToken,
      user: userData
    };
  },

  /**
   * Registro de nuevo usuario
   */
  async register(userData) {
    const { email, password, first_name, last_name, cedula, phone_number, date_of_birth } = userData;

    // 1. Validaciones
    if (!email || !password || !first_name || !last_name || !cedula || !date_of_birth) {
      throw new Error('MISSING_REQUIRED_FIELDS');
    }

    // 2. Verificar si email existe
    const emailExists = await authRepository.emailExists(email);
    if (emailExists) {
      throw new Error('EMAIL_ALREADY_EXISTS');
    }

    // 3. Verificar si cédula existe
    const cedulaExists = await authRepository.cedulaExists(cedula);
    if (cedulaExists) {
      throw new Error('CEDULA_ALREADY_EXISTS');
    }

    // 4. Obtener rol de paciente
    const patientRole = await authRepository.getRoleByName('patient');
    if (!patientRole) {
      throw new Error('PATIENT_ROLE_NOT_FOUND');
    }

    // 5. Hash de contraseña
    const password_hash = await authRepository.hashPassword(password);

    // 6. Crear usuario
    const newUser = await authRepository.createUser({
      email,
      password_hash,
      first_name,
      last_name,
      cedula,
      phone_number,
      role_id: patientRole.id
    });

    // 7. Crear registro de paciente
    await authRepository.createPatient({
      user_id: newUser.id,
      date_of_birth
    });

    // 8. Enviar email de bienvenida (no bloqueante)
    emailService.sendWelcomeEmail(email, first_name).catch(console.error);

    // 9. Generar tokens
    const token = this.generateToken(newUser);
    const refreshToken = this.generateRefreshToken(newUser);

    return {
      token,
      refreshToken,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.roles.name,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        phone_number: newUser.phone_number,
        cedula: newUser.cedula
      }
    };
  },

  /**
   * Refresh token
   */
  async refreshToken(refreshToken) {
    try {
      // 1. Verificar token
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);

      // 2. Buscar usuario
      const user = await authRepository.findUserById(decoded.userId);
      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // 3. Generar nuevo access token
      const newToken = this.generateToken(user);

      // 4. Generar nuevo refresh token
      const newRefreshToken = this.generateRefreshToken(user);

      return {
        token: newToken,
        refreshToken: newRefreshToken
      };

    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('REFRESH_TOKEN_EXPIRED');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('INVALID_REFRESH_TOKEN');
      }
      throw error;
    }
  },

  /**
   * Solicitar reset de contraseña
   */
  async requestPasswordReset(email) {
    // 1. Buscar usuario
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      // Por seguridad, no revelar si el email existe o no
      return { success: true, message: 'Si el correo existe, recibirás instrucciones' };
    }

    // 2. Generar token de reset
    const resetToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // 3. Guardar token en BD (expira en 1 hora)
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    await authRepository.savePasswordResetToken(user.id, hashedToken, expiresAt);

    // 4. Enviar email con token
    await emailService.sendPasswordResetEmail(user.email, user.first_name, resetToken);

    return {
      success: true,
      message: 'Si el correo existe, recibirás instrucciones'
    };
  },

  /**
   * Confirmar reset de contraseña
   */
  async resetPassword(token, newPassword) {
    // 1. Hash del token
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // 2. Buscar token válido
    const resetRecord = await authRepository.findValidResetToken(hashedToken);
    if (!resetRecord) {
      throw new Error('INVALID_OR_EXPIRED_TOKEN');
    }

    // 3. Hash de nueva contraseña
    const newPasswordHash = await authRepository.hashPassword(newPassword);

    // 4. Actualizar contraseña
    await authRepository.updatePassword(resetRecord.user_id, newPasswordHash);

    // 5. Marcar token como usado
    await authRepository.markResetTokenAsUsed(hashedToken);

    // 6. Enviar email de confirmación
    emailService.sendPasswordChangedConfirmation(
      resetRecord.users.email,
      resetRecord.users.first_name
    ).catch(console.error);

    return {
      success: true,
      message: 'Contraseña actualizada exitosamente'
    };
  },

  /**
   * Generar token JWT de acceso
   */
  generateToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        role: user.roles.name,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  },

  /**
   * Generar refresh token
   */
  generateRefreshToken(user) {
    return jwt.sign(
      {
        userId: user.id,
        type: 'refresh'
      },
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  },

  /**
   * Validar token JWT
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new Error('TOKEN_EXPIRED');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new Error('INVALID_TOKEN');
      }
      throw error;
    }
  }
};

module.exports = authService;
