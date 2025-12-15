// backend/utils/errorCodes.js

/**
 * Centralized error codes catalog
 * Following REST best practices for HTTP status codes
 */

const ErrorCodes = {
  // ============================================================================
  // AUTHENTICATION & AUTHORIZATION (401, 403)
  // ============================================================================
  AUTH_INVALID_CREDENTIALS: {
    code: 'AUTH_001',
    status: 401,
    message: 'Credenciales inválidas'
  },
  AUTH_TOKEN_EXPIRED: {
    code: 'AUTH_002',
    status: 401,
    message: 'Token expirado. Por favor inicie sesión nuevamente'
  },
  AUTH_TOKEN_INVALID: {
    code: 'AUTH_003',
    status: 401,
    message: 'Token inválido'
  },
  AUTH_TOKEN_MISSING: {
    code: 'AUTH_004',
    status: 401,
    message: 'Token de autenticación requerido'
  },
  AUTH_INSUFFICIENT_PERMISSIONS: {
    code: 'AUTH_005',
    status: 403,
    message: 'Permisos insuficientes para realizar esta acción'
  },
  AUTH_ACCOUNT_INACTIVE: {
    code: 'AUTH_006',
    status: 403,
    message: 'Cuenta inactiva. Contacte al administrador'
  },

  // ============================================================================
  // VALIDATION ERRORS (422 Unprocessable Entity)
  // ============================================================================
  VALIDATION_FAILED: {
    code: 'VAL_001',
    status: 422,
    message: 'Error de validación en los datos proporcionados'
  },
  VALIDATION_REQUIRED_FIELD: {
    code: 'VAL_002',
    status: 422,
    message: 'Campo requerido faltante'
  },
  VALIDATION_INVALID_FORMAT: {
    code: 'VAL_003',
    status: 422,
    message: 'Formato de datos inválido'
  },
  VALIDATION_INVALID_EMAIL: {
    code: 'VAL_004',
    status: 422,
    message: 'Formato de email inválido'
  },
  VALIDATION_INVALID_CEDULA: {
    code: 'VAL_005',
    status: 422,
    message: 'Cédula inválida'
  },
  VALIDATION_INVALID_DATE: {
    code: 'VAL_006',
    status: 422,
    message: 'Formato de fecha inválido'
  },
  VALIDATION_PAST_DATE: {
    code: 'VAL_007',
    status: 422,
    message: 'No se permiten fechas en el pasado'
  },
  VALIDATION_INVALID_PHONE: {
    code: 'VAL_008',
    status: 422,
    message: 'Formato de teléfono inválido'
  },

  // ============================================================================
  // RESOURCE NOT FOUND (404)
  // ============================================================================
  RESOURCE_NOT_FOUND: {
    code: 'RES_001',
    status: 404,
    message: 'Recurso no encontrado'
  },
  DOCTOR_NOT_FOUND: {
    code: 'RES_002',
    status: 404,
    message: 'Doctor no encontrado'
  },
  PATIENT_NOT_FOUND: {
    code: 'RES_003',
    status: 404,
    message: 'Paciente no encontrado'
  },
  APPOINTMENT_NOT_FOUND: {
    code: 'RES_004',
    status: 404,
    message: 'Cita no encontrada'
  },
  PRESCRIPTION_NOT_FOUND: {
    code: 'RES_005',
    status: 404,
    message: 'Receta no encontrada'
  },
  SPECIALTY_NOT_FOUND: {
    code: 'RES_006',
    status: 404,
    message: 'Especialidad no encontrada'
  },

  // ============================================================================
  // CONFLICT ERRORS (409 Conflict)
  // ============================================================================
  RESOURCE_ALREADY_EXISTS: {
    code: 'CONF_001',
    status: 409,
    message: 'El recurso ya existe'
  },
  EMAIL_ALREADY_EXISTS: {
    code: 'CONF_002',
    status: 409,
    message: 'El email ya está registrado'
  },
  CEDULA_ALREADY_EXISTS: {
    code: 'CONF_003',
    status: 409,
    message: 'La cédula ya está registrada'
  },
  APPOINTMENT_SLOT_UNAVAILABLE: {
    code: 'CONF_004',
    status: 409,
    message: 'El horario solicitado no está disponible'
  },
  APPOINTMENT_ALREADY_CANCELLED: {
    code: 'CONF_005',
    status: 409,
    message: 'La cita ya fue cancelada'
  },
  APPOINTMENT_ALREADY_COMPLETED: {
    code: 'CONF_006',
    status: 409,
    message: 'La cita ya fue completada'
  },
  DOCTOR_SCHEDULE_CONFLICT: {
    code: 'CONF_007',
    status: 409,
    message: 'Conflicto con el horario del doctor'
  },
  PATIENT_ALREADY_HAS_APPOINTMENT: {
    code: 'CONF_008',
    status: 409,
    message: 'El paciente ya tiene una cita en ese horario'
  },

  // ============================================================================
  // APPOINTMENT SPECIFIC ERRORS (400, 409, 422)
  // ============================================================================
  APPOINTMENT_PAST_DATE: {
    code: 'APT_001',
    status: 400,
    message: 'No se puede agendar una cita en el pasado'
  },
  APPOINTMENT_OUTSIDE_WORKING_HOURS: {
    code: 'APT_002',
    status: 422,
    message: 'La cita está fuera del horario de atención'
  },
  APPOINTMENT_TOO_SOON: {
    code: 'APT_003',
    status: 422,
    message: 'La cita debe agendarse con al menos 1 hora de anticipación'
  },
  APPOINTMENT_TOO_FAR: {
    code: 'APT_004',
    status: 422,
    message: 'No se pueden agendar citas con más de 3 meses de anticipación'
  },
  APPOINTMENT_CANNOT_CANCEL: {
    code: 'APT_005',
    status: 400,
    message: 'No se puede cancelar esta cita'
  },
  APPOINTMENT_CANNOT_RESCHEDULE: {
    code: 'APT_006',
    status: 400,
    message: 'No se puede reprogramar esta cita'
  },

  // ============================================================================
  // DOCTOR SPECIFIC ERRORS
  // ============================================================================
  DOCTOR_NOT_AVAILABLE: {
    code: 'DOC_001',
    status: 409,
    message: 'El doctor no está disponible en esa fecha/hora'
  },
  DOCTOR_INACTIVE: {
    code: 'DOC_002',
    status: 400,
    message: 'El doctor está inactivo'
  },
  DOCTOR_NO_SCHEDULE: {
    code: 'DOC_003',
    status: 404,
    message: 'El doctor no tiene horarios configurados'
  },

  // ============================================================================
  // PATIENT SPECIFIC ERRORS
  // ============================================================================
  PATIENT_PROFILE_INCOMPLETE: {
    code: 'PAT_001',
    status: 422,
    message: 'El perfil del paciente está incompleto'
  },
  PATIENT_UNDER_AGE: {
    code: 'PAT_002',
    status: 422,
    message: 'El paciente debe ser mayor de edad o tener consentimiento de tutor'
  },

  // ============================================================================
  // BAD REQUEST (400)
  // ============================================================================
  BAD_REQUEST: {
    code: 'REQ_001',
    status: 400,
    message: 'Solicitud incorrecta'
  },
  MISSING_PARAMETERS: {
    code: 'REQ_002',
    status: 400,
    message: 'Faltan parámetros requeridos'
  },
  INVALID_PARAMETERS: {
    code: 'REQ_003',
    status: 400,
    message: 'Parámetros inválidos'
  },

  // ============================================================================
  // SERVER ERRORS (500)
  // ============================================================================
  INTERNAL_ERROR: {
    code: 'SRV_001',
    status: 500,
    message: 'Error interno del servidor'
  },
  DATABASE_ERROR: {
    code: 'SRV_002',
    status: 500,
    message: 'Error en la base de datos'
  },
  EXTERNAL_SERVICE_ERROR: {
    code: 'SRV_003',
    status: 500,
    message: 'Error en servicio externo'
  }
};

/**
 * Helper function to get error details
 * @param {string} errorKey - Error key from ErrorCodes
 * @param {Object} customDetails - Optional custom details to append
 * @returns {Object} Error details
 */
function getErrorDetails(errorKey, customDetails = {}) {
  const error = ErrorCodes[errorKey];
  
  if (!error) {
    return {
      ...ErrorCodes.INTERNAL_ERROR,
      details: { originalError: errorKey }
    };
  }

  return {
    ...error,
    ...(Object.keys(customDetails).length > 0 && { details: customDetails })
  };
}

module.exports = {
  ErrorCodes,
  getErrorDetails
};