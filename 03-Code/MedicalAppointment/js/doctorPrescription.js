document.addEventListener('DOMContentLoaded', () => {

    // --- Configuración de API ---
    const API_BASE_URL = window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : 'https://medical-appointment-backend-2xx0.onrender.com/api';

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
            // Try to parse JSON error, otherwise return text
            let errorMessage = `HTTP ${response.status}`;
            try {
                const contentType = response.headers.get('content-type') || '';
                if (contentType.includes('application/json')) {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || JSON.stringify(errorData);
                } else {
                    const text = await response.text();
                    // If HTML returned (like a 404 page), include a short snippet
                    errorMessage = text ? (text.length > 200 ? text.slice(0, 200) + '...' : text) : errorMessage;
                }
            } catch (e) {
                // fallback
            }
            throw new Error(errorMessage || 'Error en la petición');
        }

        return response;
    };

    const initialMockData = {
        stats: {
            totalPacientes: 0
        },
        patients: [],
        prescriptions: {}
    };

    const DOCTOR_NAME = "Dr. Juan Perez";
    const LOCAL_STORAGE_KEY = 'doctorPrescriptionsData';

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
    const formSaveButton = form.querySelector('button[type="submit"]');

    let appData = {};
    let patientsFromDB = [];
    let prescriptionsFromDB = {};

    let currentPatient = null;
    let currentPrescription = null;
    let editingPrescriptionId = null;

    function loadDataFromLocalStorage() {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (savedData) {
            console.log("Datos cargados desde localStorage.");
            return JSON.parse(savedData);
        } else {
            console.log("Usando datos iniciales.");
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialMockData));
            return initialMockData;
        }
    }

    function saveDataToLocalStorage() {
        try {
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appData));
            console.log("Datos guardados en localStorage.");
        } catch (error) {
            console.error("Error al guardar en localStorage:", error);
        }
    }

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
            console.log("Pacientes cargados de la BD:", patientsFromDB);
            return patientsFromDB;
        } catch (error) {
            console.error("Error al cargar pacientes de la BD:", error);
            alert("Error al cargar pacientes: " + error.message);
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
            console.log("Recetas cargadas de la BD:", prescriptionsFromDB);
            return prescriptionsFromDB;
        } catch (error) {
            console.error("Error al cargar recetas de la BD:", error);
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
            console.log("Receta guardada en la BD:", result);
            return result;
        } catch (error) {
            console.error("Error al guardar receta en la BD:", error);
            throw error;
        }
    }

    async function deletePrescriptionFromDB(prescriptionId) {
        try {
            await fetchWithAuth(`${API_BASE_URL}/prescriptions/${prescriptionId}`, {
                method: 'DELETE'
            });
            console.log("Receta eliminada de la BD");
        } catch (error) {
            console.error("Error al eliminar receta de la BD:", error);
            throw error;
        }
    }

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
        formSaveButton.textContent = 'Guardar Receta';
    }

    function showFormView() {
        historyContainer.style.display = 'none';
        formContainer.style.display = 'block';
        prescriptionView.style.display = 'none';

        if (!editingPrescriptionId) {
            form.reset();
            btnShowForm.innerHTML = '<i class="fas fa-plus"></i> Generar Nueva Receta';
            formSaveButton.textContent = 'Guardar Receta';
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
        document.getElementById('total-pacientes').textContent = patientsFromDB.length;
    }

    function loadPatients() {
        patientList.innerHTML = '';
        const patients = patientsFromDB || [];

        if (patients.length === 0) {
            patientList.innerHTML = '<p>No hay pacientes registrados. Cargando...</p>';
            return;
        }

        patients.forEach(patient => {
            const card = document.createElement('div');
            card.className = 'patient-card';
            card.innerHTML = `<i class="fas fa-user"></i><div class="patient-name">${patient.name}</div>`;
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

        prescriptions.sort((a, b) => new Date(b.date.split('/').reverse().join('-')) - new Date(a.date.split('/').reverse().join('-')));

        prescriptions.forEach(rx => {
            const item = document.createElement('div');
            item.className = 'prescription-item';

            item.innerHTML = `
                <div class="prescription-item-info">
                    <strong>Receta: ${rx.date}</strong>
                    <p>${rx.diagnostico}</p>
                </div>
                <div class="prescription-item-actions">
                    <i class="fas fa-eye view-prescription-btn" data-prescription-id="${rx.id}" title="Ver Receta"></i>
                    <i class="fas fa-trash delete-prescription-btn" data-prescription-id="${rx.id}" title="Eliminar Receta"></i>
                </div>
            `;
            prescriptionList.appendChild(item);
        });
    }

    function handleSavePrescription(event) {
        event.preventDefault();

        const diagnostico = document.getElementById('diag').value;
        const medicamentos = document.getElementById('meds').value;
        const indicaciones = document.getElementById('indic').value;
        const duracion = document.getElementById('duration').value;

        const prescriptionData = {
            diagnostico,
            medicamentos,
            indicaciones,
            duracion
        };

        if (editingPrescriptionId) {
            // Editar receta local (si la implementación lo requiere)
            alert('Funcionalidad de edición en la BD está en desarrollo.');
        } else {
            // Guardar nueva receta en la BD
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

        editingPrescriptionId = null;
    }

    function deletePrescription(patientId, prescriptionId) {
        if (!patientId || !prescriptionId) return;

        const prescriptions = prescriptionsFromDB[patientId] || [];
        const prescription = prescriptions.find(rx => rx.id === prescriptionId);
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

        const prescription = appData.prescriptions[patientId].find(rx => rx.id === prescriptionId);
        if (!prescription) {
            alert('Receta no encontrada para editar.');
            return;
        }

        editingPrescriptionId = prescriptionId;

        document.getElementById('diag').value = prescription.diagnostico;
        document.getElementById('meds').value = prescription.medicamentos;
        document.getElementById('indic').value = prescription.indicaciones;
        document.getElementById('duration').value = prescription.duracion;

        btnShowForm.textContent = `Editando Receta (${prescription.date})`;
        formSaveButton.textContent = 'Actualizar Receta';

        showFormView();
    }


    function renderPrescription(prescription) {
        const view = document.getElementById('prescription-content-view');
        const medsHtml = prescription.medicamentos.replace(/\n/g, '<br>');
        const indicHtml = prescription.indicaciones.replace(/\n/g, '<br>');

        view.innerHTML = `
            <div class="header"><h4>${DOCTOR_NAME}</h4><p>Médico</p></div>
            <div class="detail-group"><strong>Paciente:</strong><p>${currentPatient.name}</p></div>
            <div class="detail-group"><strong>Fecha:</strong><p>${prescription.date}</p></div>
            <div class="detail-group"><strong>Diagnóstico:</strong><p>${prescription.diagnostico}</p></div>
            <div class="detail-group"><strong>Medicamento/s (Rp/):</strong><p>${medsHtml}</p></div>
            <div class="detail-group"><strong>Indicaciones:</strong><p>${indicHtml}</p></div>
            <div class="detail-group"><strong>Duración del Tratamiento:</strong><p>${prescription.duracion}</p></div>
            <div class="footer"><p>_________________________</p><p>Firma y Sello</p><p>${DOCTOR_NAME}</p></div>
        `;
    }

    async function downloadPrescriptionPdf() {
        if (!currentPrescription || !currentPatient) {
            console.error("No hay receta o paciente seleccionado para descargar.");
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

    appData = loadDataFromLocalStorage();

    // Cargar datos de la base de datos
    Promise.all([loadPatientsFromDB(), loadPrescriptionsFromDB()])
        .then(() => {
            loadStats();
            showStep2();
        })
        .catch(error => {
            console.error("Error al cargar datos iniciales:", error);
            // Usar datos locales como fallback
            loadStats();
            showStep2();
        });

    document.getElementById('back-to-patients').addEventListener('click', showStep2);
    document.getElementById('btn-back-to-history').addEventListener('click', showHistoryView);
    document.getElementById('btn-show-form').addEventListener('click', showFormView);
    document.getElementById('btn-cancel-form').addEventListener('click', showHistoryView);
    form.addEventListener('submit', handleSavePrescription);
    btnDownloadPdf.addEventListener('click', downloadPrescriptionPdf);

    prescriptionList.addEventListener('click', (event) => {
        const target = event.target;
        const prescriptionId = target.dataset.prescriptionId;

        if (!prescriptionId) return;

        if (target.classList.contains('view-prescription-btn')) {
            const prescription = prescriptionsFromDB[currentPatient.user_id].find(rx => rx.id === prescriptionId);
            if (prescription) {
                showPrescriptionView(prescription);
            }
        }

        if (target.classList.contains('delete-prescription-btn')) {
            deletePrescription(currentPatient.user_id, prescriptionId);
        }
    });

});