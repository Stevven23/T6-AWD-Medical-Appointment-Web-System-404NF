document.addEventListener('DOMContentLoaded', () => {

    // --- Configuración de API ---
    const API_BASE_URL =
  location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://medical-appointment-backend-2xx0.onrender.com/api';


    // --- Constantes ---
    const DOCTOR_NAME = "Dr. Juan Perez";
    
    // --- Elementos de la UI ---
    const step1 = document.getElementById('step-1-specialty');
    const step2 = document.getElementById('step-2-patient');
    const step3 = document.getElementById('step-3-prescription');
    const prescriptionView = document.getElementById('prescription-view-container');

    const patientList = document.getElementById('patient-list');
    const patientListTitle = document.getElementById('patient-list-title');
    const historyContainer = document.getElementById('prescription-history-container');
    const formContainer = document.getElementById('prescription-form-container');
    const prescriptionList = document.getElementById('prescription-list');
    const patientNameHeader = document.getElementById('patient-name-header');
    const form = document.getElementById('prescription-form');
    const btnDownloadPdf = document.getElementById('btn-download-pdf');
    const btnShowForm = document.getElementById('btn-show-form');
    const formSaveButton = form ? form.querySelector('button[type="submit"]') : null;

    // Move the total-pacientes badge next to the 'Generar Nueva Receta' button
    // so it stays compact on the right side without taking much space.
    const totalPacientesEl = document.getElementById('total-pacientes');
    if (btnShowForm && totalPacientesEl) {
        const parent = btnShowForm.parentElement;
        if (parent) {
            // make parent a flex container to align button and badge
            parent.style.display = parent.style.display || 'flex';
            parent.style.alignItems = 'center';
        }
        // insert the badge right after the button
        try {
            btnShowForm.insertAdjacentElement('afterend', totalPacientesEl);
            totalPacientesEl.style.marginLeft = '8px';
        } catch (e) {
            // fallback: ensure it's visible somewhere
            totalPacientesEl.style.float = 'right';
        }
    }

    // --- Variables de Estado (Solo de la DB) ---
    let patientsFromDB = [];
    let prescriptionsFromDB = {};

    let currentPatient = null;
    let currentPrescription = null;
    let editingPrescriptionId = null;

    // ----------------------------------------------------------------------------------
    // 🔐 FUNCIONES DE AUTENTICACIÓN Y FETCH 🔐
    // ----------------------------------------------------------------------------------

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

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
            let errorMessage = `HTTP ${response.status}`;
            try {
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
                } else {
                    const text = await response.text();
                    errorMessage = text ? (text.length > 200 ? text.slice(0, 200) + '...' : text) : errorMessage;
                }
            } catch (e) {
                // fallback
            }
            throw new Error(errorMessage || 'Error en la petición');
        }

        return response;
    };

    // ----------------------------------------------------------------------------------
    // 📊 FUNCIONES DE CARGA Y MANEJO DE DATOS DEL BACKEND 📊
    // ----------------------------------------------------------------------------------

    async function loadPatientsFromDB() {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/doctors/patients`);
            const patients = await response.json();
            patientsFromDB = patients.map(p => ({
                user_id: p.user_id,
                name: `${p.first_name} ${p.last_name}`,
                first_name: p.first_name,
                last_name: p.last_name,
                cedula: p.cedula,
                email: p.email
            }));
            console.log("✅ Pacientes cargados de la BD:", patientsFromDB.length);
            return patientsFromDB;
        } catch (error) {
            console.error("❌ Error al cargar pacientes:", error);
            alert("Error al cargar pacientes: " + error.message);
            patientsFromDB = [];
            return [];
        }
    }

    async function loadPrescriptionsFromDB() {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/prescriptions`);
            const prescriptions = await response.json();

            prescriptionsFromDB = {};
            prescriptions.forEach(rx => {
                if (!prescriptionsFromDB[rx.patient_user_id]) {
                    prescriptionsFromDB[rx.patient_user_id] = [];
                }
                prescriptionsFromDB[rx.patient_user_id].push({
                    id: rx.id,
                    date: new Date(rx.created_at).toLocaleDateString('es-ES'),
                    diagnostico: rx.diagnosis || '',
                    medicamentos: rx.medications || '',
                    indicaciones: rx.instructions || '',
                    duracion: rx.duration || ''
                });
            });

            console.log("✅ Recetas cargadas de la BD:", Object.keys(prescriptionsFromDB).length, "pacientes");
            return prescriptionsFromDB;
        } catch (error) {
            console.error("❌ Error al cargar recetas:", error);
            prescriptionsFromDB = {};
            return {};
        }
    }

    async function savePrescriptionToDB(patientUserId, prescriptionData) {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/prescriptions`, {
                method: 'POST',
                body: JSON.stringify({
                    patient_user_id: patientUserId,
                    diagnosis: prescriptionData.diagnostico,
                    medications: prescriptionData.medicamentos,
                    instructions: prescriptionData.indicaciones,
                    duration: prescriptionData.duracion
                })
            });
            
            const result = await response.json();
            const created = result && (result.prescription || result);
            console.log("✅ Receta guardada en la BD:", created.id);
            return created;
        } catch (error) {
            console.error("❌ Error al guardar receta:", error);
            throw error;
        }
    }

    async function updatePrescriptionInDB(prescriptionId, prescriptionData) {
        try {
            if (!prescriptionId) throw new Error('ID de receta requerido para actualizar');

            const response = await fetchWithAuth(`${API_BASE_URL}/prescriptions/${prescriptionId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    diagnosis: prescriptionData.diagnostico,
                    medications: prescriptionData.medicamentos,
                    instructions: prescriptionData.indicaciones,
                    duration: prescriptionData.duracion
                })
            });

            const result = await response.json();
            const updated = result && (result.prescription || result);
            console.log("✅ Receta actualizada:", prescriptionId);
            
            // Refresh local data
            await loadPrescriptionsFromDB();
            return updated;
        } catch (error) {
            console.error('❌ Error al actualizar receta:', error);
            alert('Error al actualizar receta: ' + (error.message || error));
            throw error;
        }
    }

    async function deletePrescriptionFromDB(prescriptionId) {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/prescriptions/${prescriptionId}`, {
                method: 'DELETE'
            });
            const result = await response.json().catch(() => ({}));
            console.log("✅ Receta eliminada:", prescriptionId);
        } catch (error) {
            console.error("❌ Error al eliminar receta:", error);
            throw error;
        }
    }

    // ----------------------------------------------------------------------------------
    // ⚙️ FUNCIONES DE LA UI Y LÓGICA ⚙️
    // ----------------------------------------------------------------------------------

    function showStep2() {
        patientListTitle.textContent = `Seleccione un Paciente`;
        loadPatients();

        if (step1) step1.style.display = 'none';
        step2.style.display = 'block';
        step3.style.display = 'none';
        prescriptionView.style.display = 'none';
    }

    function showStep3(patient) {
        currentPatient = patient;
        patientNameHeader.textContent = `Recetas para: ${patient.name}`;
        loadPrescriptionHistory(patient.user_id);

        if (step1) step1.style.display = 'none';
        step2.style.display = 'none';
        step3.style.display = 'block';
        prescriptionView.style.display = 'none';
        showHistoryView();
    }

    function showHistoryView() {
        historyContainer.style.display = 'block';
        formContainer.style.display = 'none';
        prescriptionView.style.display = 'none';
        editingPrescriptionId = null;
        btnShowForm.innerHTML = '<i class="fas fa-plus"></i> Generar Nueva Receta';
        if (formSaveButton) formSaveButton.textContent = 'Guardar Receta';
    }

    function showFormView(prescription = null) {
        historyContainer.style.display = 'none';
        formContainer.style.display = 'block';
        prescriptionView.style.display = 'none';

        if (prescription) {
            editingPrescriptionId = prescription.id;
            document.getElementById('diag').value = prescription.diagnostico;
            document.getElementById('meds').value = prescription.medicamentos;
            document.getElementById('indic').value = prescription.indicaciones;
            document.getElementById('duration').value = prescription.duracion;
            btnShowForm.textContent = `Editando Receta (${prescription.date})`;
            if (formSaveButton) formSaveButton.textContent = 'Actualizar Receta';
        } else {
            form.reset();
            editingPrescriptionId = null;
            btnShowForm.innerHTML = '<i class="fas fa-plus"></i> Generar Nueva Receta';
            if (formSaveButton) formSaveButton.textContent = 'Guardar Receta';
        }
    }

    function showPrescriptionView(prescription) {
        currentPrescription = prescription;
        historyContainer.style.display = 'none';
        formContainer.style.display = 'none';
        step3.style.display = 'block';
        prescriptionView.style.display = 'block';
        renderPrescription(prescription);
    }

    function loadStats() {
        const totalPacientesEl = document.getElementById('total-pacientes');
        if (totalPacientesEl) {
            totalPacientesEl.textContent = patientsFromDB.length;
        }

        // Build/update compact stats panel (Citas / Activos) next to the patient list title
        const patientListTitle = document.getElementById('patient-list-title');
        if (patientListTitle) {
            let statsEl = document.getElementById('prescription-stats');
            // compute totals
            const totalActivos = patientsFromDB.length || 0;
            const totalCitas = Object.values(prescriptionsFromDB || {}).reduce((sum, arr) => sum + (Array.isArray(arr) ? arr.length : 0), 0);

                if (!statsEl) {
                    statsEl = document.createElement('div');
                    statsEl.id = 'prescription-stats';
                    // Prefer inserting into the page header next to the main title
                    try {
                        // Find an H1 that matches the page title
                        let pageHeaderH1 = null;
                        document.querySelectorAll('h1').forEach(h => {
                            if (!pageHeaderH1 && h.textContent && h.textContent.toLowerCase().includes('generar receta')) {
                                pageHeaderH1 = h;
                            }
                        });

                        if (pageHeaderH1 && pageHeaderH1.parentElement) {
                            const headerParent = pageHeaderH1.parentElement;
                            headerParent.style.display = headerParent.style.display || 'flex';
                            headerParent.style.alignItems = 'center';
                            headerParent.style.justifyContent = headerParent.style.justifyContent || 'flex-start';
                            // append stats at the end of the header so it appears at the right
                            headerParent.appendChild(statsEl);
                        } else {
                            // fallback: insert after patient list title
                            try {
                                patientListTitle.insertAdjacentElement('afterend', statsEl);
                            } catch (e) {
                                patientListTitle.parentElement && patientListTitle.parentElement.appendChild(statsEl);
                            }
                        }
                    } catch (e) {
                        // Best-effort fallback
                        patientListTitle.parentElement && patientListTitle.parentElement.appendChild(statsEl);
                    }
                }

            statsEl.innerHTML = `
                <div class="mini-stat">
                    <div class="mini-label">Citas</div>
                    <div class="mini-value">${totalCitas}</div>
                </div>
                <div class="mini-stat">
                    <div class="mini-label">Activos</div>
                    <div class="mini-value">${totalActivos}</div>
                </div>
            `;
        }
    }

    function loadPatients() {
        patientList.innerHTML = '';
        const patients = patientsFromDB || [];

        if (patients.length === 0) {
            patientList.innerHTML = '<p>No hay pacientes registrados. Intente recargar la página.</p>';
            return;
        }

        patients.forEach(patient => {
            const card = document.createElement('div');
            card.className = 'patient-card';
            card.innerHTML = `
                <i class="fas fa-user"></i>
                <div class="patient-name">${patient.name}</div>
                <div class="patient-info">${patient.cedula || 'Sin cédula'}</div>
            `;
            card.addEventListener('click', () => {
                showStep3(patient);
            });
            patientList.appendChild(card);
        });
    }

    function loadPrescriptionHistory(patientId) {
        prescriptionList.innerHTML = '';
        const prescriptions = prescriptionsFromDB[patientId] || [];

        if (prescriptions.length === 0) {
            prescriptionList.innerHTML = '<p id="no-prescriptions-msg">Este paciente no tiene recetas anteriores.</p>';
            return;
        }

        // Sort by date (newest first)
        prescriptions.sort((a, b) => {
            const dateA = new Date(a.date.split('/').reverse().join('-'));
            const dateB = new Date(b.date.split('/').reverse().join('-'));
            return dateB - dateA;
        });

        prescriptions.forEach(rx => {
            const item = document.createElement('div');
            item.className = 'prescription-item';

            item.innerHTML = `
                <div class="prescription-item-info">
                    <strong>Receta: ${rx.date}</strong>
                    <p>${rx.diagnostico || 'Sin diagnóstico'}</p>
                </div>
                <div class="prescription-item-actions">
                    <i class="fas fa-eye view-prescription-btn" data-prescription-id="${rx.id}" title="Ver Receta"></i>
                    <i class="fas fa-edit edit-prescription-btn" data-prescription-id="${rx.id}" title="Editar Receta"></i>
                    <i class="fas fa-trash delete-prescription-btn" data-prescription-id="${rx.id}" title="Eliminar Receta"></i>
                </div>
            `;
            prescriptionList.appendChild(item);
        });
    }

    function handleSavePrescription(event) {
        event.preventDefault();

        const diagnostico = document.getElementById('diag').value.trim();
        const medicamentos = document.getElementById('meds').value.trim();
        const indicaciones = document.getElementById('indic').value.trim();
        const duracion = document.getElementById('duration').value.trim();

        // Basic validation
        if (!diagnostico || !medicamentos) {
            alert('Por favor complete al menos el diagnóstico y medicamentos');
            return;
        }

        const prescriptionData = {
            diagnostico,
            medicamentos,
            indicaciones,
            duracion
        };

        if (editingPrescriptionId) {
            // Update existing prescription
            updatePrescriptionInDB(editingPrescriptionId, prescriptionData)
                .then(() => {
                    alert('Receta actualizada con éxito.');
                    loadPrescriptionsFromDB().then(() => {
                        loadPrescriptionHistory(currentPatient.user_id);
                        showHistoryView();
                    });
                })
                .catch(error => {
                    alert('Error al actualizar receta: ' + error.message);
                });
        } else {
            // Save new prescription
            savePrescriptionToDB(currentPatient.user_id, prescriptionData)
                .then(() => {
                    alert('Nueva receta guardada con éxito.');
                    loadPrescriptionsFromDB().then(() => {
                        loadPrescriptionHistory(currentPatient.user_id);
                        showHistoryView();
                    });
                })
                .catch(error => {
                    alert('Error al guardar receta: ' + error.message);
                });
        }
    }

    function deletePrescription(patientId, prescriptionId) {
        if (!patientId || !prescriptionId) return;

        const prescriptions = prescriptionsFromDB[patientId] || [];
        const prescription = prescriptions.find(rx => String(rx.id) === String(prescriptionId));
        
        if (!prescription) return;

        if (confirm(`¿Estás seguro de que quieres eliminar la receta del ${prescription.date} para ${currentPatient.name}?`)) {
            deletePrescriptionFromDB(prescriptionId)
                .then(() => {
                    loadPrescriptionsFromDB().then(() => {
                        loadPrescriptionHistory(patientId);
                        alert('Receta eliminada.');
                    });
                })
                .catch(error => {
                    alert('Error al eliminar receta: ' + error.message);
                });
        }
    }

    function editPrescription(patientId, prescriptionId) {
        if (!patientId || !prescriptionId) return;

        const prescriptions = prescriptionsFromDB[patientId] || [];
        const prescription = prescriptions.find(rx => String(rx.id) === String(prescriptionId));
        
        if (!prescription) {
            alert('Receta no encontrada para editar.');
            return;
        }

        showFormView(prescription);
    }

    function renderPrescription(prescription) {
        const view = document.getElementById('prescription-content-view');
        if (!view) return;
        
        const medsHtml = (prescription && prescription.medicamentos) 
            ? String(prescription.medicamentos).replace(/\n/g, '<br>') 
            : 'No especificado';
        const indicHtml = (prescription && prescription.indicaciones) 
            ? String(prescription.indicaciones).replace(/\n/g, '<br>') 
            : 'No especificado';

        view.innerHTML = `
            <div class="header">
                <h4>${DOCTOR_NAME}</h4>
                <p>Médico Especialista</p>
            </div>
            <div class="detail-group">
                <strong>Paciente:</strong>
                <p>${currentPatient.name}</p>
            </div>
            <div class="detail-group">
                <strong>Fecha:</strong>
                <p>${prescription.date}</p>
            </div>
            <div class="detail-group">
                <strong>Diagnóstico:</strong>
                <p>${prescription.diagnostico || 'No especificado'}</p>
            </div>
            <div class="detail-group">
                <strong>Medicamento/s (Rp/):</strong>
                <p>${medsHtml}</p>
            </div>
            <div class="detail-group">
                <strong>Indicaciones:</strong>
                <p>${indicHtml}</p>
            </div>
            <div class="detail-group">
                <strong>Duración del Tratamiento:</strong>
                <p>${prescription.duracion || 'No especificado'}</p>
            </div>
            <div class="footer">
                <p>_________________________</p>
                <p>Firma y Sello</p>
                <p>${DOCTOR_NAME}</p>
            </div>
        `;
    }

    async function downloadPrescriptionPdf() {
        if (!currentPrescription || !currentPatient) {
            console.error("No hay receta o paciente seleccionado para descargar.");
            alert("No se puede generar el PDF. Seleccione una receta primero.");
            return;
        }

        const prescriptionElement = document.getElementById('prescription-content-view');

        try {
            const canvas = await html2canvas(prescriptionElement, {
                scale: 2,
                useCORS: true
            });

            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 210;
            const pageHeight = 297;
            const imgHeight = canvas.height * imgWidth / canvas.width;
            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            const fileName = `Receta_${currentPatient.name.replace(/\s/g, '_')}_${currentPrescription.date.replace(/\//g, '-')}.pdf`;
            pdf.save(fileName);

        } catch (error) {
            console.error("Error al generar el PDF:", error);
            alert("Hubo un error al generar el PDF. Intente de nuevo.");
        }
    }

    // ----------------------------------------------------------------------------------
    // 🚀 INICIALIZACIÓN 🚀
    // ----------------------------------------------------------------------------------

    // Load data from database
    Promise.all([loadPatientsFromDB(), loadPrescriptionsFromDB()])
        .then(() => {
            loadStats();
            showStep2();
        })
        .catch(error => {
            console.error("Error al cargar datos iniciales:", error);
            alert("Error al inicializar la aplicación. Por favor recargue la página.");
            loadStats();
            showStep2();
        });

    // ----------------------------------------------------------------------------------
    // 👂 EVENT LISTENERS 👂
    // ----------------------------------------------------------------------------------

    const btnBackToPatients = document.getElementById('back-to-patients');
    const btnBackToHistory = document.getElementById('btn-back-to-history');
    const btnCancelForm = document.getElementById('btn-cancel-form');

    if (btnBackToPatients) btnBackToPatients.addEventListener('click', showStep2);
    if (btnBackToHistory) btnBackToHistory.addEventListener('click', showHistoryView);
    if (btnShowForm) btnShowForm.addEventListener('click', () => showFormView(null));
    if (btnCancelForm) btnCancelForm.addEventListener('click', showHistoryView);
    if (form) form.addEventListener('submit', handleSavePrescription);
    if (btnDownloadPdf) btnDownloadPdf.addEventListener('click', downloadPrescriptionPdf);

    if (prescriptionList) {
        prescriptionList.addEventListener('click', (event) => {
            const target = event.target;
            const prescriptionId = target.dataset.prescriptionId;

            if (!prescriptionId) return;

            if (target.classList.contains('view-prescription-btn')) {
                if (!currentPatient || !prescriptionsFromDB[currentPatient.user_id]) return;
                const prescription = prescriptionsFromDB[currentPatient.user_id].find(
                    rx => String(rx.id) === String(prescriptionId)
                );
                if (prescription) {
                    showPrescriptionView(prescription);
                }
            }

            if (target.classList.contains('edit-prescription-btn')) {
                if (!currentPatient) return;
                editPrescription(currentPatient.user_id, prescriptionId);
            }

            if (target.classList.contains('delete-prescription-btn')) {
                if (!currentPatient) return;
                deletePrescription(currentPatient.user_id, prescriptionId);
            }
        });
    }

});