// Appointment Management System with LocalStorage
class AppointmentManager {
    constructor() {
        this.appointments = this.loadAppointments();
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.renderAppointments();
        this.setupEventListeners();
        this.checkUpcomingAppointments(); // Para notificaciones
    }

    // LocalStorage methods
    loadAppointments() {
        const stored = localStorage.getItem('clinicaAppointments');
        if (stored) {
            return JSON.parse(stored);
        }
        return this.getInitialData();
    }

    saveAppointments() {
        localStorage.setItem('clinicaAppointments', JSON.stringify(this.appointments));
        // Notificar cambios al sistema de notificaciones
        if (window.notificationManager) {
            window.notificationManager.checkAppointmentReminders();
        }
    }

    getInitialData() {
        return [
            {
                id: 1,
                patientName: 'Carlos Mendoza',
                doctorName: 'Dr. Sofia Pérez',
                specialty: 'Cardiología',
                date: '2025-10-25',
                time: '10:30',
                office: 'Consultorio 305',
                status: 'confirmed', // confirmed, pending, cancelled, completed
                reason: 'Control de rutina',
                createdAt: new Date('2025-10-20').toISOString()
            },
            {
                id: 2,
                patientName: 'Carlos Mendoza',
                doctorName: 'Dr. Juan Martínez',
                specialty: 'Medicina General',
                date: '2025-11-02',
                time: '15:00',
                office: 'Consultorio 102',
                status: 'pending',
                reason: 'Consulta general',
                createdAt: new Date('2025-10-22').toISOString()
            },
            {
                id: 3,
                patientName: 'Carlos Mendoza',
                doctorName: 'Dra. Ana López',
                specialty: 'Oftalmología',
                date: '2025-11-15',
                time: '09:00',
                office: 'Consultorio 201',
                status: 'confirmed',
                reason: 'Revisión de vista',
                createdAt: new Date('2025-10-23').toISOString()
            }
        ];
    }

    // CRUD Operations
    addAppointment(appointmentData) {
        const newId = this.appointments.length > 0 
            ? Math.max(...this.appointments.map(a => a.id)) + 1 
            : 1;
        
        // Validar disponibilidad antes de crear
        if (!this.checkAvailability(appointmentData.date, appointmentData.time, appointmentData.doctorName)) {
            this.showToast('El doctor no está disponible en ese horario', 'error');
            return false;
        }

        const newAppointment = {
            id: newId,
            ...appointmentData,
            patientName: 'Carlos Mendoza', // Usuario actual
            status: 'pending',
            createdAt: new Date().toISOString()
        };

        this.appointments.push(newAppointment);
        this.saveAppointments();
        this.renderAppointments();
        this.showToast('Cita agendada exitosamente', 'success');
        
        // Crear notificación
        if (window.notificationManager) {
            window.notificationManager.createAppointmentNotification(newAppointment);
        }
        
        return true;
    }

    updateAppointment(id, appointmentData) {
        const index = this.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
            this.appointments[index] = {
                ...this.appointments[index],
                ...appointmentData
            };
            this.saveAppointments();
            this.renderAppointments();
            this.showToast('Cita actualizada exitosamente', 'success');
        }
    }

    cancelAppointment(id) {
        const index = this.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
            this.appointments[index].status = 'cancelled';
            this.saveAppointments();
            this.renderAppointments();
            this.showToast('Cita cancelada exitosamente', 'success');
        }
    }

    deleteAppointment(id) {
        const index = this.appointments.findIndex(a => a.id === id);
        if (index !== -1) {
            this.appointments.splice(index, 1);
            this.saveAppointments();
            this.renderAppointments();
            this.showToast('Cita eliminada exitosamente', 'success');
        }
    }

    getAppointmentById(id) {
        return this.appointments.find(a => a.id === id);
    }

    // Validación de disponibilidad
    checkAvailability(date, time, doctorName) {
        const existingAppointment = this.appointments.find(a => 
            a.date === date && 
            a.time === time && 
            a.doctorName === doctorName &&
            a.status !== 'cancelled'
        );
        return !existingAppointment;
    }

    // Validar que la fecha no sea en el pasado
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
            'cancelled': 'cancelled',
            'completed': 'past'
        };
        return classes[status] || '';
    }

    getStatusClass(status) {
        const classes = {
            'confirmed': 'confirmed',
            'pending': 'pending',
            'cancelled': 'cancelled',
            'completed': 'completed'
        };
        return classes[status] || 'pending';
    }

    getStatusText(status) {
        const texts = {
            'confirmed': 'Confirmada',
            'pending': 'Pendiente',
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
        const appointment = this.getAppointmentById(id);
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
        const appointment = this.getAppointmentById(id);
        if (!appointment) return;

        this.currentEditId = id;
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Reprogramar Cita';
        
        // Llenar formulario con datos actuales
        document.getElementById('appointmentDoctor').value = appointment.doctorName;
        document.getElementById('appointmentSpecialty').value = appointment.specialty;
        document.getElementById('appointmentDate').value = appointment.date;
        document.getElementById('appointmentTime').value = appointment.time;
        document.getElementById('appointmentReason').value = appointment.reason;

        openAppointmentModal();
    }

    confirmCancel(id) {
        const appointment = this.getAppointmentById(id);
        if (!appointment) return;

        const message = `¿Está seguro que desea cancelar la cita con <strong>${appointment.doctorName}</strong> el ${new Date(appointment.date).toLocaleDateString('es-EC')}?`;
        
        this.showConfirmModal(message, () => {
            this.cancelAppointment(id);
            closeConfirmModal();
        });
    }

    // Verificar citas próximas para notificaciones
    checkUpcomingAppointments() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        this.appointments.forEach(appointment => {
            const appointmentDate = new Date(appointment.date);
            
            // Si la cita es mañana y está confirmada
            if (appointmentDate.toDateString() === tomorrow.toDateString() && 
                appointment.status === 'confirmed') {
                if (window.notificationManager) {
                    window.notificationManager.scheduleAppointmentReminder(appointment);
                }
            }
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

        // Formulario de nueva cita
        const form = document.getElementById('appointmentForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit();
            });
        }

        // Botón nueva cita
        const newAppointmentBtn = document.querySelector('.btn-primary');
        if (newAppointmentBtn) {
            newAppointmentBtn.addEventListener('click', () => {
                this.currentEditId = null;
                openAppointmentModal();
            });
        }
    }

    handleFormSubmit() {
        const appointmentData = {
            doctorName: document.getElementById('appointmentDoctor').value,
            specialty: document.getElementById('appointmentSpecialty').value,
            date: document.getElementById('appointmentDate').value,
            time: document.getElementById('appointmentTime').value,
            reason: document.getElementById('appointmentReason').value,
            office: this.getOfficeForDoctor(document.getElementById('appointmentDoctor').value)
        };

        // Validar fecha
        if (!this.validateDate(appointmentData.date, appointmentData.time)) {
            return;
        }

        if (this.currentEditId) {
            this.updateAppointment(this.currentEditId, appointmentData);
        } else {
            this.addAppointment(appointmentData);
        }

        closeAppointmentModal();
    }

    getOfficeForDoctor(doctorName) {
        // Lógica simple para asignar consultorio
        const offices = {
            'Dr. Sofia Pérez': 'Consultorio 305',
            'Dr. Juan Martínez': 'Consultorio 102',
            'Dra. Ana López': 'Consultorio 201'
        };
        return offices[doctorName] || 'Consultorio 100';
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
        
        // Agregar clase al body
        document.body.classList.add('modal-open');
        document.body.appendChild(modal);
        
        // Cerrar al hacer clic fuera
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
        
        // Agregar clase al body
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

    // Obtener próxima cita para el dashboard
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
        // Establecer fecha mínima como hoy
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('appointmentDate').setAttribute('min', today);
        
        // Agregar clase al body para evitar scroll
        document.body.classList.add('modal-open');
        modal.classList.add('show');
    }
}

function closeAppointmentModal() {
    const modal = document.getElementById('appointmentModal');
    if (modal) {
        modal.classList.remove('show');
        // Remover clase del body
        document.body.classList.remove('modal-open');
    }
}

function closeConfirmModal() {
    const modal = document.getElementById('confirmModal');
    if (modal) {
        modal.classList.remove('show');
        // Remover clase del body
        document.body.classList.remove('modal-open');
    }
}

// Cerrar modales al hacer clic fuera
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

// Inicializar cuando el DOM esté listo
let appointmentManager;
document.addEventListener('DOMContentLoaded', () => {
    appointmentManager = new AppointmentManager();
});
