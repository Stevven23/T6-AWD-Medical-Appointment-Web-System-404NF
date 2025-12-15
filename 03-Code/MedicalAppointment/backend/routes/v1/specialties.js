// backend/routes/v1/specialties.js

const express = require('express');
const router = express.Router();
const specialtyController = require('../../controllers/specialtyController');
const { authMiddleware, requireRole } = require('../../middleware/auth');

/**
 * @route   /api/v1/specialties
 * @desc    Specialty routes with versioning and CRUD operations
 */

// ============================================
// PUBLIC ROUTES (no authentication required)
// ============================================

/**
 * @route   GET /api/v1/specialties/active
 * @desc    Get all active specialties (for patient/public view)
 * @access  Public
 */
router.get('/active', specialtyController.getActiveSpecialties);

/**
 * @route   GET /api/v1/specialties/filter
 * @desc    Filter specialties by criteria
 * @access  Public
 * @query   name, status, hasAvailableDoctors
 */
router.get('/filter', specialtyController.filterSpecialties);

/**
 * @route   GET /api/v1/specialties/:id/doctors
 * @desc    Get specialty with its associated doctors
 * @access  Public
 * @query   activeOnly (boolean)
 */
router.get('/:id/doctors', specialtyController.getSpecialtyWithDoctors);

/**
 * @route   GET /api/v1/specialties/:id
 * @desc    Get a single specialty by ID
 * @access  Public
 */
router.get('/:id', specialtyController.getSpecialtyById);

/**
 * @route   GET /api/v1/specialties
 * @desc    Get all specialties
 * @access  Public
 * @query   page, limit, sort, status
 */
router.get('/', specialtyController.getAllSpecialties);

// ============================================
// ADMIN ROUTES (authentication required)
// ============================================

// Apply authentication to all routes below
router.use(authMiddleware);

/**
 * @route   GET /api/v1/specialties/stats
 * @desc    Get statistics about specialties
 * @access  Admin
 */
router.get('/stats', requireRole('admin'), specialtyController.getSpecialtyStats);

/**
 * @route   POST /api/v1/specialties
 * @desc    Create a new specialty
 * @access  Admin
 * @body    { name, description, icon, color, isActive }
 */
router.post('/', requireRole('admin'), specialtyController.createSpecialty);

/**
 * @route   PUT /api/v1/specialties/:id
 * @desc    Update a specialty (full update)
 * @access  Admin
 * @body    { name, description, icon, color, isActive }
 */
router.put('/:id', requireRole('admin'), specialtyController.updateSpecialty);

/**
 * @route   PATCH /api/v1/specialties/:id/status
 * @desc    Update specialty status (activate/deactivate)
 * @access  Admin
 * @body    { isActive: boolean }
 */
router.patch('/:id/status', requireRole('admin'), specialtyController.updateSpecialtyStatus);

/**
 * @route   DELETE /api/v1/specialties/:id
 * @desc    Delete a specialty (soft delete if has associated doctors)
 * @access  Admin
 */
router.delete('/:id', requireRole('admin'), specialtyController.deleteSpecialty);

module.exports = router;