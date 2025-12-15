const express = require('express');
const router = express.Router();
const authService = require('../services/authService');

/**
 * POST /api/sessions - Login
 * Autentica un usuario y retorna tokens
 */
router.post('/', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email y contraseña son requeridos'
      });
    }

    const result = await authService.login(email, password);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error en login:', error);

    if (error.message === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        success: false,
        error: 'Credenciales inválidas'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error en el servidor'
    });
  }
});

/**
 * DELETE /api/sessions - Logout
 * Invalida el token del usuario (blacklist)
 */
router.delete('/', async (req, res) => {
  try {
    // TODO: Implementar blacklist de tokens en Redis o BD
    // Por ahora, el logout se maneja del lado del cliente eliminando el token

    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });

  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      error: 'Error al cerrar sesión'
    });
  }
});

/**
 * POST /api/sessions/refresh - Refresh token
 * Renueva el access token usando un refresh token válido
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token es requerido'
      });
    }

    const result = await authService.refreshToken(refreshToken);

    res.json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error en refresh token:', error);

    if (error.message === 'REFRESH_TOKEN_EXPIRED') {
      return res.status(401).json({
        success: false,
        error: 'Refresh token expirado',
        code: 'REFRESH_TOKEN_EXPIRED'
      });
    }

    if (error.message === 'INVALID_REFRESH_TOKEN') {
      return res.status(401).json({
        success: false,
        error: 'Refresh token inválido',
        code: 'INVALID_REFRESH_TOKEN'
      });
    }

    if (error.message === 'USER_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Error al renovar token'
    });
  }
});

module.exports = router;
