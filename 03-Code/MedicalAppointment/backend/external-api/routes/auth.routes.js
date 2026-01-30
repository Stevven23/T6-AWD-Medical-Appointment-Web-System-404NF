/**
 * Auth Routes
 * @module external-api/routes/auth.routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../../shared/middleware/auth.middleware');
const { validate, schemas } = require('../../shared/middleware/validation.middleware');

/**
 * @route POST /auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  validate(schemas.auth.register),
  authController.register
);

/**
 * @route POST /auth/login
 * @desc Login user
 * @access Public
 */
router.post(
  '/login',
  validate(schemas.auth.login),
  authController.login
);

/**
 * @route POST /auth/password-reset/request
 * @desc Request password reset
 * @access Public
 */
router.post(
  '/password-reset/request',
  authController.requestPasswordReset
);

/**
 * @route POST /auth/password-reset/confirm
 * @desc Reset password with token
 * @access Public
 */
router.post(
  '/password-reset/confirm',
  authController.resetPassword
);

/**
 * @route POST /auth/change-password
 * @desc Change password (authenticated)
 * @access Private
 */
router.post(
  '/change-password',
  authMiddleware,
  authController.changePassword
);

/**
 * @route POST /auth/refresh-token
 * @desc Refresh JWT token
 * @access Public
 */
router.post(
  '/refresh-token',
  authController.refreshToken
);

/**
 * @route POST /auth/logout
 * @desc Logout user
 * @access Private
 */
router.post(
  '/logout',
  authMiddleware,
  authController.logout
);

/**
 * @route GET /auth/me
 * @desc Get current authenticated user
 * @access Private
 */
router.get(
  '/me',
  authMiddleware,
  authController.getCurrentUser
);

module.exports = router;
