// routes/auditLogs.js
const express = require('express');
const router = express.Router();
const auditLogController = require('../controllers/auditLogController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol de admin
router.use(authMiddleware);
router.use(requireRole('admin'));

// GET /api/audit-logs - Obtener logs con filtros
router.get('/', auditLogController.getAuditLogs);

// GET /api/audit-logs/stats - Estadísticas de auditoría
router.get('/stats', auditLogController.getAuditStats);

// GET /api/audit-logs/user/:userId - Logs de un usuario específico
router.get('/user/:userId', auditLogController.getUserAuditLogs);

// GET /api/audit-logs/:id - Obtener log por ID
router.get('/:id', auditLogController.getAuditLogById);

// POST /api/audit-logs - Crear log manual
router.post('/', auditLogController.createAuditLog);

module.exports = router;
