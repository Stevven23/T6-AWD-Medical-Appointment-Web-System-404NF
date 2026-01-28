const sgMail = require('@sendgrid/mail');

// Configurar SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

class EmailService {
  constructor() {
    this.fromEmail = process.env.SMTP_FROM || 'eatufino1@espe.edu.ec'; // Tu email verificado
    this.fromName = 'Clínica San Miguel';
  }

  async sendEmail(to, subject, htmlContent) {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.log('📧 [SIMULACIÓN] Email:', subject, '→', to);
        return { success: true, messageId: `mock-${Date.now()}`, mode: 'simulation' };
      }

      const msg = {
        to,
        from: {
          email: this.fromEmail,
          name: this.fromName
        },
        subject,
        html: htmlContent
      };

      const response = await sgMail.send(msg);
      console.log('✅ Email enviado:', response[0].headers['x-message-id']);
      
      return {
        success: true,
        messageId: response[0].headers['x-message-id']
      };

    } catch (error) {
      console.error('❌ Error SendGrid:', error.response?.body?.errors || error.message);
      throw error;
    }
  }

  async sendAppointmentConfirmation(appointmentData) {
    const { patientEmail, patientName, doctorName, appointmentDate, specialty } = appointmentData;
    
    const formattedDate = new Date(appointmentDate).toLocaleString('es-EC', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Guayaquil'
    });

    const subject = '✅ Confirmación de Cita Médica';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; border-left: 4px solid #4F46E5; margin: 20px 0; }
          .btn { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏥 Clínica San Miguel</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${patientName}!</h2>
            <p>Tu cita médica ha sido <strong>confirmada</strong>.</p>
            
            <div class="info-box">
              <p><strong>👨‍⚕️ Doctor:</strong> ${doctorName}</p>
              <p><strong>🏥 Especialidad:</strong> ${specialty}</p>
              <p><strong>📅 Fecha y Hora:</strong> ${formattedDate}</p>
            </div>

            <p>Por favor, llega 10 minutos antes de tu cita.</p>
            <p>Si necesitas cancelar o reprogramar, contáctanos con anticipación.</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://medical-appointment-frontend.vercel.app'}/patient/appointments" class="btn">Ver Mi Cita</a>
            </div>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no responder.</p>
            <p>© 2026 Clínica San Miguel</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(patientEmail, subject, htmlContent);
  }

  async sendAppointmentReminder(appointmentData) {
    const { patientEmail, patientName, doctorName, appointmentDate, specialty } = appointmentData;
    
    const formattedDate = new Date(appointmentDate).toLocaleString('es-EC', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Guayaquil'
    });

    const subject = '⏰ Recordatorio de Cita Médica';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #F59E0B; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fffbeb; padding: 30px; border-radius: 0 0 8px 8px; }
          .alert { background: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }
          .info-box { background: white; padding: 20px; margin: 20px 0; }
          .btn { display: inline-block; padding: 12px 30px; background: #F59E0B; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⏰ Recordatorio de Cita</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${patientName}!</h2>
            
            <div class="alert">
              <strong>⚠️ Tu cita es mañana</strong>
            </div>

            <div class="info-box">
              <p><strong>👨‍⚕️ Doctor:</strong> ${doctorName}</p>
              <p><strong>🏥 Especialidad:</strong> ${specialty}</p>
              <p><strong>📅 Fecha y Hora:</strong> ${formattedDate}</p>
            </div>

            <p><strong>Recomendaciones:</strong></p>
            <ul>
              <li>Llega 10 minutos antes</li>
              <li>Trae tu cédula y carnet (si aplica)</li>
              <li>Si tienes exámenes previos, tráelos</li>
            </ul>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://medical-appointment-frontend.vercel.app'}/patient/appointments" class="btn">Ver Detalles de la Cita</a>
            </div>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no responder.</p>
            <p>© 2026 Clínica San Miguel</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(patientEmail, subject, htmlContent);
  }

  async sendAppointmentCancellation(appointmentData) {
    const { patientEmail, patientName, doctorName, appointmentDate, specialty, reason } = appointmentData;
    
    const formattedDate = new Date(appointmentDate).toLocaleString('es-EC', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Guayaquil'
    });

    const subject = '❌ Cita Médica Cancelada';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #DC2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #fef2f2; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; }
          .btn { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>❌ Cita Cancelada</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${patientName}!</h2>
            <p>Tu cita médica ha sido <strong>cancelada</strong>.</p>
            
            <div class="info-box">
              <p><strong>👨‍⚕️ Doctor:</strong> ${doctorName}</p>
              <p><strong>🏥 Especialidad:</strong> ${specialty}</p>
              <p><strong>📅 Fecha y Hora:</strong> ${formattedDate}</p>
              ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
            </div>

            <p>Si deseas agendar una nueva cita, puedes hacerlo a través de nuestra plataforma.</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://medical-appointment-frontend.vercel.app'}/patient/new-appointment" class="btn">Agendar Nueva Cita</a>
            </div>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no responder.</p>
            <p>© 2026 Clínica San Miguel</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(patientEmail, subject, htmlContent);
  }

  async sendAppointmentRescheduled(appointmentData) {
    const { patientEmail, patientName, doctorName, oldDate, newDate, specialty } = appointmentData;
    
    const formattedOldDate = new Date(oldDate).toLocaleString('es-EC', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Guayaquil'
    });

    const formattedNewDate = new Date(newDate).toLocaleString('es-EC', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Guayaquil'
    });

    const subject = '🔄 Cita Médica Reagendada';
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #eff6ff; padding: 30px; border-radius: 0 0 8px 8px; }
          .info-box { background: white; padding: 20px; margin: 20px 0; border-left: 4px solid #3B82F6; }
          .old-date { text-decoration: line-through; color: #999; }
          .new-date { color: #3B82F6; font-weight: bold; }
          .btn { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Cita Reagendada</h1>
          </div>
          <div class="content">
            <h2>¡Hola ${patientName}!</h2>
            <p>Tu cita médica ha sido <strong>reagendada</strong> con éxito.</p>
            
            <div class="info-box">
              <p><strong>👨‍⚕️ Doctor:</strong> ${doctorName}</p>
              <p><strong>🏥 Especialidad:</strong> ${specialty}</p>
              <p><strong>📅 Fecha Anterior:</strong> <span class="old-date">${formattedOldDate}</span></p>
              <p><strong>📅 Nueva Fecha:</strong> <span class="new-date">${formattedNewDate}</span></p>
            </div>

            <p>Por favor, llega 10 minutos antes de tu cita.</p>
            <p>Si necesitas hacer cambios, contáctanos con anticipación.</p>
            <div style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || 'https://medical-appointment-frontend.vercel.app'}/patient/appointments" class="btn">Ver Mis Citas</a>
            </div>
          </div>
          <div class="footer">
            <p>Este es un email automático, por favor no responder.</p>
            <p>© 2026 Clínica San Miguel</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(patientEmail, subject, htmlContent);
  }

  async verifyConnection() {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        console.log('⚠️ SendGrid no configurado - Emails en modo simulación');
        return false;
      }
      console.log('✅ SendGrid API configurada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error verificando SendGrid:', error.message);
      return false;
    }
  }
}

module.exports = new EmailService();
