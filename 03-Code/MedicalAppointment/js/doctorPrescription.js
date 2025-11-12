document.addEventListener('DOMContentLoaded', () => {

    const initialMockData = {
        stats: {
            totalPacientes: 7 // Actualizado al número de pacientes
        },
        // 'specialties' ha sido eliminado
        patients: [ // CAMBIO: Esto ahora es un array, no un objeto
            { id: 'p1', name: 'Ana García' },
            { id: 'p2', name: 'Luis Torres' },
            { id: 'p3', name: 'Maria López' },
            { id: 'p4', name: 'Carlos Sanz' },
            { id: 'p5', name: 'Elena Fernández' },
            { id: 'p6', name: 'Javier Gómez' },
            { id: 'p7', name: 'Sofía Niño' }
        ],
        prescriptions: {
            'p3': [
                {
                    id: 'r1', date: '20/10/2025', diagnostico: 'Acné vulgar moderado',
                    medicamentos: 'Peróxido de benzoílo 5% (Gel)\nAdapaleno 0.1% (Crema)',
                    indicaciones: 'Aplicar Peróxido de benzoílo por la mañana.\nAplicar Adapaleno por la noche.\nUsar protector solar SPF 50+ diariamente.',
                    duracion: '3 meses'
                }
            ],
            'p5': [
                {
                    id: 'r2', date: '15/10/2025', diagnostico: 'Faringitis aguda',
                    medicamentos: 'Amoxicilina 875mg',
                    indicaciones: 'Tomar 1 comprimido cada 12 horas.',
                    duracion: '7 días'
                }
            ]
        }
    };

    const DOCTOR_NAME = "Dr. Juan Perez";
    const LOCAL_STORAGE_KEY = 'doctorPrescriptionsData';

    // 'step1' ya no es necesario, pero lo mantenemos por si acaso
    const step1 = document.getElementById('step-1-specialty');
    const step2 = document.getElementById('step-2-patient');
    const step3 = document.getElementById('step-3-prescription');
    const prescriptionView = document.getElementById('prescription-view-container');

    // 'specialtySelect' ya no se usa
    // const specialtySelect = document.getElementById('specialty-select'); 

    const patientList = document.getElementById('patient-list');
    const patientListTitle = document.getElementById('patient-list-title');
    const historyContainer = document.getElementById('prescription-history-container');
    const formContainer = document.getElementById('prescription-form-container');
    const prescriptionList = document.getElementById('prescription-list');
    const patientNameHeader = document.getElementById('patient-name-header');
    const form = document.getElementById('prescription-form');
    const btnDownloadPdf = document.getElementById('btn-download-pdf');


    let appData = {};

    // 'currentSpecialty' ya no se usa
    // let currentSpecialty = null; 
    let currentPatient = null;
    let currentPrescription = null;

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

    // 'showStep1' ya no es necesaria

    // Esta es ahora la función de inicio
    function showStep2() {
        // 'currentSpecialty' eliminado
        patientListTitle.textContent = `Paso 1: Seleccione un Paciente`;
        loadPatients(); // Ya no necesita 'specialty'

        if (step1) step1.style.display = 'none'; // Oculta el paso de especialidad
        step2.style.display = 'block';
        step3.style.display = 'none';
        prescriptionView.style.display = 'none';
    }

    function showStep3(patient) {
        currentPatient = patient;
        patientNameHeader.textContent = `Recetas para: ${patient.name}`;
        loadPrescriptionHistory(patient.id);

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
    }

    function showFormView() {
        historyContainer.style.display = 'none';
        formContainer.style.display = 'block';
        prescriptionView.style.display = 'none';
        form.reset();
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
        // Actualizado para contar directamente del array de pacientes
        document.getElementById('total-pacientes').textContent = appData.patients.length;

        // Línea de 'total-especialidades' eliminada
    }

    // 'loadSpecialties' ya no es necesaria

    // 'loadPatients' ha sido modificada
    function loadPatients() {
        patientList.innerHTML = '';
        // Carga el array de pacientes directamente
        const patients = appData.patients || [];

        if (patients.length === 0) {
            patientList.innerHTML = '<p>No hay pacientes registrados.</p>';
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
        const prescriptions = appData.prescriptions[patientId] || [];

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
                <i class="fas fa-eye"></i>
            `;
            item.addEventListener('click', () => {
                showPrescriptionView(rx);
            });
            prescriptionList.appendChild(item);
        });
    }

    function handleSavePrescription(event) {
        event.preventDefault();

        const newPrescription = {
            id: `r${Date.now()}`,
            date: new Date().toLocaleDateString('es-ES'),
            diagnostico: document.getElementById('diag').value,
            medicamentos: document.getElementById('meds').value,
            indicaciones: document.getElementById('indic').value,
            duracion: document.getElementById('duration').value
        };

        if (!appData.prescriptions[currentPatient.id]) {
            appData.prescriptions[currentPatient.id] = [];
        }
        appData.prescriptions[currentPatient.id].push(newPrescription);

        saveDataToLocalStorage();

        loadPrescriptionHistory(currentPatient.id);
        showHistoryView();
    }

    function renderPrescription(prescription) {
        const view = document.getElementById('prescription-content-view');
        // Pre-formatea el texto para que respete los saltos de línea en HTML
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


    // --- INICIALIZACIÓN ---

    appData = loadDataFromLocalStorage();

    loadStats();
    // 'loadSpecialties()' eliminado

    showStep2(); // CAMBIO: Inicia en el paso 2 (lista de pacientes)

    // Event listener de 'specialtySelect' eliminado
    // Event listener de 'back-to-specialty' eliminado

    // Event listener de 'back-to-patients' actualizado
    document.getElementById('back-to-patients').addEventListener('click', showStep2);

    document.getElementById('btn-back-to-history').addEventListener('click', showHistoryView);
    document.getElementById('btn-show-form').addEventListener('click', showFormView);
    document.getElementById('btn-cancel-form').addEventListener('click', showHistoryView);
    form.addEventListener('submit', handleSavePrescription);
    btnDownloadPdf.addEventListener('click', downloadPrescriptionPdf);

});