// js/doctorPatients.js

document.addEventListener("DOMContentLoaded", () => {

    // --- 1. Configuración de API y Elementos del DOM ---
    const API_BASE_URL = window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : 'https://medical-appointment-backend-2xx0.onrender.com/api';

    const pages = {
        list: document.getElementById('patient-list-page'),
        details: document.getElementById('appointment-details-page'),
        form: document.getElementById('new-patient-form-page')
    };

    const buttons = {
        addNew: document.querySelector('.main-header .btn-primary'), 
        backFromDetails: document.getElementById('btn-back-to-list'),
        backFromForm: document.getElementById('btn-back-to-list-from-form')
    };

    const patientTableBody = document.getElementById('patient-table-body');
    const newPatientForm = document.getElementById('new-patient-form');

    // Helper para obtener el token de autenticación
    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
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

    // --- Cache para la lista (útil para la navegación rápida) ---
    let patientListCache = []; 

    // --- Funciones de Utilidad ---

    /**
     * Formatea una fecha para ser legible.
     * @param {string} dateString - Cadena de fecha ISO.
     * @returns {string} Fecha formateada.
     */
    function formatDate(dateString) {
        if (!dateString) return 'Nunca';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        });
    }

    /**
     * Navegación entre las vistas del panel.
     */
    function showPage(pageId) {
        Object.values(pages).forEach(page => page.style.display = 'none');
        if (pages[pageId]) {
            pages[pageId].style.display = 'block';
        }
    }

    // --- 3. Lógica de API y Renderizado ---

    /**
     * Carga todos los pacientes de la API (GET /api/doctors/patients)
     */
    async function loadPatients() {
        try {
            patientTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Cargando pacientes...</td></tr>';
            
            const response = await fetchWithAuth(`${API_BASE_URL}/doctors/patients`);
            const patients = await response.json();
            patientListCache = patients; // Actualizar caché
            
            renderPatientTable(patients);
            showPage('list'); 

            // Verificar si hay un paciente a buscar desde reportes
            const buscarPaciente = localStorage.getItem('buscarPaciente');
            if (buscarPaciente) {
                // Buscar y mostrar el paciente
                const pacienteEncontrado = patients.find(p => {
                    const nombreCompleto = `${p.first_name || ''} ${p.last_name || ''}`.trim();
                    return nombreCompleto === buscarPaciente;
                });
                
                if (pacienteEncontrado) {
                    viewPatientDetails(pacienteEncontrado.user_id);
                }
                
                // Limpiar el localStorage
                localStorage.removeItem('buscarPaciente');
            }

        } catch (error) {
            console.error("Error al cargar pacientes:", error);
            patientTableBody.innerHTML = `<tr><td colspan="5" style="color: red; text-align: center;">Error al cargar: ${error.message}</td></tr>`;
        }
    }

    /**
     * Inserta los datos de los pacientes en el <tbody> de la tabla
     */
    function renderPatientTable(patients) {
        patientTableBody.innerHTML = ''; 
        if (patients.length === 0) {
            patientTableBody.innerHTML = `<tr><td colspan="5">No hay pacientes registrados.</td></tr>`;
            return;
        }

        patients.forEach(patient => {
            const tr = document.createElement('tr');
            
            const fullName = `${patient.first_name || ''} ${patient.last_name || ''}`;
            const lastVisit = formatDate(patient.ultima_visita);
            const condition = patient.principal_condition || 'N/A';

            tr.innerHTML = `
                <td>${fullName}</td>
                <td>${patient.cedula || 'N/A'}</td>
                <td>${lastVisit}</td>
                <td>${condition}</td>
                <td>
                    <button class="btn-primary btn-action btn-details" data-user-id="${patient.user_id}">
                        <i class="fas fa-eye"></i> Ver
                    </button>
                    <button class="btn-primary btn-action btn-edit" data-user-id="${patient.user_id}">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                </td>
            `;
            patientTableBody.appendChild(tr);
        });
    }

    async function viewPatientDetails(userId) {
        const patient = patientListCache.find(p => p.user_id === userId);
        if (!patient) {
            alert("Detalles del paciente no encontrados en caché.");
            return;
        }

        const fullName = `${patient.first_name} ${patient.last_name}`;
        document.getElementById('detail-header-info').textContent = `Paciente: ${fullName} - ${patient.principal_condition || 'N/A'}`;
        document.getElementById('detail-patient-name').textContent = fullName;
        document.getElementById('detail-patient-age').textContent = patient.age || patient.date_of_birth ? `${patient.age || 0} años` : 'N/A';
        document.getElementById('detail-patient-contact').textContent = patient.phone_number || patient.email || 'N/A';
        document.getElementById('detail-patient-id').textContent = patient.cedula || 'N/A';
        document.getElementById('detail-patient-allergies').textContent = patient.allergies || 'Sin alergias registradas';
        document.getElementById('detail-patient-conditions').textContent = patient.principal_condition || 'Sin condiciones previas';
        document.getElementById('detail-patient-last-visit').textContent = formatDate(patient.ultima_visita);

        showPage('details');
        
        try {
            document.getElementById('detail-consultations').innerHTML = '<p>Cargando notas de consulta...</p>';
            document.getElementById('detail-tests').innerHTML = '<p>Cargando resultados de exámenes...</p>';
            document.getElementById('detail-prescriptions').innerHTML = '<p>Cargando historial médico...</p>';

            const recordUrl = `${API_BASE_URL}/doctors/patients/${userId}/record`;
            const response = await fetchWithAuth(recordUrl);
            const details = await response.json();
        
            const consultationsHtml = details.consultation_notes.map(note => {
                const doctorName = note.appointment?.doctor?.users ? 
                    `Dr. ${note.appointment.doctor.users.first_name} ${note.appointment.doctor.users.last_name}` : 'N/A';
                
                return `
                    <div class="record-item">
                        <p><strong>Fecha:</strong> ${formatDate(note.created_at)}</p>
                        <p><strong>Atendido por:</strong> ${doctorName}</p>
                        <p><strong>Diagnóstico:</strong> ${note.diagnosis || 'Pendiente'}</p>
                        <p class="notes-preview">**Notas:** ${note.notes.substring(0, 150)}${note.notes.length > 150 ? '...' : ''}</p>
                        <button class="btn-link">Ver Nota Completa</button>
                    </div>
                `;
            }).join('') || '<p>No hay notas de consulta anteriores.</p>';
            document.getElementById('detail-consultations').innerHTML = consultationsHtml;

            const testsHtml = details.lab_reports.map(report => `
                <div class="record-item">
                    <p><strong>Fecha:</strong> ${formatDate(report.order_date)}</p>
                    <p><strong>Examen:</strong> ${report.test_name} 
                    <span class="status-badge status-${report.status.toLowerCase()}">${report.status.toUpperCase()}</span></p>
                    
                    ${report.lab_results && report.lab_results.length > 0 ? `
                        <ul>
                            ${report.lab_results.map(res => 
                                `<li>${res.parameter_name}: **${res.result_value}** ${res.unit || ''} (Ref: ${res.reference_range || 'N/A'})</li>`
                            ).join('')}
                        </ul>
                    ` : '<p>Resultados pendientes o no especificados.</p>'}
                    <button class="btn-link">Ver Reporte Completo</button>
                </div>
            `).join('') || '<p>No hay resultados de exámenes registrados.</p>';
            document.getElementById('detail-tests').innerHTML = testsHtml;

            const medicalRecord = details.medical_record;
            if (medicalRecord) {
                document.getElementById('detail-prescriptions').innerHTML = `
                    <div class="record-item">
                        <h4>Registro Clínico General (Última actualización: ${formatDate(medicalRecord.updated_at)})</h4>
                        <p><strong>Prescripciones Actuales:</strong> ${medicalRecord.current_medications || 'N/A'}</p>
                        <p><strong>Historial Médico Detallado:</strong> ${medicalRecord.medical_history || 'N/A'}</p>
                        <p><strong>Alergias:</strong> ${medicalRecord.allergies || 'N/A'}</p>
                        <button class="btn-link">Editar Registro</button>
                    </div>
                `;
            } else {
                document.getElementById('detail-prescriptions').innerHTML = '<p>No se encontró un registro médico general.</p>';
            }

        } catch (error) {
            console.error('Error cargando detalles del paciente:', error);
            document.getElementById('detail-consultations').innerHTML = `<p style="color: red;">Error: ${error.message}</p>`;
            document.getElementById('detail-tests').innerHTML = ''; 
            document.getElementById('detail-prescriptions').innerHTML = '';
        }
    }

    async function handleNewPatientSubmit(event) {
        event.preventDefault(); 
        
        const nameParts = document.getElementById('new-patient-name').value.trim().split(/\s+/);
        
        const dataToSend = {
            email: document.getElementById('new-patient-email').value, 
            password: document.getElementById('new-patient-password').value, 
            first_name: nameParts[0] || '',
            last_name: nameParts.length > 1 ? nameParts.slice(1).join(' ') : (nameParts[0] ? 'Apellido' : ''),
            cedula: document.getElementById('new-patient-cedula').value,
            phone_number: document.getElementById('new-patient-contact').value, 
            date_of_birth: document.getElementById('new-patient-date-of-birth').value || null,
            allergies: document.getElementById('new-patient-allergies').value,
            medical_conditions: document.getElementById('new-patient-conditions').value,
        };
        
        if (!dataToSend.email || !dataToSend.password || !dataToSend.first_name || !dataToSend.last_name) {
             alert('El nombre, apellido, email y contraseña son obligatorios.');
             return;
        }

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/doctors/patients`, {
                method: 'POST',
                body: JSON.stringify(dataToSend)
            });

            const result = await response.json();

            alert(`Paciente ${result.patient.first_name} ${result.patient.last_name} registrado exitosamente.`);
            
            newPatientForm.reset(); 
            loadPatients();
            showPage('list'); 

        } catch (error) {
            alert(`Error al registrar paciente: ${error.message}`);
        }
    }

    buttons.addNew.addEventListener('click', () => showPage('form'));
    buttons.backFromDetails.addEventListener('click', () => showPage('list'));
    buttons.backFromForm.addEventListener('click', () => showPage('list'));

    newPatientForm.addEventListener('submit', handleNewPatientSubmit);

    patientTableBody.addEventListener('click', (event) => {
        const viewButton = event.target.closest('.btn-details');
        if (viewButton) {
            const patientUserId = viewButton.dataset.userId; 
            viewPatientDetails(patientUserId);
        }
        
        const editButton = event.target.closest('.btn-edit');
        if (editButton) {
            alert(`Funcionalidad "Editar" para usuario ID ${editButton.dataset.userId} no implementada.`);
        }
    });

    loadPatients(); 

});
