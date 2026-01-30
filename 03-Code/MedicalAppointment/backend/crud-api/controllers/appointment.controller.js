/**
 * Appointment Controller
 * Handles HTTP requests for Appointment CRUD operations
 * 
 * @module crud-api/controllers/AppointmentController
 */

const appointmentRepository = require('../repositories/appointment.repository');
const doctorRepository = require('../repositories/doctor.repository');
const ResponseBuilder = require('../../shared/utils/responseBuilder.utils');
const { asyncHandler } = require('../../shared/middleware/errorHandler.middleware');
const { NotFoundError, ValidationError } = require('../../shared/errors');
const { parsePaginationQuery, createPagination } = require('../../shared/utils/helpers.utils');
const { AppointmentStatus } = require('../../shared/constants/app.constants');
const emailService = require('../../external-api/services/email.service');
const { supabase } = require('../../shared/config/database.config');

class AppointmentController {
  /**
   * GET /appointments
   * Get all appointments (admin)
   */
  getAll = asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePaginationQuery(req.query);
    const { status, startDate, endDate, doctorId, patientId } = req.query;

    const options = {
      limit,
      offset,
      filters: {}
    };

    if (status) options.filters.status_id = status;
    if (doctorId) options.filters.doctor_id = doctorId;
    if (patientId) options.filters.patient_user_id = patientId;

    const appointments = await appointmentRepository.findAll(options);
    const total = await appointmentRepository.count(options.filters);

    const pagination = createPagination(total, page, limit);
    return ResponseBuilder.paginated(res, appointments, pagination);
  });

  /**
   * GET /appointments/:id
   * Get appointment by ID
   * Query params: includeCancelled=true to include cancelled appointments
   */
  getById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { includeCancelled } = req.query;
    
    const appointment = await appointmentRepository.findWithDetails(
      id, 
      includeCancelled === 'true'
    );
    
    if (!appointment) {
      throw new NotFoundError('Cita', id);
    }

    return ResponseBuilder.success(res, appointment);
  });

  /**
   * GET /appointments/patient
   * Get appointments for current patient
   */
  getByPatient = asyncHandler(async (req, res) => {
    const patientUserId = req.user.id;
    const { status, upcoming, limit, offset } = req.query;

    console.log('[Appointments] Getting appointments for patient:', patientUserId);

    const appointments = await appointmentRepository.findByPatient(patientUserId, {
      status,
      upcoming: upcoming === 'true',
      limit: parseInt(limit) || 100, // Increased limit to show more appointments
      offset: parseInt(offset) || 0
    });

    console.log('[Appointments] Found', appointments.length, 'appointments');

    // Transform nested data to flat structure for frontend
    const transformedAppointments = appointments.map(apt => ({
      ...apt,
      doctor_id: apt.doctor_id || apt.doctors?.id,
      doctor_first_name: apt.doctors?.users?.first_name || '',
      doctor_last_name: apt.doctors?.users?.last_name || '',
      specialty_name: apt.doctors?.specialties?.name || '',
      status_code: apt.appointment_status?.code || '',
      status_label: apt.appointment_status?.label || '',
      location: apt.consultation_rooms?.name || apt.consultation_rooms?.room_number || ''
    }));

    return ResponseBuilder.success(res, transformedAppointments);
  });

  /**
   * GET /appointments/by-patient/:patientUserId
   * Get appointments for a specific patient (used by doctors)
   */
  getByPatientId = asyncHandler(async (req, res) => {
    const { patientUserId } = req.params;
    const { status, upcoming, limit, offset } = req.query;

    const appointments = await appointmentRepository.findByPatient(patientUserId, {
      status,
      upcoming: upcoming === 'true',
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0
    });

    // Transform nested data to flat structure
    const transformedAppointments = appointments.map(apt => ({
      ...apt,
      doctor_id: apt.doctors?.id,
      doctor_first_name: apt.doctors?.users?.first_name || '',
      doctor_last_name: apt.doctors?.users?.last_name || '',
      specialty_name: apt.doctors?.specialties?.name || '',
      status_code: apt.appointment_status?.code || '',
      status_label: apt.appointment_status?.label || '',
      location: apt.consultation_rooms?.name || apt.consultation_rooms?.room_number || ''
    }));

    return ResponseBuilder.success(res, transformedAppointments);
  });

  /**
   * GET /appointments/doctor
   * Get appointments for current doctor
   */
  getByDoctor = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const { date, status, startDate, endDate, limit, offset } = req.query;

    // Get doctor ID from user ID
    const doctor = await doctorRepository.findByUserId(userId);
    if (!doctor) {
      throw new NotFoundError('Doctor');
    }

    const appointments = await appointmentRepository.findByDoctor(doctor.id, {
      date,
      status: status ? parseInt(status) : undefined,
      startDate,
      endDate,
      limit: parseInt(limit) || 20,
      offset: parseInt(offset) || 0
    });

    return ResponseBuilder.success(res, appointments);
  });

  /**
   * POST /appointments
   * Create new appointment
   */
  create = asyncHandler(async (req, res) => {
    const { 
      doctor_id, 
      scheduled_start, 
      reason, 
      duration_minutes = 30,
      patient_user_id // For admin creating appointment
    } = req.body;

    // Determine patient ID
    const patientUserId = patient_user_id || req.user.id;

    // Validate required fields
    if (!doctor_id || !scheduled_start) {
      throw new ValidationError('doctor_id y scheduled_start son requeridos');
    }

    // Verify doctor exists and is active
    const doctor = await doctorRepository.findById(doctor_id);
    if (!doctor || !doctor.active) {
      throw new NotFoundError('Doctor', doctor_id);
    }

    // Calculate end time
    const startDate = new Date(scheduled_start);
    const endDate = new Date(startDate.getTime() + duration_minutes * 60000);
    const scheduled_end = endDate.toISOString();

    // Create appointment
    const appointment = await appointmentRepository.create({
      patient_user_id: patientUserId,
      doctor_id,
      scheduled_start,
      scheduled_end,
      status_id: AppointmentStatus.SCHEDULED,
      reason: reason || null,
      created_by_user_id: req.user.id
    });

    // Send confirmation email asynchronously
    this._sendConfirmationEmail(appointment.id, patientUserId, doctor_id, startDate, reason).catch(err => {
      console.error('[Appointments] Error sending confirmation email:', err.message);
    });

    return ResponseBuilder.created(res, appointment, 'Cita creada exitosamente');
  });

  /**
   * PUT /appointments/:id
   * Update appointment
   */
  update = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason, room_id, consultation_room_id } = req.body;

    const existing = await appointmentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Cita', id);
    }

    // Check if already cancelled
    if (existing.status_id === AppointmentStatus.CANCELLED) {
      throw new ValidationError('No se puede actualizar una cita cancelada');
    }

    const updated = await appointmentRepository.update(id, {
      reason,
      room_id,
      consultation_room_id
    });

    return ResponseBuilder.success(res, updated, 200, 'Cita actualizada exitosamente');
  });

  /**
   * PATCH /appointments/:id/status
   * Update appointment status
   */
  updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status_id } = req.body;

    if (!status_id) {
      throw new ValidationError('status_id es requerido');
    }

    const existing = await appointmentRepository.findById(id);
    if (!existing) {
      throw new NotFoundError('Cita', id);
    }

    // Check if already cancelled
    if (existing.status_id === AppointmentStatus.CANCELLED) {
      throw new ValidationError('No se puede actualizar una cita cancelada');
    }

    const updated = await appointmentRepository.updateStatus(id, status_id);

    return ResponseBuilder.success(res, updated, 200, 'Estado de cita actualizado');
  });

  /**
   * DELETE /appointments/:id
   * Soft delete appointment
   */
  delete = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { reason } = req.body;

    const existing = await appointmentRepository.findWithDetails(id);
    if (!existing) {
      throw new NotFoundError('Cita', id);
    }

    // Check if already cancelled
    if (existing.status_id === AppointmentStatus.CANCELLED) {
      throw new ValidationError('La cita ya fue cancelada');
    }

    await appointmentRepository.softDelete(id);

    // Send cancellation email asynchronously
    this._sendCancellationEmail(existing, reason || 'Cancelada por el usuario').catch(err => {
      console.error('[Appointments] Error sending cancellation email:', err.message);
    });

    return ResponseBuilder.success(res, { id }, 200, 'Cita cancelada exitosamente');
  });

  /**
   * GET /appointments/upcoming
   * Get upcoming appointments for current user
   */
  getUpcoming = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { limit = 5, days = 7 } = req.query;

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + parseInt(days));

    let appointments;

    if (userRole === 'patient') {
      appointments = await appointmentRepository.findByPatient(userId, {
        upcoming: true,
        limit: parseInt(limit)
      });
    } else if (userRole === 'doctor') {
      const doctor = await doctorRepository.findByUserId(userId);
      if (doctor) {
        appointments = await appointmentRepository.findByDoctor(doctor.id, {
          startDate: now.toISOString().split('T')[0],
          endDate: futureDate.toISOString().split('T')[0],
          status: AppointmentStatus.SCHEDULED,
          limit: parseInt(limit)
        });
      }
    }

    return ResponseBuilder.success(res, appointments || []);
  });

  // ===== Private Email Methods =====

  /**
   * Send appointment confirmation email
   * @private
   */
  async _sendConfirmationEmail(appointmentId, patientUserId, doctorId, scheduledStart, reason) {
    try {
      // Get patient info
      const { data: patient } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', patientUserId)
        .single();

      if (!patient?.email) {
        console.log('[Appointments] No patient email found, skipping confirmation');
        return;
      }

      // Get doctor info with specialty
      const { data: doctor } = await supabase
        .from('doctors')
        .select(`
          users(first_name, last_name),
          specialties(name)
        `)
        .eq('id', doctorId)
        .single();

      // Get appointment with room info
      const { data: appointment } = await supabase
        .from('appointments')
        .select(`
          consultation_rooms!appointments_consultation_room_id_fkey(name, room_number)
        `)
        .eq('id', appointmentId)
        .single();

      const doctorName = doctor?.users 
        ? `${doctor.users.first_name} ${doctor.users.last_name}` 
        : 'Doctor';
      const specialty = doctor?.specialties?.name || 'Medicina General';
      const room = appointment?.consultation_rooms 
        ? `${appointment.consultation_rooms.name || ''} ${appointment.consultation_rooms.room_number || ''}`.trim() 
        : null;

      const dateObj = new Date(scheduledStart);
      const dateStr = dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const timeStr = dateObj.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });

      await emailService.sendAppointmentConfirmation({
        patientEmail: patient.email,
        patientName: `${patient.first_name} ${patient.last_name}`,
        doctorName,
        specialty,
        date: dateStr,
        time: timeStr,
        room,
        reason
      });

      console.log(`[Appointments] ✅ Confirmation email sent to ${patient.email}`);
    } catch (error) {
      console.error('[Appointments] Error sending confirmation email:', error.message);
      // Don't throw - email failure shouldn't fail the appointment creation
    }
  }

  /**
   * Send appointment cancellation email
   * @private
   */
  async _sendCancellationEmail(appointment, reason) {
    try {
      // Get patient info
      const { data: patient } = await supabase
        .from('users')
        .select('email, first_name, last_name')
        .eq('id', appointment.patient_user_id)
        .single();

      if (!patient?.email) {
        console.log('[Appointments] No patient email found, skipping cancellation notification');
        return;
      }

      // Get doctor info with specialty
      const { data: doctor } = await supabase
        .from('doctors')
        .select(`
          users(first_name, last_name),
          specialties(name)
        `)
        .eq('id', appointment.doctor_id)
        .single();

      const doctorName = doctor?.users 
        ? `${doctor.users.first_name} ${doctor.users.last_name}` 
        : 'Doctor';
      const specialty = doctor?.specialties?.name || 'Medicina General';

      const dateObj = new Date(appointment.scheduled_start);
      const dateStr = dateObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      const timeStr = dateObj.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      });

      await emailService.sendAppointmentCancellation({
        patientEmail: patient.email,
        patientName: `${patient.first_name} ${patient.last_name}`,
        doctorName,
        specialty,
        date: dateStr,
        time: timeStr,
        reason
      });

      console.log(`[Appointments] ✅ Cancellation email sent to ${patient.email}`);
    } catch (error) {
      console.error('[Appointments] Error sending cancellation email:', error.message);
    }
  }
}

module.exports = new AppointmentController();
