/**
 * Servicio de email
 * Maneja el envío de correos electrónicos
 */

// TODO: Configurar un proveedor de email real (SendGrid, AWS SES, Nodemailer, etc.)
// Por ahora, simulamos el envío de emails con logs

const emailService = {
  /**
   * Enviar email de recuperación de contraseña
   */
  async sendPasswordResetEmail(email, firstName, resetToken) {
    try {
      const frontendUrl = process.env.FRONTEND_URL || 'http://127.0.0.1:5500/MedicalAppointment';
      const resetUrl = `${frontendUrl}/panels/resetPassword.html?token=${resetToken}`;

      // TODO: Reemplazar con envío real de email
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 EMAIL DE RECUPERACIÓN DE CONTRASEÑA');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Para:', email);
      console.log('Asunto: Recuperación de contraseña - Medical Appointment');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`
Hola ${firstName},

Recibimos una solicitud para restablecer la contraseña de tu cuenta.

Para crear una nueva contraseña, haz clic en el siguiente enlace:
${resetUrl}

Este enlace expirará en 1 hora.

Si no solicitaste este cambio, puedes ignorar este correo y tu contraseña permanecerá sin cambios.

Saludos,
El equipo de Medical Appointment System
      `);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      // Simulamos éxito
      return {
        success: true,
        messageId: `mock-${Date.now()}`
      };

    } catch (error) {
      console.error('Error enviando email de reset:', error);
      throw new Error('Error al enviar el correo de recuperación');
    }
  },

  /**
   * Enviar email de confirmación de cambio de contraseña
   */
  async sendPasswordChangedConfirmation(email, firstName) {
    try {
      // TODO: Reemplazar con envío real de email
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 EMAIL DE CONFIRMACIÓN DE CAMBIO DE CONTRASEÑA');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Para:', email);
      console.log('Asunto: Tu contraseña ha sido actualizada');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`
Hola ${firstName},

Tu contraseña ha sido actualizada exitosamente.

Si no realizaste este cambio, por favor contacta a soporte inmediatamente.

Saludos,
El equipo de Medical Appointment System
      `);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return {
        success: true,
        messageId: `mock-${Date.now()}`
      };

    } catch (error) {
      console.error('Error enviando email de confirmación:', error);
      throw new Error('Error al enviar el correo de confirmación');
    }
  },

  /**
   * Enviar email de bienvenida
   */
  async sendWelcomeEmail(email, firstName) {
    try {
      // TODO: Reemplazar con envío real de email
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 EMAIL DE BIENVENIDA');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Para:', email);
      console.log('Asunto: Bienvenido a Medical Appointment System');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`
Hola ${firstName},

¡Bienvenido a Medical Appointment System!

Tu cuenta ha sido creada exitosamente. Ya puedes acceder a todas las funcionalidades del sistema.

Gracias por confiar en nosotros.

Saludos,
El equipo de Medical Appointment System
      `);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

      return {
        success: true,
        messageId: `mock-${Date.now()}`
      };

    } catch (error) {
      console.error('Error enviando email de bienvenida:', error);
      // No lanzamos error para no bloquear el registro
      return {
        success: false,
        error: error.message
      };
    }
  }
};

module.exports = emailService;
