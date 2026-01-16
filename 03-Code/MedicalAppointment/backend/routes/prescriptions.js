const express = require('express');
console.log('🔥 prescriptions routes LOADED');

const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { authMiddleware } = require('../middleware/auth');

// Función para validar si el ID es un UUID válido
const isUUID = (id) => /^[0-9a-fA-F-]{36}$/.test(id);

// ============================================
// RUTAS PÚBLICAS (sin autenticación)
// ============================================

// RUTA PÚBLICA - GET /api/prescriptions/verify/:id - Verificar una receta (sin autenticación)
router.get('/verify/:id', (req, res, next) => {
  console.log('✅ Route matched: /verify/:id');
  const { id } = req.params;

  if (!isUUID(id)) {
    console.log('❌ Invalid UUID format:', id);
    return res.status(400).json({ error: 'ID de receta inválido' });
  }

  console.log('🔹 Calling verifyPrescription with ID:', id);
  return prescriptionController.verifyPrescription(req, res, next);
});

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================

// GET /api/prescriptions/patient - Obtener recetas del paciente logueado
router.get('/patient', authMiddleware, prescriptionController.getPatientPrescriptions);

// GET /api/doctors/prescriptions o /api/prescriptions - Obtener todas las recetas
// Esta ruta debe ser ANTES de la ruta /:id para evitar conflictos de routing
router.get('/', authMiddleware, prescriptionController.getAllPrescriptions);

// POST /api/doctors/prescriptions o /api/prescriptions - Crear una nueva receta
router.post('/', authMiddleware, prescriptionController.createPrescription);

// GET /api/doctors/prescriptions/:id o /api/prescriptions/:id - Obtener una receta por ID
// Validamos el UUID en el controlador
router.get('/:id', authMiddleware, async (req, res, next) => {
  const { id } = req.params;

  if (!isUUID(id)) {
    return res.status(400).json({ error: 'ID de receta inválido' });
  }

  // Llamamos al controlador con el ID validado
  return prescriptionController.getPrescriptionById(req, res, next);
});

// PUT /api/doctors/prescriptions/:id o /api/prescriptions/:id - Actualizar una receta
router.put('/:id', authMiddleware, async (req, res, next) => {
  const { id } = req.params;

  if (!isUUID(id)) {
    return res.status(400).json({ error: 'ID de receta inválido' });
  }

  // Llamamos al controlador con el ID validado
  return prescriptionController.updatePrescription(req, res, next);
});

// DELETE /api/doctors/prescriptions/:id o /api/prescriptions/:id - Eliminar una receta
router.delete('/:id', authMiddleware, async (req, res, next) => {
  const { id } = req.params;

  if (!isUUID(id)) {
    return res.status(400).json({ error: 'ID de receta inválido' });
  }

  // Llamamos al controlador con el ID validado
  return prescriptionController.deletePrescription(req, res, next);
});

module.exports = router;
