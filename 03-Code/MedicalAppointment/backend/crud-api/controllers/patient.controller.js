/**
 * Patient Controller
 * Handles HTTP requests for Patient CRUD operations
 * 
 * @module crud-api/controllers/PatientController
 */

const patientRepository = require('../repositories/patient.repository');
const userRepository = require('../repositories/user.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const { parsePaginationQuery, createPagination } = require('../../shared/utils/helpers.utils');

class PatientController {
  /**
   * GET /patients
   * Get all patients with pagination
   */
  getAll = asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePaginationQuery(req.query);
    const { search } = req.query;

    const patients = await patientRepository.findAllWithUserInfo({ 
      limit, 
      offset,
      search 
    });

    const pagination = createPagination(patients.length, page, limit);
    return ResponseBuilder.paginated(res, patients, pagination);
  });

  /**
   * GET /patients/:id
   * Get patient by patient table ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const patient = await patientRepository.findWithUserDetails(id);
    
    if (!patient) {
      throw new NotFoundError('Paciente', id);
    }

    return ResponseBuilder.success(res, patient);
  });

  /**
   * GET /patients/user/:userId
   * Get patient by user ID
   */
  getByUserId = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    
    const patient = await patientRepository.findWithUserDetails(userId);
    
    if (!patient) {
      // Return null instead of error - patient may not have a record yet
      return ResponseBuilder.success(res, null);
    }

    return ResponseBuilder.success(res, patient);
  });

  /**
   * GET /patients/profile
   * Get current patient's profile
   */
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    let patient = await patientRepository.findWithUserDetails(userId);
    
    // Create patient record if doesn't exist
    if (!patient) {
      await patientRepository.createForUser(userId);
      patient = await patientRepository.findWithUserDetails(userId);
    }

    return ResponseBuilder.success(res, patient);
  });

  /**
   * PUT /patients/profile
   * Update current patient's profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    // Separate user fields from patient fields
    // cedula and email are stored in users table
    const userFields = ['first_name', 'last_name', 'phone_number', 'cedula', 'email'];
    const patientFields = [
      'date_of_birth', 'gender', 'address', 'city', 'state',
      'postal_code', 'country', 'insurance_plan', 'insurance_number',
      'emergency_contact_name', 'emergency_contact_phone',
      'emergency_contact_relation', 'allergies', 'medical_conditions',
      'current_medications', 'blood_type', 'height', 'weight', 'home_phone'
    ];
    
    // Map frontend field names to database field names
    const fieldMappings = {
      'province': 'state',
      'landline': 'home_phone',
      'chronic_conditions': 'medical_conditions'
    };

    const userUpdates = {};
    const patientUpdates = {};

    // Separate updates
    for (const [key, value] of Object.entries(req.body)) {
      // Apply field name mappings (frontend name -> database name)
      const dbFieldName = fieldMappings[key] || key;
      const processedValue = value === '' ? null : value;
      
      if (userFields.includes(key)) {
        userUpdates[key] = processedValue;
      } else if (userFields.includes(dbFieldName)) {
        userUpdates[dbFieldName] = processedValue;
      } else if (patientFields.includes(key)) {
        patientUpdates[key] = processedValue;
      } else if (patientFields.includes(dbFieldName)) {
        patientUpdates[dbFieldName] = processedValue;
      }
    }

    // Update user table if needed
    if (Object.keys(userUpdates).length > 0) {
      await userRepository.update(userId, userUpdates);
    }

    // Update patient table if needed
    if (Object.keys(patientUpdates).length > 0) {
      const existingPatient = await patientRepository.findByUserId(userId);
      if (existingPatient) {
        await patientRepository.updateByUserId(userId, patientUpdates);
      } else {
        await patientRepository.createForUser(userId, patientUpdates);
      }
    }

    // Return updated profile
    const updatedProfile = await patientRepository.findWithUserDetails(userId);

    return ResponseBuilder.success(res, updatedProfile, 200, 'Perfil actualizado exitosamente');
  });

  /**
   * POST /patients
   * Create new patient (admin)
   */
  create = asyncHandler(async (req, res) => {
    const { user_id, ...patientData } = req.body;

    // Check if user exists
    const user = await userRepository.findById(user_id);
    if (!user) {
      throw new NotFoundError('Usuario', user_id);
    }

    // Check if patient already exists
    const existingPatient = await patientRepository.findByUserId(user_id);
    if (existingPatient) {
      throw new ValidationError('Ya existe un registro de paciente para este usuario');
    }

    const patient = await patientRepository.createForUser(user_id, patientData);

    return ResponseBuilder.created(res, patient, 'Paciente creado exitosamente');
  });

  /**
   * PUT /patients/:id
   * Update patient by user ID (admin)
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const patientData = req.body;

    const existing = await patientRepository.findByUserId(id);
    if (!existing) {
      throw new NotFoundError('Paciente', id);
    }

    const updated = await patientRepository.updateByUserId(id, patientData);

    return ResponseBuilder.success(res, updated, 200, 'Paciente actualizado exitosamente');
  });

  /**
   * DELETE /patients/:id
   * Soft delete patient (deactivate user)
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await patientRepository.findByUserId(id);
    if (!existing) {
      throw new NotFoundError('Paciente', id);
    }

    // Deactivate user (soft delete)
    await userRepository.softDelete(id);

    return ResponseBuilder.success(res, { id }, 200, 'Paciente desactivado exitosamente');
  });
}

module.exports = new PatientController();
