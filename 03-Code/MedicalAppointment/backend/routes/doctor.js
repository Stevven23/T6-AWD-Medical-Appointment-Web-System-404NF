const express = require('express');
const router = express.Router();

const doctorController = require('../controllers/doctorController');
const patientManagementController = require('../controllers/patientManagementController');

// ====================
// RUTAS DE PACIENTES
// ====================
router.get('/patients', patientManagementController.getPatientList);
router.post('/patients', patientManagementController.createPatient);
router.get('/patients/:userId/record', patientManagementController.getPatientRecordDetails);

// ====================
// RUTAS ESPECÍFICAS (ANTES DE :id)
// ====================
router.get('/specialties', doctorController.getSpecialties);
router.get('/stats', doctorController.getDoctorStats);
router.get('/filter', doctorController.filterDoctors);
router.get('/specialty/:specialty_id', doctorController.getDoctorsBySpecialty);

// ====================
// SUBRUTAS DEL DOCTOR
// ====================
router.get('/:id/schedules', doctorController.getDoctorSchedules);
router.patch('/:id/status', doctorController.updateDoctorStatus);

// ====================
// CRUD DOCTORES
// ====================
router.post('/', doctorController.createDoctor);
router.get('/', doctorController.getAllDoctors);

router.get('/:id', doctorController.getDoctorById);
router.put('/:id', doctorController.updateDoctor);
router.delete('/:id', doctorController.deleteDoctor);

module.exports = router;
