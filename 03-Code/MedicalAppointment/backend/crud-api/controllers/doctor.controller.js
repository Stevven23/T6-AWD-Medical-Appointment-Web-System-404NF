/**
 * Doctor Controller
 * Handles HTTP requests for Doctor CRUD operations
 * 
 * @module crud-api/controllers/DoctorController
 */

const doctorRepository = require('../repositories/doctor.repository');
const userRepository = require('../repositories/user.repository');
const scheduleRepository = require('../repositories/schedule.repository');
const appointmentRepository = require('../repositories/appointment.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const { parsePaginationQuery, createPagination } = require('../../shared/utils/helpers.utils');

class DoctorController {
  /**
   * GET /doctors
   * Get all doctors with pagination
   */
  getAll = asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePaginationQuery(req.query);
    const { specialty_id, search, active } = req.query;

    let doctors;

    if (specialty_id) {
      doctors = await doctorRepository.findBySpecialty(specialty_id, { 
        limit, 
        offset,
        activeOnly: active !== 'false'
      });
    } else {
      doctors = await doctorRepository.findAllWithDetails({ 
        limit, 
        offset,
        search,
        activeOnly: active !== 'false'
      });
    }

    const pagination = createPagination(doctors.length, page, limit);
    return ResponseBuilder.paginated(res, doctors, pagination);
  });

  /**
   * GET /doctors/:id
   * Get doctor by ID
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    
    const doctor = await doctorRepository.findWithDetails(id);
    
    if (!doctor) {
      throw new NotFoundError('Doctor', id);
    }

    return ResponseBuilder.success(res, doctor);
  });

  /**
   * GET /doctors/profile
   * Get current doctor's profile
   */
  getProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    
    const doctor = await doctorRepository.findByUserId(userId);
    
    if (!doctor) {
      throw new NotFoundError('Doctor');
    }

    return ResponseBuilder.success(res, doctor);
  });

  /**
   * GET /doctors/specialty/:specialtyId
   * Get doctors by specialty
   */
  getBySpecialty = asyncHandler(async (req, res) => {
    const { specialtyId } = req.params;
    
    const doctors = await doctorRepository.findBySpecialty(specialtyId);

    return ResponseBuilder.success(res, doctors);
  });

  /**
   * POST /doctors
   * Create new doctor (admin)
   */
  create = asyncHandler(async (req, res) => {
    const { user_id, specialty_id, professional_id, bio } = req.body;

    // Validate required fields
    if (!user_id || !specialty_id) {
      throw new ValidationError('user_id y specialty_id son requeridos');
    }

    // Check if user exists
    const user = await userRepository.findById(user_id);
    if (!user) {
      throw new NotFoundError('Usuario', user_id);
    }

    // Check if doctor already exists for this user
    const existingDoctor = await doctorRepository.findByUserId(user_id);
    if (existingDoctor) {
      throw new ValidationError('Ya existe un registro de doctor para este usuario');
    }

    const doctor = await doctorRepository.create({
      user_id,
      specialty_id,
      professional_id,
      bio,
      active: true
    });

    return ResponseBuilder.created(res, doctor, 'Doctor creado exitosamente');
  });

  /**
   * PUT /doctors/:id
   * Update doctor
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { specialty_id, professional_id, bio } = req.body;

    const existing = await doctorRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Doctor', id);
    }

    const updated = await doctorRepository.update(id, {
      specialty_id,
      professional_id,
      bio
    });

    return ResponseBuilder.success(res, updated, 200, 'Doctor actualizado exitosamente');
  });

  /**
   * PUT /doctors/profile
   * Update current doctor's profile
   */
  updateProfile = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { bio, phone_number, first_name, last_name } = req.body;

    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor');
    }

    // Update user fields
    if (first_name || last_name || phone_number) {
      await userRepository.update(userId, {
        first_name,
        last_name,
        phone_number
      });
    }

    // Update doctor fields
    const updated = await doctorRepository.update(doctor.id, {
      bio
    });

    return ResponseBuilder.success(res, updated, 200, 'Perfil actualizado exitosamente');
  });

  /**
   * DELETE /doctors/:id
   * Soft delete doctor (deactivate)
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await doctorRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Doctor', id);
    }

    await doctorRepository.softDelete(id);

    return ResponseBuilder.success(res, { id }, 200, 'Doctor desactivado exitosamente');
  });

  /**
   * PATCH /doctors/:id/activate
   * Reactivate doctor
   */
  activate = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const existing = await doctorRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Doctor', id);
    }

    const updated = await doctorRepository.updateActiveStatus(id, true);

    return ResponseBuilder.success(res, updated, 200, 'Doctor activado exitosamente');
  });

  /**
   * GET /doctors/:id/schedules
   * Get doctor schedules
   */
  getSchedules = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const schedules = await scheduleRepository.findByDoctor(id);

    return ResponseBuilder.success(res, schedules);
  });

  /**
   * GET /doctors/me/schedules
   * Get current doctor's schedules
   */
  getMySchedules = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor');
    }

    const schedules = await scheduleRepository.findByDoctor(doctor.id);

    return ResponseBuilder.success(res, schedules);
  });

  /**
   * GET /doctors/my-patients
   * Get patients of the current doctor (patients with appointments)
   */
  getMyPatients = asyncHandler(async (req, res) => {
    const userId = req.user.id;

    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor');
    }

    // Get unique patients from appointments
    const patients = await appointmentRepository.findUniquePatientsByDoctor(doctor.id);

    return ResponseBuilder.success(res, patients);
  });
}

module.exports = new DoctorController();
