// Appointment Management System - Connected to Backend API
class AppointmentManager {
    constructor() {
        this.appointments = [];
        this.currentEditId = null;
        this.apiBaseUrl = this.getApiBaseUrl();
        this.init();
    }

    getApiBaseUrl() {
        return window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1'
            ? 'http://localhost:3000/api'
            : 'https://t6-awd-medical-appointment-web-system.onrender.com/api';
    }

    getAuthHeaders() {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    }

    async fetchWithAuth(url, options = {}) {
        const headers = this.getAuthHeaders();
        const response = await fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...(options.headers || {})
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/panels/login.html';
            throw new Error('Sesión expirada');
        }

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || 'Error en la petición');
        }

        return response;
    }

    async init() {
        try {
            await this.loadAppointments();
            this.setupEventListeners();
        } catch (error) {
            console.error('Error initializing appointment manager:', error);
            this.showToast('Error al cargar las citas', 'error');
        }
    }

    // API methods - Replace localStorage with API calls
    async loadAppointments() {
        try {
            const response = await this.fetchWithAuth(`${this.apiBaseUrl}/appointments/patient`);
            const data = await response.json();
            
            // Transform API data to match component structure
            this.appointments = data.map(appointment => ({
                id: appointment.id,
                patientName: `${appointment.patients?.first_name || ''} ${appointment.patients?.last_name || ''}`.trim(),
                doctorName: `Dr. ${appointment.doctors?.users?.first_name || ''} ${appointment.doctors?.users?.last_name || ''}`.trim(),
                specialty: appointment.doctors?.specialties?.name || 'No especificado',
                date: appointment.scheduled_start?.split('T')[0] || '',
                time: appointment.scheduled_start?.split('T')[1]?.substring(0, 5) || '',
                office: appointment.doctors?.office || 'Por confirmar',
                status: appointment.status_code || 'pending',
                reason: appointment.reason || 'Consulta general',
                createdAt: appointment.created_at
            }));

            this.renderAppointments();
            return this.appointments;
        } catch (error) {
            console.error('Error loading appointments:', error);
            this.showToast('Error al cargar las citas: ' + error.message, 'error');
            this.appointments = [];
            return [];
        }
    }

    async addAppointment(appointmentData) {
        try {
            // Validate date before sending
            if (!this.validateDate(appointmentData.date, appointmentData.time)) {
                return false;
            }

            // Prepare data for API
            const requestBody = {
                doctor_id: appointmentData.doctorId, // You'll need to get doctor ID
                scheduled_start: `${appointmentData.date}T${appointmentData.time}:00`,
                scheduled_end: this.calculateEndTime(appointmentData.date, appointmentData.time),
                reason: appointmentData.reason,
                status_code: 'pending'
            };

            const response = await this.fetchWithAuth(`${this.apiBaseUrl}/appointments`, {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            const result = await response.json();
            
            this.showToast('Cita agendada exitosamente', 'success');
            await this.loadAppointments(); // Reload from API
            
            return true;
        } catch (error) {
            console.error('Error adding appointment:', error);
            this.showToast('Error al agendar la cita: ' + error.message, 'error');
            return false;
        }
    }

    calculateEndTime(date, time) {
        const start = new Date(`${date}T${time}:00`);
        start.setMinutes(start.getMinutes() + 30); // 30 min appointment
        return start.toISOString();
    }

    async updateAppointment(id, appointmentData) {
        try {
            const requestBody = {
                scheduled_start: `${appointmentData.date}T${appointmentData.time}:00`,
                scheduled_end: this.calculateEndTime(appointmentData.date, appointmentData.time),
                reason: appointmentData.reason
            };

            await this.fetchWithAuth(`${this.apiBaseUrl}/appointments/${id}/reschedule`, {
                method: 'PUT',
                body: JSON.stringify(requestBody)
            });

            this.showToast('Cita actualizada exitosamente', 'success');
            await this.loadAppointments();
        } catch (error) {
            console.error('Error updating appointment:', error);
            this.showToast('Error al actualizar la cita: ' + error.message, 'error');
        }
    }

    async cancelAppointment(id) {
        try {
            await this.fetchWithAuth(`${this.apiBaseUrl}/appointments/${id}`, {
                method: 'DELETE'
            });

            this.showToast('Cita cancelada exitosamente', 'success');
            await this.loadAppointments();
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            this.showToast('Error al cancelar la cita: ' + error.message, 'error');
        }
    }

    async getAppointmentById(id) {
        try {
            const response = await this.fetchWithAuth(`${this.apiBaseUrl}/appointments/${id}`);
            return await response.json();
        } catch (error) {
            console.error('Error fetching appointment:', error);
            return null;
        }
    }

    // Validation methods
    validateDate(date, time) {
        const appointmentDateTime = new Date(`${date}T${time}`);
        const now = new Date();
        
        if (appointmentDateTime < now) {
            this.showToast('No puedes agendar citas en el pasado', 'error');
            return false;
        }
        return true;
    }

    // Render methods
    renderAppointments(filter = 'upcoming') {
        const container = document.getElementById('appointmentsListContainer');
        if (!container) return;

        let filteredAppointments = this.filterAppointments(filter);
        
        if (filteredAppointments.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #999;">
                    <i class="fas fa-calendar-times" style="font-size: 48px; margin-bottom: 10px;"></i>
                    <p>No hay citas ${this.getFilterLabel(filter)}</p>
                </div>
            `;
            return;
        }

        container.innerHTML = filteredAppointments.map(appointment => `
            <div class="appointment-detail-card ${this.getAppointmentClass(appointment.status)}">
                <div class="appointment-header">
                    <div class="appointment-date">
                        <div class="day">${new Date(appointment.date).getDate()}</div>
                        <div class="month">${this.getMonthName(new Date(appointment.date).getMonth())}</div>
                    </div>
                    <div class="appointment-info">
                        <h3>${appointment.doctorName}</h3>
                        <p class="specialty">${appointment.specialty}</p>
                        <p class="time"><i class="fas fa-clock"></i> ${this.formatTime(appointment.time)}</p>
                        <p class="location"><i class="fas fa-map-marker-alt"></i> ${appointment.office}</p>
                    </div>
                    <div class="appointment-status">
                        <span class="badge ${this.getStatusClass(appointment.status)}">${this.getStatusText(appointment.status)}</span>
                    </div>
                </div>
                <div class="appointment-actions">
                    ${appointment.status !== 'cancelled' && appointment.status !== 'completed' ? `
                        <button class="btn-secondary" onclick="appointmentManager.rescheduleAppointment(${appointment.id})">Reprogramar</button>
                        <button class="btn-danger" onclick="appointmentManager.confirmCancel(${appointment.id})">Cancelar</button>
                    ` : ''}
                    <button class="btn-info" onclick="appointmentManager.viewAppointmentDetails(${appointment.id})">Ver Detalles</button>
                </div>
            </div>
        `).join('');
    }

    filterAppointments(filter) {
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        switch(filter) {
            case 'upcoming':
                return this.appointments
                    .filter(a => new Date(a.date) >= now && a.status !== 'cancelled' && a.status !== 'completed')
                    .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
            
            case 'past':
                return this.appointments
                    .filter(a => new Date(a.date) < now || a.status === 'completed')
                    .sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));
            
            case 'cancelled':
                return this.appointments
                    .filter(a => a.status === 'cancelled')
                    .sort((a, b) => new Date(b.date + 'T' + b.time) - new Date(a.date + 'T' + a.time));
            
            default:
                return this.appointments;
        }
    }

    // Helper methods
    getMonthName(month) {
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        return months[month];
    }

    formatTime(time) {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${hour12}:${minutes} ${ampm}`;
    }

    getAppointmentClass(status) {
        const classes = {
            'confirmed': 'upcoming',
            'pending': 'upcoming',
            'scheduled': 'upcoming',
            'cancelled': 'cancelled',
            'completed': 'past'
        };
        return classes[status] || '';
    }

    getStatusClass(status) {
        const classes = {
            'confirmed': 'confirmed',
            'pending': 'pending',
            'scheduled': 'pending',
            'cancelled': 'cancelled',
            'completed': 'completed'
        };
        return classes[status] || 'pending';
    }

    getStatusText(status) {
        const texts = {
            'confirmed': 'Confirmada',
            'pending': 'Pendiente',
            'scheduled': 'Agendada',
            'cancelled': 'Cancelada',
            'completed': 'Completada'
        };
        return texts[status] || status;
    }

    getFilterLabel(filter) {
        const labels = {
            'upcoming': 'próximas',
            'past': 'pasadas',
            'cancelled': 'canceladas'
        };
        return labels[filter] || '';
    }

    // Modal methods
    viewAppointmentDetails(id) {
        const appointment = this.appointments.find(a => a.id === id);
        if (!appointment) return;

        const modalContent = `
            <div class="appointment-details">
                <h3><i class="fas fa-calendar-check"></i> Detalles de la Cita</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Paciente:</strong> ${appointment.patientName}
                    </div>
                    <div class="detail-item">
                        <strong>Doctor:</strong> ${appointment.doctorName}
                    </div>
                    <div class="detail-item">
                        <strong>Especialidad:</strong> ${appointment.specialty}
                    </div>
                    <div class="detail-item">
                        <strong>Fecha:</strong> ${new Date(appointment.date).toLocaleDateString('es-EC', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                        })}
                    </div>
                    <div class="detail-item">
                        <strong>Hora:</strong> ${this.formatTime(appointment.time)}
                    </div>
                    <div class="detail-item">
                        <strong>Consultorio:</strong> ${appointment.office}
                    </div>
                    <div class="detail-item">
                        <strong>Motivo:</strong> ${appointment.reason}
                    </div>
                    <div class="detail-item">
                        <strong>Estado:</strong> <span class="badge ${this.getStatusClass(appointment.status)}">${this.getStatusText(appointment.status)}</span>
                    </div>
                </div>
            </div>
        `;

        this.showCustomModal('Información de la Cita', modalContent);
    }

    rescheduleAppointment(id) {
        const appointment = this.appointments.find(a => a.id === id);
        if (!appointment) return;

        this.currentEditId = id;
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Reprogramar Cita';
        
        // Fill form with current data
        document.getElementById('appointmentDoctor').value = appointment.doctorName;
        document.getElementById('appointmentSpecialty').value = appointment.specialty;
        document.getElementById('appointmentDate').value = appointment.date;
        document.getElementById('appointmentTime').value = appointment.time;
        document.getElementById('appointmentReason').value = appointment.reason;

        openAppointmentModal();
    }

    confirmCancel(id) {
        const appointment = this.appointments.find(a => a.id === id);
        if (!appointment) return;

        const message = `¿Está seguro que desea cancelar la cita con <strong>${appointment.doctorName}</strong> el ${new Date(appointment.date).toLocaleDateString('es-EC')}?`;
        
        this.showConfirmModal(message, () => {
            this.cancelAppointment(id);
            closeConfirmModal();
        });
    }

    // Event listeners
    setupEventListeners() {
        // Tab buttons
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach((btn, index) => {
            btn.addEventListener('click', () => {
                tabButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const filters = ['upcoming', 'past', 'cancelled'];
                this.renderAppointments(filters[index]);
            });
        });

        // New appointment form
        const form = document.getElementById('appointmentForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        // New appointment button
        const newAppointmentBtn = document.querySelector('.btn-primary');
        if (newAppointmentBtn) {
            newAppointmentBtn.addEventListener('click', () => {
                this.currentEditId = null;
                openAppointmentModal();
            });
        }
    }

    async handleFormSubmit() {
        const appointmentData = {
            doctorId: document.getElementById('appointmentDoctor').value, // Need to store doctor ID
            specialty: document.getElementById('appointmentSpecialty').value,
            date: document.getElementById('appointmentDate').value,
            time: document.getElementById('appointmentTime').value,
            reason: document.getElementById('appointmentReason').value
        };

        // Validate date
        if (!this.validateDate(appointmentData.date, appointmentData.time)) {
            return;
        }

        if (this.currentEditId) {
            await this.updateAppointment(this.currentEditId, appointmentData);
        } else {
            await this.addAppointment(appointmentData);
        }

        closeAppointmentModal();
    }

    // Toast notification
    showToast(message, type = 'success') {
        const existingToast = document.querySelector('.toast');
        if (existingToast) {
            existingToast.remove();
        }

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? 'fa-check-circle' : 
                     type === 'error' ? 'fa-times-circle' : 'fa-exclamation-circle';
        
        toast.innerHTML = `
            <i class="fas ${icon}"></i>
            <div class="toast-message">${message}</div>
            <span class="toast-close" onclick="this.parentElement.remove()">&times;</span>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    showCustomModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content confirm-modal">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <span class="close" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open')">&times;</span>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-primary" onclick="this.closest('.modal').remove(); document.body.classList.remove('modal-open')">
                        <i class="fas fa-check"></i> Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.classList.add('modal-open');
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.classList.remove('modal-open');
                modal.remove();
            }
        });
    }

    showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        if (!modal) {
            this.createConfirmModal();
        }
        
        document.getElementById('confirmMessage').innerHTML = message;
        
        const confirmButton = document.getElementById('confirmButton');
        const newButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newButton, confirmButton);
        
        newButton.addEventListener('click', onConfirm);
        
        document.body.classList.add('modal-open');
        document.getElementById('confirmModal').classList.add('show');
    }

    createConfirmModal() {
        const modalHTML = `
            <div id="confirmModal" class="modal">
                <div class="modal-content confirm-modal">
                    <div class="modal-header">
                        <h2>Confirmar Acción</h2>
                        <span class="close" onclick="closeConfirmModal()">&times;</span>
                    </div>
                    <div class="modal-body">
                        <p id="confirmMessage"></p>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn-secondary" onclick="closeConfirmModal()">
                            <i class="fas fa-times"></i> Cancelar
                        </button>
                        <button type="button" id="confirmButton" class="btn-danger">
                            <i class="fas fa-check"></i> Confirmar
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    // Get next appointment for dashboard
    getNextAppointment() {
        const now = new Date();
        const upcomingAppointments = this.appointments
            .filter(a => new Date(a.date + 'T' + a.time) > now && a.status !== 'cancelled')
            .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
        
        return upcomingAppointments[0] || null;
    }
}

// Global functions
function openAppointmentModal() {
    const modal = document.getElementById('appointmentModal');
    if (modal) {
        document.getElementById('appointmentForm').reset();
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('appointmentDate').setAttribute('min', today);
        
        document.body.classList.add('modal-open');
        modal.classList.add('show');
    }
}

function closeAppointmentModal() {
    const modal = document.getElementById('appointmentModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.classList.remove('modal-open');
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const appointmentModal = document.getElementById('appointmentModal');
    const confirmModal = document.getElementById('confirmModal');
    
    if (event.target === appointmentModal) {
        closeAppointmentModal();
    }
    if (event.target === confirmModal) {
        closeConfirmModal();
    }
}

// Initialize when DOM is ready
let appointmentManager;
document.addEventListener('DOMContentLoaded', () => {
    appointmentManager = new AppointmentManager();
});