import axios from 'axios';

// API URL desde variable de entorno o default a producción
const API_URL = import.meta.env.VITE_API_URL || 'https://medical-appointment-backend-2xx0.onrender.com';

// Use relative /api during development to hit the Vite proxy (avoids CORS).
const baseURL = import.meta.env.DEV ? '/api' : `${API_URL}/api`;

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar errores
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Solo redirigir si no estamos ya en login
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ========== AUTH (usa /auth endpoints según tus routes) ==========
export const authAPI = {
  login: (email, password) => 
    api.post('/auth/login', { email, password }),
  
  register: (userData) => 
    api.post('/auth/register', userData),

  logout: () => 
    api.post('/auth/logout'), 
  
  googleAuth: () => {
    window.location.href = `${API_URL}/api/auth/google`;
  },

  me: () => api.get('/auth/me'),
};

// ========== PASSWORD RESETS ==========
export const passwordAPI = {
  requestReset: (email) => 
    api.post('/password-resets', { email }),
  
  resetPassword: (token, password, confirmPassword) => 
    api.patch(`/password-resets/${token}`, { password, confirmPassword }),
};

// ========== PATIENTS ==========
export const patientAPI = {
  getProfile: () => 
    api.get('/patients/profile'),
  
  updateProfile: (data) => 
    api.put('/patients/profile', data),
  
  completeProfile: (data) => 
    api.put('/patients/complete-profile', data),
  
  changePassword: (currentPassword, newPassword) => 
    api.post('/patients/change-password', { currentPassword, newPassword }),
  
  // Admin endpoints
  getList: () => 
    api.get('/patients'),
  
  create: (data) => 
    api.post('/patients', data),
  
  getById: (id) => 
    api.get(`/patients/${id}`),
  
  update: (id, data) => 
    api.put(`/patients/${id}`, data),
  
  delete: (id) => 
    api.delete(`/patients/${id}`),
};

// ========== DOCTORS ==========
export const doctorAPI = {
  getAll: () => 
    api.get('/doctors'),
  
  getById: (id) => 
    api.get(`/doctors/${id}`),
  
  create: (data) => 
    api.post('/doctors', data),
  
  update: (id, data) => 
    api.put(`/doctors/${id}`, data),
  
  delete: (id) => 
    api.delete(`/doctors/${id}`),
  
  getStats: () => 
    api.get('/doctors/stats'),
  
  filter: (params) => 
    api.get('/doctors/filter', { params }),
  
  getBySpecialty: (specialtyId) => 
    api.get(`/doctors/specialty/${specialtyId}`),
  
  getSchedules: (doctorId) => 
    api.get(`/doctors/${doctorId}/schedules`),
  
  updateStatus: (id, status) => 
    api.patch(`/doctors/${id}/status`, { status }),
};

// ========== SPECIALTIES ==========
export const specialtyAPI = {
  getAll: () => 
    api.get('/specialties'),
  
  getActive: () => 
    api.get('/specialties/active'),
  
  getById: (id) => 
    api.get(`/specialties/${id}`),
  
  create: (data) => 
    api.post('/specialties', data),
  
  update: (id, data) => 
    api.put(`/specialties/${id}`, data),
  
  delete: (id) => 
    api.delete(`/specialties/${id}`),
  
  getStats: () => 
    api.get('/specialties/stats'),
  
  filter: (params) => 
    api.get('/specialties/filter', { params }),
  
  getWithDoctors: (id) => 
    api.get(`/specialties/${id}/doctors`),
  
  updateStatus: (id, status) => 
    api.patch(`/specialties/${id}/status`, { status }),
};

// ========== APPOINTMENTS ==========
export const appointmentAPI = {
  // Patient endpoints
  create: (data) => 
    api.post('/appointments', data),
  
  getPatientAppointments: () => 
    api.get('/appointments/patient'),
  
  getPatientStats: () => 
    api.get('/appointments/patient/stats'),
  
  getById: (id) => 
    api.get(`/appointments/patient/${id}`),
  
  update: (id, data) => 
    api.put(`/appointments/${id}`, data),
  
  reschedule: (id, data) => 
    api.patch(`/appointments/${id}/reschedule`, data),
  
  cancel: (id) => 
    api.delete(`/appointments/${id}`),
  
  // Doctor endpoints
  getDoctorAppointments: () => 
    api.get('/appointments/doctor'),
  
  createByDoctor: (data) => 
    api.post('/appointments/doctor/create', data),
  
  updateStatus: (id, status) => 
    api.patch(`/appointments/${id}/status`, { status }),
  
  confirm: (id) => 
    api.post(`/appointments/${id}/confirm`),
  
  complete: (id) => 
    api.post(`/appointments/${id}/complete`),
  
  markNoShow: (id) => 
    api.post(`/appointments/${id}/no-show`),
  
  // Common endpoints
  getAvailableSlots: (doctorId, date) => 
    api.get(`/appointments/doctors/${doctorId}/available-slots`, { params: { date } }),
  
  getUpcoming: () => 
    api.get('/appointments/upcoming'),
  
  // Admin endpoints
  getAll: () => 
    api.get('/appointments'),
  
  forceDelete: (id) => 
    api.delete(`/appointments/${id}/force`),
};

// ========== MEDICAL RECORDS ==========
export const medicalRecordAPI = {
  get: () => 
    api.get('/medical-records'),
  
  getConsultationNotes: () => 
    api.get('/medical-records/consultation-notes'),
  
  getConsultationNoteByAppointment: (appointmentId) => 
    api.get(`/medical-records/consultation-notes/${appointmentId}`),
  
  getSummary: () => 
    api.get('/medical-records/summary'),
  
  getLabReports: () => 
    api.get('/medical-records/lab-reports'),
  
  getPatientHistory: () => 
    api.get('/medical-records/consultation-notes'),
  
  getRecentHistory: () => 
    api.get('/medical-records/consultation-notes'),
  
  getHealthSummary: () => 
    api.get('/medical-records/summary'),
};

// ========== LAB RESULTS ==========
export const labAPI = {
  getAll: () => 
    api.get('/medical-record/lab-reports'),
  
  getPatientResults: () => 
    api.get('/medical-record/lab-reports'),
  
  getById: (id) => 
    api.get(`/medical-record/lab-reports/${id}`),
  
  download: (id) => 
    api.get(`/medical-record/lab-reports/${id}/download`, { responseType: 'blob' }),
  
  downloadAll: () => 
    api.get('/medical-record/lab-reports/download-all', { responseType: 'blob' }),
};

// ========== PRESCRIPTIONS ==========
export const prescriptionAPI = {
  // Patient endpoints
  getPatientPrescriptions: () => 
    api.get('/prescriptions/patient'),
  
  // Doctor endpoints
  getAll: () => 
    api.get('/prescriptions'),
  
  getPatientPrescriptions: () => 
    api.get('/prescriptions'),
  
  create: (data) => 
    api.post('/prescriptions', data),
  
  getById: (id) => 
    api.get(`/prescriptions/${id}`),
  
  update: (id, data) => 
    api.put(`/prescriptions/${id}`, data),
  
  delete: (id) => 
    api.delete(`/prescriptions/${id}`),
};

// ========== MESSAGES ==========
export const messageAPI = {
  getAll: () => 
    api.get('/messages'),
  
  getPatientMessages: () => 
    api.get('/messages'),
  
  getConversations: () => 
    api.get('/messages/conversations'),
  
  getConversation: (userId) => 
    api.get(`/messages/conversations/${userId}`),
  
  send: (data) => 
    api.post('/messages', data),
  
  markAsRead: (messageId) => 
    api.patch(`/messages/${messageId}/read`),
  
  delete: (messageId) => 
    api.delete(`/messages/${messageId}`),
};

// ========== REMINDERS ==========
export const reminderAPI = {
  schedule: (data) => 
    api.post('/reminders/schedule', data),
  
  sendNow: (data) => 
    api.post('/reminders/send-now', data),
  
  getAll: () => 
    api.get('/reminders'),
  
  getById: (id) => 
    api.get(`/reminders/${id}`),
  
  update: (id, data) => 
    api.put(`/reminders/${id}`, data),
  
  delete: (id) => 
    api.delete(`/reminders/${id}`),
};

// ========== REPORTS ==========
export const reportAPI = {
  getAppointments: (params) => 
    api.get('/reports/appointments', { params }),
  
  getWeeklyActivity: () => 
    api.get('/reports/weekly-activity'),
  
  getStatistics: (params) => 
    api.get('/reports/statistics', { params }),
  
  getSystemStatistics: () => 
    api.get('/reports/system-statistics'),
  
  exportToCSV: (params) => 
    api.get('/reports/export/csv', { params, responseType: 'blob' }),
};

// ========== AUDIT LOGS ==========
export const auditLogAPI = {
  getAll: (params) => 
    api.get('/audit-logs', { params }),
  
  getStats: () => 
    api.get('/audit-logs/stats'),
  
  getUserLogs: (userId) => 
    api.get(`/audit-logs/user/${userId}`),
  
  getById: (id) => 
    api.get(`/audit-logs/${id}`),
};

export default api;