// auth.js - Manejo de autenticación

// API_URL dinámico: usa el backend desplegado cuando el frontend está en Vercel,
// y localhost en desarrollo. Ajusta el dominio si cambias el deploy.
const API_URL = (function(){
    const host = window.location.hostname;
    // Frontend en Vercel (dominio de producción)
    if (host === 'medical-appointment-frontend-ten.vercel.app') {
        return 'https://medical-appointment-backend-2xx0.onrender.com/api';
    }
    // Por defecto usar localhost para desarrollo local
    return 'http://localhost:3000/api';
})();

// Función global de logout
window.logout = function() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/panels/login.html';
}

class Auth {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = JSON.parse(localStorage.getItem('user'));
    }

    // Login
    async login(email, password, role) {
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, role })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error en el login');
            }

            // Guardar token y datos del usuario
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            
            // Redirigir según el rol
            this.redirectByRole(data.user.role);
            
            return data;
        } catch (error) {
            console.error('Error en login:', error);
            throw error;
        }
    }

    // Logout
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '../panels/login.html'; // Ruta relativa
    }

    // Verificar si está autenticado
    isAuthenticated() {
        return !!this.token;
    }

    // Obtener rol del usuario
    getRole() {
        return this.user?.role || null;
    }

    // Redirigir según rol
    redirectByRole(role) {
        switch(role) {
            case 'admin':
                window.location.href = '/panels/Admin/DashboardAdmin.html';
                break;
            case 'doctor':
                window.location.href = '/panels/doctor/doctorHome.html';
                break;
            case 'patient':
                window.location.href = '/panels/patient/patientDashboard.html';
                break;
            default:
                console.error('Rol no reconocido');
        }
    }
}

// Crear instancia global
window.auth = new Auth();