// backend/utils/responseFormatter.js

/**
 * Utility class for standardizing API responses
 * Implements uniform interface constraint from REST architecture
 */
class ResponseFormatter {
  
  /**
   * Success response with data
   * @param {*} data - Response data
   * @param {string} message - Optional success message
   * @param {Object} meta - Optional metadata (pagination, totals, etc.)
   * @returns {Object} Formatted success response
   */
  static success(data, message = null, meta = {}) {
    const response = {
      success: true,
      data
    };

    if (message) {
      response.message = message;
    }

    if (Object.keys(meta).length > 0) {
      response.meta = meta;
    }

    return response;
  }

  /**
   * Error response
   * @param {string} message - Error message
   * @param {string} code - Error code (e.g., 'VALIDATION_ERROR')
   * @param {*} details - Optional error details
   * @returns {Object} Formatted error response
   */
  static error(message, code = 'INTERNAL_ERROR', details = null) {
    const response = {
      success: false,
      error: {
        code,
        message
      }
    };

    if (details) {
      response.error.details = details;
    }

    return response;
  }

  /**
   * Paginated response
   * @param {Array} items - Array of items
   * @param {number} page - Current page
   * @param {number} perPage - Items per page
   * @param {number} total - Total items
   * @returns {Object} Formatted paginated response
   */
  static paginated(items, page, perPage, total) {
    return {
      success: true,
      data: items,
      meta: {
        pagination: {
          page: parseInt(page),
          per_page: parseInt(perPage),
          total_items: total,
          total_pages: Math.ceil(total / perPage),
          has_next: page < Math.ceil(total / perPage),
          has_prev: page > 1
        }
      }
    };
  }

  /**
   * Created response (201)
   * @param {*} resource - Created resource
   * @param {string} message - Optional success message
   * @returns {Object} Formatted creation response
   */
  static created(resource, message = 'Recurso creado exitosamente') {
    return {
      success: true,
      message,
      data: resource
    };
  }

  /**
   * Updated response (200)
   * @param {*} resource - Updated resource
   * @param {string} message - Optional success message
   * @returns {Object} Formatted update response
   */
  static updated(resource, message = 'Recurso actualizado exitosamente') {
    return {
      success: true,
      message,
      data: resource
    };
  }

  /**
   * Deleted response (200 with data or 204 without data)
   * @param {*} resource - Optional deleted resource data
   * @param {string} message - Optional success message
   * @returns {Object} Formatted deletion response
   */
  static deleted(resource = null, message = 'Recurso eliminado exitosamente') {
    if (resource) {
      return {
        success: true,
        message,
        data: {
          deleted: resource
        }
      };
    }
    
    // For 204 No Content, return null (controller should use res.status(204).send())
    return null;
  }

  /**
   * Validation error response (422)
   * @param {Array|Object} errors - Validation errors
   * @returns {Object} Formatted validation error
   */
  static validationError(errors) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Error de validación',
        details: Array.isArray(errors) ? errors : [errors]
      }
    };
  }

  /**
   * Conflict error response (409)
   * @param {string} message - Conflict message
   * @param {*} details - Optional conflict details
   * @returns {Object} Formatted conflict error
   */
  static conflict(message, details = null) {
    return {
      success: false,
      error: {
        code: 'CONFLICT',
        message,
        ...(details && { details })
      }
    };
  }

  /**
   * Not found error response (404)
   * @param {string} resource - Resource type
   * @param {*} identifier - Resource identifier
   * @returns {Object} Formatted not found error
   */
  static notFound(resource = 'Recurso', identifier = null) {
    const message = identifier 
      ? `${resource} con identificador '${identifier}' no encontrado`
      : `${resource} no encontrado`;

    return {
      success: false,
      error: {
        code: 'NOT_FOUND',
        message
      }
    };
  }

  /**
   * Unauthorized error response (401)
   * @param {string} message - Optional custom message
   * @returns {Object} Formatted unauthorized error
   */
  static unauthorized(message = 'No autorizado. Token inválido o expirado') {
    return {
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message
      }
    };
  }

  /**
   * Forbidden error response (403)
   * @param {string} message - Optional custom message
   * @returns {Object} Formatted forbidden error
   */
  static forbidden(message = 'Acceso prohibido. Permisos insuficientes') {
    return {
      success: false,
      error: {
        code: 'FORBIDDEN',
        message
      }
    };
  }

  /**
   * Bad request error response (400)
   * @param {string} message - Error message
   * @param {*} details - Optional error details
   * @returns {Object} Formatted bad request error
   */
  static badRequest(message, details = null) {
    return {
      success: false,
      error: {
        code: 'BAD_REQUEST',
        message,
        ...(details && { details })
      }
    };
  }

  /**
   * Internal server error response (500)
   * @param {string} message - Optional custom message
   * @param {Error} error - Optional error object (for logging)
   * @returns {Object} Formatted server error
   */
  static serverError(message = 'Error interno del servidor', error = null) {
    // Log error for debugging (don't expose to client)
    if (error && process.env.NODE_ENV === 'development') {
      console.error('Server Error:', error);
    }

    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message,
        ...(process.env.NODE_ENV === 'development' && error && { 
          stack: error.stack 
        })
      }
    };
  }
}

module.exports = ResponseFormatter;