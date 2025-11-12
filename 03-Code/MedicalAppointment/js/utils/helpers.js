
// ====== AUTENTICACIÓN ======
// Obtener token de autenticación
const getAuthToken = () => {
    return localStorage.getItem('token');
};

// Obtener usuario actual
const getCurrentUser = () => {
    return JSON.parse(localStorage.getItem('user') || 'null');
};

// Verificar autenticación
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

// Hacer peticiones autenticadas al backend
const authenticatedFetch = async (url, options = {}) => {
    const token = getAuthToken();
    
    if (!token) {
        const baseUrl = window.location.pathname.split('/panels')[0];
        window.location.href = baseUrl + '/panels/login.html';
        throw new Error('No authentication token');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json',
        ...options.headers
    };
    
    const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'include',
        mode: 'cors'
    });
    
    // Si el token es inválido o expiró, redirigir al login
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        const baseUrl = window.location.pathname.split('/panels')[0];
        window.location.href = baseUrl + '/panels/login.html';
        throw new Error('Unauthorized');
    }
    
    return response;
};

// ====== FORMATEO ======
// Formatear fecha
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

// Formatear hora
const formatTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
    });
};

// ====== CÁLCULOS ======
// Calcular edad
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
// Validar email
const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// ====== UI ======
// Mostrar alerta
const showAlert = (message, type = 'info') => {
    alert(message);
};

// Mostrar loading
const showLoading = (element) => {
    if (element) {
        element.innerHTML = '<div class="loading">Cargando...</div>';
    }
};

// Ocultar loading
const hideLoading = (element, message = '') => {
    if (element) {
        element.innerHTML = message;
    }
};

// ====== LOGOUT GLOBAL ======
window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    const baseUrl = window.location.pathname.split('/panels')[0];
    window.location.href = baseUrl + '/panels/login.html';
};
