const express = require('express');
const router = express.Router();
const consultationRoomController = require('../controllers/consultationRoomController');
const { authMiddleware } = require('../middleware/auth');

// All routes require authentication
router.use(authMiddleware);

// Get available rooms (for appointments)
router.get('/', consultationRoomController.getAvailableRooms);

// Get room by ID
router.get('/:id', consultationRoomController.getRoomById);

module.exports = router;
