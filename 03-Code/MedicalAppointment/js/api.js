// Configuración de API
const API_URL = window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://medical-appointment-backend-2xx0.onrender.com/api';

// Helper para headers con autenticación
const getAuthHeaders = () => {
    const token = Helpers.getAuthToken();
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
};

// Helper para hacer peticiones autenticadas
const fetchWithAuth = async (url, options = {}) => {
    const headers = getAuthHeaders();
    const response = await fetch(url, {
        ...options,
        headers: {
            ...headers,
            ...(options.headers || {})
        }
    });

  // Si el token expiró, redirigir al login
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/panels/login.html';
    throw new Error('Sesión expirada');
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Error en la petición');
  }

  return response;
};

// ========== API de Pacientes ==========
window.PatientAPI = {
  // Obtener perfil
  getProfile: async () => {
    const response = await fetchWithAuth(`${API_URL}/patients/profile`);
    return response.json();
  },

  // Actualizar perfil
  updateProfile: async (profileData) => {
    const response = await fetchWithAuth(`${API_URL}/patients/profile`, {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
    return response.json();
  },

  // Cambiar contraseña
  changePassword: async (currentPassword, newPassword) => {
    const response = await fetchWithAuth(`${API_URL}/patients/change-password`, {
      method: 'POST',
      body: JSON.stringify({
        current_password: currentPassword,
        new_password: newPassword
      })
    });
    return response.json();
  }
};

// ========== API de Doctores ==========
window.DoctorAPI = {
  // Obtener especialidades
  getSpecialties: async () => {
    const response = await fetchWithAuth(`${API_URL}/doctors/specialties`);
    return response.json();
  },

  // Obtener doctores (con filtro opcional)
  getDoctors: async (specialtyId = null) => {
    const url = specialtyId 
      ? `${API_URL}/doctors?specialty_id=${specialtyId}`
      : `${API_URL}/doctors`;
    const response = await fetchWithAuth(url);
    return response.json();
  },

  // Obtener detalle de doctor
  getDoctorById: async (doctorId) => {
    const response = await fetchWithAuth(`${API_URL}/doctors/${doctorId}`);
    return response.json();
  },

  // Obtener slots disponibles
  getAvailableSlots: async (doctorId, date) => {
    const response = await fetchWithAuth(
      `${API_URL}/appointments/doctors/${doctorId}/available-slots?date=${date}`
    );
    return response.json();
  }
};

// ========== API de Citas ==========
window.AppointmentAPI = {
  // Listar citas del paciente
  getAppointments: async (filters = {}) => {
    let url = `${API_URL}/appointments/patient?`;
    if (filters.status) url += `status=${filters.status}&`;
    if (filters.upcoming) url += `upcoming=true&`;
    
    const response = await fetchWithAuth(url);
    return response.json();
  },

  // Obtener detalle de cita
  getAppointmentById: async (appointmentId) => {
    const response = await fetchWithAuth(`${API_URL}/appointments/${appointmentId}`);
    return response.json();
  },

  // Crear cita
  createAppointment: async (appointmentData) => {
    const response = await fetchWithAuth(`${API_URL}/appointments`, {
      method: 'POST',
      body: JSON.stringify(appointmentData)
    });
    return response.json();
  },

  // Cancelar cita
  cancelAppointment: async (appointmentId) => {
    const response = await fetchWithAuth(`${API_URL}/appointments/${appointmentId}`, {
      method: 'DELETE'
    });
    return response.json();
  },

  // Reagendar cita
  rescheduleAppointment: async (appointmentId, newScheduledStart) => {
    const response = await fetchWithAuth(
      `${API_URL}/appointments/${appointmentId}/reschedule`,
      {
        method: 'PUT',
        body: JSON.stringify({ new_scheduled_start: newScheduledStart })
      }
    );
    return response.json();
  }
};

// ========== API de Historial Médico ==========
window.MedicalRecordAPI = {
  // Obtener registro médico
  getMedicalRecord: async () => {
    const response = await fetchWithAuth(`${API_URL}/medical-records`);
    return response.json();
  },

  // Obtener notas de consultas
  getConsultationNotes: async () => {
    const response = await fetchWithAuth(`${API_URL}/medical-records/consultation-notes`);
    return response.json();
  },

  // Obtener nota de consulta específica
  getConsultationNoteByAppointment: async (appointmentId) => {
    const response = await fetchWithAuth(
      `${API_URL}/medical-records/consultation-notes/${appointmentId}`
    );
    return response.json();
  },

  // Obtener resumen
  getHistorySummary: async () => {
    const response = await fetchWithAuth(`${API_URL}/medical-records/summary`);
    return response.json();
  },

  // Obtener reportes de laboratorio
  getLabReports: async () => {
    const response = await fetchWithAuth(`${API_URL}/medical-records/lab-reports`);
    return response.json();
  }
};

// ========== Función de prueba ==========
async function testBackendConnection() {
  try {
    const response = await fetch(`${API_URL.replace('/api', '')}/api/test`);
    const data = await response.json();
    console.log('✅ Backend conectado:', data);
    return true;
  } catch (error) {
    console.error('❌ Error conectando con backend:', error);
    return false;
  }
}

// Probar conexión al cargar
document.addEventListener('DOMContentLoaded', () => {
  testBackendConnection();
});

// ========== EXTENDER HELPERS (NO SOBRESCRIBIR) ==========
// helpers.js ya define window.Helpers con todas las funciones base
// Solo agregamos funciones adicionales si es necesario
if (!window.Helpers) {
  window.Helpers = {};
}

// Asegurarnos de que estas funciones estén disponibles
Object.assign(window.Helpers, {
  checkAuth,
  showAlert,
  formatDate,
  formatTime,
  calculateAge,
  isValidEmail,
  showLoading,
  hideLoading,
  getAuthToken,
  getCurrentUser
});

