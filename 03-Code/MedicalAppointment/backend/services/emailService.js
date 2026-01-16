/**
 * Servicio de email con Nodemailer
 * Maneja el envío de correos electrónicos con plantillas HTML
 */

const nodemailer = require('nodemailer');

// Configuración del transportador de email
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Plantilla base HTML
const getEmailTemplate = (title, content) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; }
    .email-container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); padding: 40px 30px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
    .logo { font-size: 48px; margin-bottom: 10px; }
    .content { padding: 40px 30px; color: #374151; line-height: 1.6; }
    .info-box { background-color: #f3f4f6; border-left: 4px solid #2563eb; padding: 20px; margin: 25px 0; border-radius: 8px; }
    .info-box h3 { margin: 0 0 15px 0; color: #1f2937; font-size: 18px; }
    .info-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .info-row:last-child { border-bottom: none; }
    .info-label { font-weight: 600; color: #6b7280; }
    .info-value { color: #1f2937; text-align: right; }
    .button { display: inline-block; padding: 14px 32px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .alert-box { background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 20px; margin: 25px 0; border-radius: 8px; color: #991b1b; }
    .success-box { background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 25px 0; border-radius: 8px; color: #065f46; }
    .footer { background-color: #f9fafb; padding: 30px; text-align: center; color: #6b7280; font-size: 14px; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <div class="logo">🏥</div>
      <h1>Clínica San Miguel</h1>
    </div>
    <div class="content">${content}</div>
    <div class="footer">
      <p><strong>Clínica San Miguel</strong></p>
      <p>Tu salud es nuestra prioridad</p>
      <p>📧 clinica@sanmiguel.com | 📞 (02) 123-4567</p>
      <p style="font-size: 12px; margin-top: 20px;">Este es un correo automático, por favor no responder.</p>
    </div>
  </div>
</body>
</html>
`;

const emailService = {
  async sendAppointmentReminder(appointmentData) {
    const { patientEmail, patientName, doctorName, specialty, date, time, location } = appointmentData;
    const content = `
      <h2>🔔 Recordatorio de Cita Médica</h2>
      <p>Hola <strong>${patientName}</strong>,</p>
      <p>Te recordamos que tienes una cita médica programada para mañana:</p>
      <div class="info-box">
        <h3>📅 Detalles de tu Cita</h3>
        <div class="info-row"><span class="info-label">Doctor(a):</span><span class="info-value">${doctorName}</span></div>
        <div class="info-row"><span class="info-label">Especialidad:</span><span class="info-value">${specialty}</span></div>
        <div class="info-row"><span class="info-label">Fecha:</span><span class="info-value">${date}</span></div>
        <div class="info-row"><span class="info-label">Hora:</span><span class="info-value">${time}</span></div>
        <div class="info-row"><span class="info-label">Ubicación:</span><span class="info-value">${location || 'Clínica San Miguel'}</span></div>
      </div>
      <div class="success-box">
        <strong>💡 Recomendaciones:</strong>
        <ul style="margin: 10px 0;">
          <li>Llega 10 minutos antes</li>
          <li>Trae tu documento de identidad</li>
          <li>Si tienes exámenes previos, tráelos</li>
        </ul>
      </div>
      <p style="text-align: center;"><a href="${process.env.FRONTEND_URL}/patient/appointments" class="button">Ver Mis Citas</a></p>
    `;
    return await this.sendEmail(patientEmail, '🔔 Recordatorio: Cita Médica Mañana', getEmailTemplate('Recordatorio', content));
  },

  async sendAppointmentCancellation(appointmentData) {
    const { patientEmail, patientName, doctorName, specialty, date, time, cancellationReason } = appointmentData;
    const content = `
      <h2>❌ Cita Cancelada</h2>
      <p>Hola <strong>${patientName}</strong>,</p>
      <p>Lamentamos informarte que tu cita médica ha sido <strong>cancelada</strong>:</p>
      <div class="alert-box">
        <h3>📅 Cita Cancelada</h3>
        <div class="info-row"><span class="info-label">Doctor(a):</span><span class="info-value">${doctorName}</span></div>
        <div class="info-row"><span class="info-label">Fecha:</span><span class="info-value">${date}</span></div>
        <div class="info-row"><span class="info-label">Hora:</span><span class="info-value">${time}</span></div>
        ${cancellationReason ? `<div class="info-row"><span class="info-label">Motivo:</span><span class="info-value">${cancellationReason}</span></div>` : ''}
      </div>
      <p style="text-align: center;"><a href="${process.env.FRONTEND_URL}/patient/appointments" class="button">Agendar Nueva Cita</a></p>
    `;
    return await this.sendEmail(patientEmail, '❌ Cita Cancelada', getEmailTemplate('Cancelación', content));
  },

  async sendAppointmentReschedule(appointmentData) {
    const { patientEmail, patientName, doctorName, specialty, oldDate, oldTime, newDate, newTime, rescheduleReason } = appointmentData;
    const content = `
      <h2>🔄 Cita Reprogramada</h2>
      <p>Hola <strong>${patientName}</strong>,</p>
      <p>Tu cita médica ha sido <strong>reprogramada</strong>:</p>
      <div class="alert-box">
        <h3>📅 Cita Original</h3>
        <div class="info-row"><span class="info-label">Fecha anterior:</span><span class="info-value">${oldDate}</span></div>
        <div class="info-row"><span class="info-label">Hora anterior:</span><span class="info-value">${oldTime}</span></div>
        ${rescheduleReason ? `<div class="info-row"><span class="info-label">Motivo:</span><span class="info-value">${rescheduleReason}</span></div>` : ''}
      </div>
      <div class="success-box">
        <h3>✅ Nueva Cita</h3>
        <div class="info-row"><span class="info-label">Doctor(a):</span><span class="info-value">${doctorName}</span></div>
        <div class="info-row"><span class="info-label">Nueva fecha:</span><span class="info-value">${newDate}</span></div>
        <div class="info-row"><span class="info-label">Nueva hora:</span><span class="info-value">${newTime}</span></div>
      </div>
      <p style="text-align: center;"><a href="${process.env.FRONTEND_URL}/patient/appointments" class="button">Ver Detalles</a></p>
    `;
    return await this.sendEmail(patientEmail, '🔄 Cita Reprogramada', getEmailTemplate('Reprogramación', content));
  },

  async sendEmail(to, subject, htmlContent) {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.log('📧 [SIMULACIÓN] Email:', subject, '→', to);
        return { success: true, messageId: `mock-${Date.now()}`, mode: 'simulation' };
      }
      const info = await transporter.sendMail({
        from: `"Clínica San Miguel" <${process.env.SMTP_USER}>`,
        to,
        subject,
        html: htmlContent,
      });
      console.log('✅ Email enviado:', info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      throw error;
    }
  },

  async sendPasswordResetEmail(email, firstName, resetToken) {
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;
    const content = `
      <h2>🔐 Recuperación de Contraseña</h2>
      <p>Hola <strong>${firstName}</strong>,</p>
      <p>Recibimos una solicitud para restablecer tu contraseña.</p>
      <p style="text-align: center;"><a href="${resetUrl}" class="button">Restablecer Contraseña</a></p>
      <p>Este enlace expirará en 1 hora.</p>
    `;
    return await this.sendEmail(email, 'Recuperación de Contraseña', getEmailTemplate('Reset Password', content));
  },

  async sendPasswordChangedConfirmation() { return { success: true }; },
  async sendWelcomeEmail() { return { success: true }; },

  async verifyConnection() {
    try {
      if (!process.env.SMTP_USER) {
        console.log('⚠️  SMTP no configurado - Emails en modo simulación');
        return false;
      }
      await transporter.verify();
      console.log('✅ Servidor SMTP listo');
      return true;
    } catch (error) {
      console.error('❌ Error SMTP:', error.message);
      return false;
    }
  }
};

module.exports = emailService;
