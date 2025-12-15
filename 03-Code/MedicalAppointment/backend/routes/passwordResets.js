const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

/**
 * POST /api/password-resets - Solicitar reset de contraseña
 * Envía un email con instrucciones para resetear la contraseña
 */
router.post('/', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'El email es requerido'
      });
    }

    const result = await authService.requestPasswordReset(email);

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error solicitando reset de contraseña:', error);
    
    // Por seguridad, siempre retornar éxito (no revelar si el email existe)
    res.json({
      success: true,
      message: 'Si el correo existe, recibirás instrucciones para resetear tu contraseña'
    });
  }
});

/**
 * PATCH /api/password-resets/:token - Confirmar reset de contraseña
 * Actualiza la contraseña usando el token enviado por email
 */
router.patch('/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { password, confirmPassword } = req.body;

    // Validaciones
    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña y su confirmación son requeridas'
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Las contraseñas no coinciden'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    const result = await authService.resetPassword(token, password);

    res.json({
      success: true,
      message: result.message
    });

  } catch (error) {
    console.error('Error confirmando reset de contraseña:', error);

    if (error.message === 'INVALID_OR_EXPIRED_TOKEN') {
      return res.status(400).json({
        success: false,
        error: 'El token es inválido o ha expirado',
        code: 'INVALID_OR_EXPIRED_TOKEN'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al resetear la contraseña'
    });
  }
});

module.exports = router;
