// ====== AUTENTICACIÓN ======
const getAuthToken = () => {
    return localStorage.getItem('token');
};

const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user') || 'null');
};

const checkAuth = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    if (!token || !user) {
        const baseUrl = window.location.pathname.split('/panels')[0];
        window.location.href = baseUrl + '/panels/login.html';
        return false;
    }
    return true;
};

// ====== PETICIÓN AUTENTICADA OPCIONAL ======
// Si solo usas fetchWithAuth en api.js, no declares authenticatedFetch aquí

// ====== FORMATEO ======
const formatDate = (dateString, includeTime = false) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    return date.toLocaleDateString('es-ES', options);
};

const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

// ====== CÁLCULOS ======
const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }
    return age;
};

// ====== VALIDACIÓN ======
const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// ====== UI ======
const showAlert = (message, type = 'info') => {
    alert(message);
};

const showLoading = (element) => {
    if (element) {
        element.innerHTML = '<div class="loading">Cargando...</div>';
    }
};

const hideLoading = (element, message = '') => {
    if (element) {
        element.innerHTML = message;
    }
};

// ====== ESTADOS DE CITAS ======
const getAppointmentStatusColor = (statusCode) => {
    const colors = {
        'scheduled': 'primary',
        'confirmed': 'success',
        'completed': 'secondary',
        'cancelled': 'danger',
        'no_show': 'warning'
    };
    return colors[statusCode] || 'secondary';
};

const getAppointmentStatusLabel = (statusCode) => {
    const labels = {
        'scheduled': 'Programada',
        'confirmed': 'Confirmada',
        'completed': 'Completada',
        'cancelled': 'Cancelada',
        'no_show': 'No Asistió'
    };
    return labels[statusCode] || statusCode;
};

const truncateText = (text, maxLength) => {
    if (!text) return 'N/A';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
};

// ====== LOGOUT GLOBAL ======
window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    const baseUrl = window.location.pathname.split('/panels')[0];
    window.location.href = baseUrl + '/panels/login.html';
};

// ====== EXPORTAR HELPERS ======
window.Helpers = {
    checkAuth: checkAuth,
    showAlert: showAlert,
    formatDate: formatDate,
    formatTime: formatTime,
    calculateAge: calculateAge,
    isValidEmail: isValidEmail,
    showLoading: showLoading,
    hideLoading: hideLoading,
    getAuthToken: getAuthToken,
    getCurrentUser: getCurrentUser,
    getAppointmentStatusColor: getAppointmentStatusColor,
    getAppointmentStatusLabel: getAppointmentStatusLabel,
    truncateText: truncateText
};

// También exportar en window para acceso directo (por compatibilidad)
window.getAppointmentStatusColor = getAppointmentStatusColor;
window.getAppointmentStatusLabel = getAppointmentStatusLabel;

console.log('Helpers cargado:', window.Helpers);
