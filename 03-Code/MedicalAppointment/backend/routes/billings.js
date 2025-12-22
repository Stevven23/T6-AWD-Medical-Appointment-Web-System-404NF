// routes/billings.js
const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// POST /api/billings - Crear factura (solo admin)
router.post('/', requireRole('admin'), billingController.createBilling);

// GET /api/billings - Obtener facturas con filtros (admin/doctor)
router.get('/', requireRole('admin', 'doctor'), billingController.getBillings);

// GET /api/billings/:id - Obtener factura por ID
router.get('/:id', requireRole('admin', 'doctor'), billingController.getBillingById);

// PUT /api/billings/:id/status - Actualizar estado (admin)
router.put('/:id/status', requireRole('admin'), billingController.updateBillingStatus);

// PUT /api/billings/:id - Actualizar factura completa (admin)
router.put('/:id', requireRole('admin'), billingController.updateBilling);

// DELETE /api/billings/:id - Eliminar factura (admin)
router.delete('/:id', requireRole('admin'), billingController.deleteBilling);

module.exports = router;
