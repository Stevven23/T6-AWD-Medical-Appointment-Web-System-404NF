// Doctor Management System with LocalStorage
class DoctorManager {
    constructor() {
        this.doctors = this.loadDoctors();
        this.currentEditId = null;
        this.init();
    }

    init() {
        this.renderDoctors();
        this.updateSummaryCards();
        this.setupEventListeners();
    }

    // LocalStorage methods
    loadDoctors() {
        const stored = localStorage.getItem('clinicaDoctors');
        if (stored) {
            return JSON.parse(stored);
        }
        // Initialize with sample data if empty
        return this.getInitialData();
    }

    saveDoctors() {
        localStorage.setItem('clinicaDoctors', JSON.stringify(this.doctors));
    }

    getInitialData() {
        return [
            {
                id: 1,
                cedula: '1234567890',
                name: 'Dr. Carlos García Méndez',
                specialty: 'cardiologia',
                phone: '(593) 99-123-4567',
                email: 'cgarcia@clinica.com',
                contract: 'full-time',
                schedule: 'full-time-standard',
                scheduleText: '08:00 - 17:00 (Almuerzo: 12:00 - 13:00)',
                status: 'active',
                createdAt: new Date('2024-10-01').toISOString()
            },
            {
                id: 2,
                cedula: '0987654321',
                name: 'Dra. María López Torres',
                specialty: 'pediatria',
                phone: '(593) 98-765-4321',
                email: 'mlopez@clinica.com',
                contract: 'full-time',
                schedule: 'full-time-standard',
                scheduleText: '08:00 - 17:00 (Almuerzo: 12:00 - 13:00)',
                status: 'active',
                createdAt: new Date('2024-09-15').toISOString()
            },
            {
                id: 3,
                cedula: '1122334455',
                name: 'Dr. Juan Martínez Silva',
                specialty: 'traumatologia',
                phone: '(593) 99-887-6543',
                email: 'jmartinez@clinica.com',
                contract: 'part-time',
                schedule: 'part-time-morning',
                scheduleText: '08:00 - 12:00',
                status: 'active',
                createdAt: new Date('2024-10-10').toISOString()
            },
            {
                id: 4,
                cedula: '5544332211',
                name: 'Dra. Ana Ruiz Gómez',
                specialty: 'dermatologia',
                phone: '(593) 97-654-3210',
                email: 'aruiz@clinica.com',
                contract: 'full-time',
                schedule: 'full-time-standard',
                scheduleText: '08:00 - 17:00 (Almuerzo: 12:00 - 13:00)',
                status: 'vacation',
                createdAt: new Date('2024-08-20').toISOString()
            },
            {
                id: 5,
                cedula: '9988776655',
                name: 'Dr. Roberto Sánchez Pérez',
                specialty: 'neurologia',
                phone: '(593) 96-543-2109',
                email: 'rsanchez@clinica.com',
                contract: 'full-time',
                schedule: 'full-time-standard',
                scheduleText: '08:00 - 17:00 (Almuerzo: 12:00 - 13:00)',
                status: 'active',
                createdAt: new Date('2024-07-05').toISOString()
            },
            {
                id: 6,
                cedula: '6677889900',
                name: 'Dra. Laura Pérez Ramírez',
                specialty: 'ginecologia',
                phone: '(593) 95-432-1098',
                email: 'lperez@clinica.com',
                contract: 'telemedicine',
                schedule: 'telemedicine-flexible',
                scheduleText: 'Horario Flexible (Telemedicina)',
                status: 'active',
                createdAt: new Date('2024-10-15').toISOString()
            },
            {
                id: 7,
                cedula: '3344556677',
                name: 'Dr. Fernando Torres Vega',
                specialty: 'general',
                phone: '(593) 94-321-0987',
                email: 'ftorres@clinica.com',
                contract: 'full-time',
                schedule: 'full-time-standard',
                scheduleText: '08:00 - 17:00 (Almuerzo: 12:00 - 13:00)',
                status: 'inactive',
                createdAt: new Date('2024-06-10').toISOString()
            }
        ];
    }

    // CRUD Operations
    addDoctor(doctorData) {
        const newId = this.doctors.length > 0 
            ? Math.max(...this.doctors.map(d => d.id)) + 1 
            : 1;
        
        const newDoctor = {
            id: newId,
            ...doctorData,
            createdAt: new Date().toISOString()
        };

        this.doctors.push(newDoctor);
        this.saveDoctors();
        this.renderDoctors();
        this.updateSummaryCards();
        this.showToast('Doctor agregado exitosamente', 'success');
    }

    updateDoctor(id, doctorData) {
        const index = this.doctors.findIndex(d => d.id === id);
        if (index !== -1) {
            this.doctors[index] = {
                ...this.doctors[index],
                ...doctorData
            };
            this.saveDoctors();
            this.renderDoctors();
            this.updateSummaryCards();
            this.showToast('Doctor actualizado exitosamente', 'success');
        }
    }

    deleteDoctor(id) {
        const index = this.doctors.findIndex(d => d.id === id);
        if (index !== -1) {
            this.doctors.splice(index, 1);
            this.saveDoctors();
            this.renderDoctors();
            this.updateSummaryCards();
            this.showToast('Doctor eliminado exitosamente', 'success');
        }
    }

    getDoctorById(id) {
        return this.doctors.find(d => d.id === id);
    }

    // Render methods
    renderDoctors(filteredDoctors = null) {
        const tbody = document.getElementById('doctorsTableBody');
        const doctorsToRender = filteredDoctors || this.doctors;

        if (doctorsToRender.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 40px;">
                        <i class="fas fa-user-md" style="font-size: 48px; color: #ccc; margin-bottom: 10px;"></i>
                        <p style="color: #999;">No hay doctores registrados</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = doctorsToRender.map(doctor => `
            <tr>
                <td>${String(doctor.id).padStart(3, '0')}</td>
                <td>${doctor.name}</td>
                <td>${this.getSpecialtyName(doctor.specialty)}</td>
                <td>${doctor.cedula}</td>
                <td>${doctor.phone}</td>
                <td>${this.getContractBadge(doctor.contract)}</td>
                <td>${this.getStatusBadge(doctor.status)}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="doctorManager.viewDoctor(${doctor.id})" title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn-icon" onclick="doctorManager.editDoctor(${doctor.id})" title="Editar">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-icon" style="color: var(--danger-color);" 
                            onclick="doctorManager.confirmDelete(${doctor.id})" title="Eliminar">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateSummaryCards() {
        const activeDoctors = this.doctors.filter(d => d.status === 'active').length;
        const inactiveDoctors = this.doctors.filter(d => d.status === 'inactive').length;
        
        // Count doctors added in the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const newDoctors = this.doctors.filter(d => 
            new Date(d.createdAt) > thirtyDaysAgo
        ).length;

        document.getElementById('activeDoctorsCount').textContent = activeDoctors;
        document.getElementById('inactiveDoctorsCount').textContent = inactiveDoctors;
        document.getElementById('newDoctorsCount').textContent = newDoctors;
    }

    // Helper methods
    getSpecialtyName(specialty) {
        const specialties = {
            'cardiologia': 'Cardiología',
            'pediatria': 'Pediatría',
            'traumatologia': 'Traumatología',
            'dermatologia': 'Dermatología',
            'neurologia': 'Neurología',
            'general': 'Medicina General',
            'ginecologia': 'Ginecología'
        };
        return specialties[specialty] || specialty;
    }

    getContractBadge(contract) {
        const contracts = {
            'full-time': '<span class="badge badge-active">Tiempo Completo</span>',
            'part-time': '<span class="badge badge-warning">Medio Tiempo</span>',
            'telemedicine': '<span class="badge badge-info">Telemedicina</span>'
        };
        return contracts[contract] || contract;
    }

    getStatusBadge(status) {
        const statuses = {
            'active': '<span class="badge badge-success">Activo</span>',
            'inactive': '<span class="badge cancelled">Inactivo</span>',
            'vacation': '<span class="badge badge-warning">De Vacaciones</span>'
        };
        return statuses[status] || status;
    }

    // Modal methods
    viewDoctor(id) {
        const doctor = this.getDoctorById(id);
        if (!doctor) return;

        const modalContent = `
            <div class="doctor-details">
                <h3><i class="fas fa-user-md"></i> ${doctor.name}</h3>
                <div class="detail-grid">
                    <div class="detail-item">
                        <strong>Cédula:</strong> ${doctor.cedula}
                    </div>
                    <div class="detail-item">
                        <strong>Especialidad:</strong> ${this.getSpecialtyName(doctor.specialty)}
                    </div>
                    <div class="detail-item">
                        <strong>Teléfono:</strong> ${doctor.phone}
                    </div>
                    <div class="detail-item">
                        <strong>Email:</strong> ${doctor.email}
                    </div>
                    <div class="detail-item">
                        <strong>Tipo de Contrato:</strong> ${doctor.contract === 'full-time' ? 'Tiempo Completo' : doctor.contract === 'part-time' ? 'Medio Tiempo' : 'Telemedicina'}
                    </div>
                    <div class="detail-item">
                        <strong>Horario:</strong> ${doctor.scheduleText}
                    </div>
                    <div class="detail-item">
                        <strong>Estado:</strong> ${this.getStatusBadge(doctor.status)}
                    </div>
                    <div class="detail-item">
                        <strong>Fecha de registro:</strong> ${new Date(doctor.createdAt).toLocaleDateString('es-EC')}
                    </div>
                </div>
            </div>
        `;

        this.showCustomModal('Información del Doctor', modalContent);
    }

    editDoctor(id) {
        const doctor = this.getDoctorById(id);
        if (!doctor) return;

        this.currentEditId = id;
        document.getElementById('modalTitle').innerHTML = '<i class="fas fa-edit"></i> Editar Doctor';
        
        // Fill form with doctor data
        document.getElementById('doctorCedula').value = doctor.cedula;
        document.getElementById('doctorCedula').disabled = true; // Cannot edit cedula
        document.getElementById('doctorName').value = doctor.name;
        document.getElementById('doctorPhone').value = doctor.phone;
        document.getElementById('doctorEmail').value = doctor.email;
        document.getElementById('doctorSpecialty').value = doctor.specialty;
        document.getElementById('doctorContract').value = doctor.contract;
        
        // Update schedule options based on contract
        updateScheduleOptions();
        
        document.getElementById('doctorSchedule').value = doctor.schedule;
        document.getElementById('doctorStatus').value = doctor.status;

        openAddDoctorModal();
    }

    confirmDelete(id) {
        const doctor = this.getDoctorById(id);
        if (!doctor) return;

        const message = `¿Está seguro que desea eliminar al doctor <strong>${doctor.name}</strong>? Esta acción no se puede deshacer.`;
        
        this.showConfirmModal(message, () => {
            this.deleteDoctor(id);
            closeConfirmModal();
        });
    }

    // Filter methods
    applyFilters() {
        const specialtyFilter = document.getElementById('specialtyFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;
        const contractFilter = document.getElementById('contractFilter').value;
        const searchTerm = document.getElementById('searchDoctor').value.toLowerCase();

        let filtered = this.doctors;

        if (specialtyFilter) {
            filtered = filtered.filter(d => d.specialty === specialtyFilter);
        }

        if (statusFilter) {
            filtered = filtered.filter(d => d.status === statusFilter);
        }

        if (contractFilter) {
            filtered = filtered.filter(d => d.contract === contractFilter);
        }

        if (searchTerm) {
            filtered = filtered.filter(d => 
                d.name.toLowerCase().includes(searchTerm) ||
                d.cedula.includes(searchTerm) ||
                String(d.id).includes(searchTerm)
            );
        }

        this.renderDoctors(filtered);
    }

    clearFilters() {
        document.getElementById('specialtyFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('contractFilter').value = '';
        document.getElementById('searchDoctor').value = '';
        this.renderDoctors();
    }

    // Event listeners setup
    setupEventListeners() {
        // Form submission
        document.getElementById('doctorForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleFormSubmit();
        });

        // Filter buttons
        document.getElementById('applyFilters').addEventListener('click', () => {
            this.applyFilters();
        });

        document.getElementById('clearFilters').addEventListener('click', () => {
            this.clearFilters();
        });

        // Real-time search
        document.getElementById('searchDoctor').addEventListener('input', () => {
            this.applyFilters();
        });

        // Cedula validation
        document.getElementById('doctorCedula').addEventListener('input', (e) => {
            this.validateCedula(e.target.value);
        });
    }

    handleFormSubmit() {
        const scheduleSelect = document.getElementById('doctorSchedule');
        const selectedOption = scheduleSelect.options[scheduleSelect.selectedIndex];
        
        const doctorData = {
            cedula: document.getElementById('doctorCedula').value,
            name: document.getElementById('doctorName').value,
            phone: document.getElementById('doctorPhone').value,
            email: document.getElementById('doctorEmail').value,
            specialty: document.getElementById('doctorSpecialty').value,
            contract: document.getElementById('doctorContract').value,
            schedule: scheduleSelect.value,
            scheduleText: selectedOption.text,
            status: document.getElementById('doctorStatus').value
        };

        // Check if cedula already exists (except when editing)
        const existingDoctor = this.doctors.find(d => 
            d.cedula === doctorData.cedula && d.id !== this.currentEditId
        );

        if (existingDoctor) {
            this.showToast('Ya existe un doctor con esta cédula', 'error');
            return;
        }

        if (this.currentEditId) {
            this.updateDoctor(this.currentEditId, doctorData);
        } else {
            this.addDoctor(doctorData);
        }

        closeDoctorModal();
    }

    validateCedula(cedula) {
        const errorElement = document.getElementById('cedulaError');
        
        if (cedula.length !== 10) {
            errorElement.textContent = 'La cédula debe tener 10 dígitos';
            errorElement.classList.add('show');
            return false;
        }

        if (!/^\d+$/.test(cedula)) {
            errorElement.textContent = 'La cédula solo debe contener números';
            errorElement.classList.add('show');
            return false;
        }

        errorElement.classList.remove('show');
        return true;
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
                    <span class="close" onclick="this.closest('.modal').remove()">&times;</span>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn-primary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-check"></i> Cerrar
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    showConfirmModal(message, onConfirm) {
        const modal = document.getElementById('confirmModal');
        document.getElementById('confirmMessage').innerHTML = message;
        
        const confirmButton = document.getElementById('confirmButton');
        const newButton = confirmButton.cloneNode(true);
        confirmButton.parentNode.replaceChild(newButton, confirmButton);
        
        newButton.addEventListener('click', onConfirm);
        
        modal.classList.add('show');
    }
      // Quick status change methods
    quickChangeStatus(id, newStatus) {
        const doctor = this.getDoctorById(id);
        if (!doctor) return;

        const statusNames = {
            'active': 'Activo',
            'inactive': 'Inactivo',
            'vacation': 'De Vacaciones'
        };

        const message = `¿Desea cambiar el estado de <strong>${doctor.name}</strong> a <strong>${statusNames[newStatus]}</strong>?`;
        
        this.showConfirmModal(message, () => {
            this.updateDoctor(id, { status: newStatus });
            closeConfirmModal();
        });
    }

    // Toggle doctor status (active/inactive)
    toggleDoctorStatus(id) {
        const doctor = this.getDoctorById(id);
        if (!doctor) return;

        const newStatus = doctor.status === 'active' ? 'inactive' : 'active';
        const action = newStatus === 'active' ? 'activar' : 'desactivar';
        
        const message = `¿Está seguro que desea <strong>${action}</strong> a <strong>${doctor.name}</strong>?`;
        
        this.showConfirmModal(message, () => {
            this.updateDoctor(id, { status: newStatus });
            closeConfirmModal();
        });
    }

    // Set doctor on vacation
    setDoctorVacation(id, onVacation = true) {
        const doctor = this.getDoctorById(id);
        if (!doctor) return;

        const newStatus = onVacation ? 'vacation' : 'active';
        const action = onVacation ? 'marcar como de vacaciones' : 'quitar de vacaciones';
        
        const message = `¿Desea ${action} a <strong>${doctor.name}</strong>?`;
        
        this.showConfirmModal(message, () => {
            this.updateDoctor(id, { status: newStatus });
            closeConfirmModal();
        });
    }

    // Show status change modal with all options
    showStatusChangeModal(id) {
        const doctor = this.getDoctorById(id);
        if (!doctor) return;

        const modalContent = `
            <div class="status-change-container">
                <p style="margin-bottom: 20px;">Seleccione el nuevo estado para <strong>${doctor.name}</strong>:</p>
                <div class="status-options">
                    <button class="status-option ${doctor.status === 'active' ? 'selected' : ''}" 
                            onclick="doctorManager.quickChangeStatus(${id}, 'active'); this.closest('.modal').remove();">
                        <i class="fas fa-check-circle" style="color: #28a745;"></i>
                        <span>Activo</span>
                        ${doctor.status === 'active' ? '<small>(Estado actual)</small>' : ''}
                    </button>
                    <button class="status-option ${doctor.status === 'vacation' ? 'selected' : ''}" 
                            onclick="doctorManager.quickChangeStatus(${id}, 'vacation'); this.closest('.modal').remove();">
                        <i class="fas fa-umbrella-beach" style="color: #ffc107;"></i>
                        <span>De Vacaciones</span>
                        ${doctor.status === 'vacation' ? '<small>(Estado actual)</small>' : ''}
                    </button>
                    <button class="status-option ${doctor.status === 'inactive' ? 'selected' : ''}" 
                            onclick="doctorManager.quickChangeStatus(${id}, 'inactive'); this.closest('.modal').remove();">
                        <i class="fas fa-times-circle" style="color: #dc3545;"></i>
                        <span>Inactivo</span>
                        ${doctor.status === 'inactive' ? '<small>(Estado actual)</small>' : ''}
                    </button>
                </div>
            </div>
        `;

        this.showCustomModal('Cambiar Estado del Doctor', modalContent);
    }

    // Batch status change (for multiple doctors)
    batchChangeStatus(doctorIds, newStatus) {
        if (!doctorIds || doctorIds.length === 0) {
            this.showToast('No hay doctores seleccionados', 'warning');
            return;
        }

        const statusNames = {
            'active': 'Activo',
            'inactive': 'Inactivo',
            'vacation': 'De Vacaciones'
        };

        const message = `¿Desea cambiar el estado de <strong>${doctorIds.length} doctor(es)</strong> a <strong>${statusNames[newStatus]}</strong>?`;
        
        this.showConfirmModal(message, () => {
            doctorIds.forEach(id => {
                this.updateDoctor(id, { status: newStatus });
            });
            closeConfirmModal();
            this.showToast(`${doctorIds.length} doctor(es) actualizado(s)`, 'success');
        });
    }

    // Get doctors by status
    getDoctorsByStatus(status) {
        return this.doctors.filter(d => d.status === status);
    }

    // Get available doctors (active and not on vacation)
    getAvailableDoctors() {
        return this.doctors.filter(d => d.status === 'active');
    }

    // Get doctors by specialty
    getDoctorsBySpecialty(specialty) {
        return this.doctors.filter(d => 
            d.specialty === specialty && d.status === 'active'
        );
    }
}

// Global functions for HTML onclick events
function openAddDoctorModal() {
    doctorManager.currentEditId = null;
    document.getElementById('modalTitle').innerHTML = '<i class="fas fa-plus"></i> Agregar Doctor';
    document.getElementById('doctorForm').reset();
    document.getElementById('doctorCedula').disabled = false;
    document.getElementById('doctorSchedule').disabled = true;
    document.getElementById('scheduleInfo').textContent = '';
    document.getElementById('cedulaError').classList.remove('show');
    document.getElementById('doctorModal').classList.add('show');
}

function closeDoctorModal() {
    document.getElementById('doctorModal').classList.remove('show');
}

function closeConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
}

function updateScheduleOptions() {
    const contractType = document.getElementById('doctorContract').value;
    const scheduleSelect = document.getElementById('doctorSchedule');
    const scheduleInfo = document.getElementById('scheduleInfo');
    
    scheduleSelect.innerHTML = '';
    scheduleSelect.disabled = false;
    
    if (!contractType) {
        scheduleSelect.disabled = true;
        scheduleSelect.innerHTML = '<option value="">Primero seleccione tipo de contrato</option>';
        scheduleInfo.textContent = '';
        return;
    }
    
    if (contractType === 'full-time') {
        scheduleSelect.innerHTML = `
            <option value="full-time-standard">08:00 - 17:00 (Almuerzo: 12:00 - 13:00)</option>
            <option value="full-time-early">07:00 - 16:00 (Almuerzo: 11:00 - 12:00)</option>
            <option value="full-time-late">09:00 - 18:00 (Almuerzo: 13:00 - 14:00)</option>
        `;
        scheduleInfo.textContent = '8 horas diarias con 1 hora de almuerzo';
    } else if (contractType === 'part-time') {
        scheduleSelect.innerHTML = `
            <option value="part-time-morning">08:00 - 12:00</option>
            <option value="part-time-afternoon">13:00 - 17:00</option>
            <option value="part-time-evening">14:00 - 18:00</option>
        `;
        scheduleInfo.textContent = '4 horas diarias';
    } else if (contractType === 'telemedicine') {
        scheduleSelect.innerHTML = `
            <option value="telemedicine-flexible">Horario Flexible (Telemedicina)</option>
            <option value="telemedicine-morning">Mañanas (08:00 - 12:00)</option>
            <option value="telemedicine-afternoon">Tardes (14:00 - 18:00)</option>
            <option value="telemedicine-evening">Noches (18:00 - 21:00)</option>
        `;
        scheduleInfo.textContent = 'Consultas virtuales según disponibilidad';
    }
}

// Close modals when clicking outside
window.onclick = function(event) {
    const doctorModal = document.getElementById('doctorModal');
    const confirmModal = document.getElementById('confirmModal');
    
    if (event.target === doctorModal) {
        closeDoctorModal();
    }
    if (event.target === confirmModal) {
        closeConfirmModal();
    }
}

// Initialize the doctor manager when DOM is loaded
let doctorManager;
document.addEventListener('DOMContentLoaded', () => {
    doctorManager = new DoctorManager();
});

// Export data function (can be used from console or other scripts)
function exportDoctorsData() {
    return JSON.parse(localStorage.getItem('clinicaDoctors') || '[]');
}

// Import data function (can be used to import doctors from other sources)
function importDoctorsData(doctorsArray) {
    localStorage.setItem('clinicaDoctors', JSON.stringify(doctorsArray));
    if (doctorManager) {
        doctorManager.doctors = doctorsArray;
        doctorManager.renderDoctors();
        doctorManager.updateSummaryCards();
        doctorManager.showToast('Datos importados exitosamente', 'success');
    }
}

// Quick actions from table buttons
function quickActivateDoctor(id) {
    doctorManager.quickChangeStatus(id, 'active');
}

function quickDeactivateDoctor(id) {
    doctorManager.quickChangeStatus(id, 'inactive');
}

function quickVacationDoctor(id) {
    doctorManager.quickChangeStatus(id, 'vacation');
}

function changeStatusDoctor(id) {
    doctorManager.showStatusChangeModal(id);
}

// Get all active doctors (useful for other panels)
function getActiveDoctors() {
    return doctorManager.getAvailableDoctors();
}

// Get doctors by specialty (useful for appointment booking)
function getDoctorsBySpecialty(specialty) {
    return doctorManager.getDoctorsBySpecialty(specialty);
}