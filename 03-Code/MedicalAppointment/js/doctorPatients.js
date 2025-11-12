document.addEventListener('DOMContentLoaded', () => {

    let pacientesData = {
        "p1": {
            id: "p1",
            nombre: "María Rodríguez",
            cedula: "1726456754",
            edad: 35,
            contacto: "0987564883 | maria.r@gmail.com",
            alergias: "Penicilina",
            condiciones: "Asma leve",
            ultimaVisita: "18 de Julio de 2024",
            motivoCita: "Revisión General",
            avatar: "../../sources/img/patient.jpg",
            consultas: [{ fecha: "10 Enero 2024", motivo: "Revisión Anual", diag: "Control rutinario." }],
        },
        "p2": {
            id: "p2",
            nombre: "Carlos González",
            cedula: "0987654321",
            edad: 52,
            contacto: "0991234567 | carlos.g@gmail.com",
            alergias: "Ninguna conocida",
            condiciones: "Hipertensión Arterial",
            ultimaVisita: "15 de Noviembre de 2025",
            motivoCita: "Control de Hipertensión",
            avatar: "../../sources/img/patient2.jpg",
            consultas: [{ fecha: "10 Octubre 2025", motivo: "Chequeo Presión", diag: "Presión elevada." }],
        },
        "p3": {
            id: "p3",
            nombre: "Ana Martínez",
            cedula: "1122334455",
            edad: 6,
            contacto: "0976543210 (Madre)",
            alergias: "Polvo",
            condiciones: "Control Pediátrico",
            ultimaVisita: "12 de Noviembre de 2025",
            motivoCita: "Vacunación",
            avatar: "../../sources/img/patient3.jpg",
            consultas: [{ fecha: "12 Nov 2025", motivo: "Vacunación", diag: "Se administran vacunas." }],
        },
        "p4": {
            id: "p4",
            nombre: "Roberto Sánchez",
            cedula: "0102030405",
            edad: 61,
            contacto: "0965554321 | roberto.s@outlook.com",
            alergias: "Mariscos",
            condiciones: "Diabetes Tipo 2",
            ultimaVisita: "01 de Octubre de 2025",
            motivoCita: "Control Glucosa",
            avatar: "../../sources/img/patient4.jpg",
            consultas: [{ fecha: "01 Oct 2025", motivo: "Control Glucosa", diag: "Glucosa en ayunas 130." }],
        },
        "p5": {
            id: "p5",
            nombre: "Lucía Fernández",
            cedula: "1415161718",
            edad: 28,
            contacto: "0954321678 | lucia.f@gmail.com",
            alergias: "Ninguna",
            condiciones: "Post-operatorio",
            ultimaVisita: "10 de Noviembre de 2025",
            motivoCita: "Retiro de puntos",
            avatar: "../../sources/img/patient5.jpg",
            consultas: [{ fecha: "02 Nov 2025", motivo: "Cirugía", diag: "Apendicectomía." }],
        }
    };

    const vistaLista = document.getElementById('patient-list-page');
    const vistaDetalle = document.getElementById('appointment-details-page');
    const vistaNuevoPaciente = document.getElementById('new-patient-form-page');

    const tablaPacientesBody = document.getElementById('patient-table-body');
    const btnNuevoPaciente = document.querySelector('#patient-list-page .btn-primary');

    const btnVolverDesdeDetalle = document.getElementById('btn-back-to-list');

    const btnVolverDesdeForm = document.getElementById('btn-back-to-list-from-form');
    const formNuevoPaciente = document.getElementById('new-patient-form');


    function renderPatientTable() {
        tablaPacientesBody.innerHTML = '';

        Object.values(pacientesData).forEach(paciente => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>
                    <div class="patient-cell">
                        <img src="${paciente.avatar || '../../sources/img/patient-default.png'}" alt="Avatar">
                        <span>${paciente.nombre}</span>
                    </div>
                </td>
                <td>${paciente.cedula}</td>
                <td>${paciente.ultimaVisita}</td>
                <td>${paciente.condiciones}</td>
                <td>
                    <a href="#" class="btn-secondary view-patient-btn" data-patient-id="${paciente.id}">Ver Expediente</a>
                    <button class="btn-delete delete-patient-btn" data-patient-id="${paciente.id}"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tablaPacientesBody.appendChild(tr);
        });
    }

    function mostrarListaPacientes() {
        vistaDetalle.style.display = 'none';
        vistaNuevoPaciente.style.display = 'none';
        vistaLista.style.display = 'block';
        renderPatientTable();
    }

    function mostrarDetallePaciente(pacienteId) {
        const paciente = pacientesData[pacienteId];
        if (!paciente) return;

        document.getElementById('detail-header-info').textContent = `Paciente: ${paciente.nombre} - ${paciente.motivoCita}`;
        document.getElementById('detail-patient-avatar').src = paciente.avatar || '../../sources/img/patient-default.png';
        document.getElementById('detail-patient-name').textContent = paciente.nombre;
        document.getElementById('detail-patient-age').textContent = paciente.edad;
        document.getElementById('detail-patient-contact').textContent = paciente.contacto;
        document.getElementById('detail-patient-id').textContent = paciente.cedula;
        document.getElementById('detail-patient-allergies').textContent = paciente.alergias;
        document.getElementById('detail-patient-conditions').textContent = paciente.condiciones;
        document.getElementById('detail-patient-last-visit').textContent = paciente.ultimaVisita;

        const consultasContainer = document.getElementById('detail-consultations');
        consultasContainer.innerHTML = '';
        paciente.consultas.forEach(con => {
            consultasContainer.innerHTML += `
                <div class="consultation-entry">
                    <strong>${con.fecha} - ${con.motivo}</strong>
                    <p>Diagnóstico: ${con.diag}</p>
                </div>`;
        });
        if (paciente.consultas.length === 0) {
            consultasContainer.innerHTML = '<p>No hay consultas anteriores.</p>';
        }

        document.getElementById('detail-tests').innerHTML = '<p>No hay exámenes registrados.</p>';
        document.getElementById('detail-prescriptions').innerHTML = '<p>No hay recetas registradas.</p>';

        vistaLista.style.display = 'none';
        vistaNuevoPaciente.style.display = 'none';
        vistaDetalle.style.display = 'block';
    }

    function mostrarFormularioNuevoPaciente() {
        vistaLista.style.display = 'none';
        vistaDetalle.style.display = 'none';
        vistaNuevoPaciente.style.display = 'block';
    }

    function deletePatient(patientId) {
        if (confirm(`¿Estás seguro de que quieres eliminar a este paciente? Esta acción no se puede deshacer.`)) {
            delete pacientesData[patientId];
            renderPatientTable();
            alert('Paciente eliminado con éxito.');
        }
    }


    tablaPacientesBody.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('view-patient-btn') && target.dataset.patientId) {
            event.preventDefault();
            mostrarDetallePaciente(target.dataset.patientId);
        }
        if (target.classList.contains('delete-patient-btn') && target.dataset.patientId) {
            event.preventDefault();
            deletePatient(target.dataset.patientId);
        }
        if (target.parentElement.classList.contains('delete-patient-btn') && target.parentElement.dataset.patientId) {
            event.preventDefault();
            deletePatient(target.parentElement.dataset.patientId);
        }
    });

    btnNuevoPaciente.addEventListener('click', (event) => {
        event.preventDefault();
        mostrarFormularioNuevoPaciente();
    });

    btnVolverDesdeDetalle.addEventListener('click', mostrarListaPacientes);
    btnVolverDesdeForm.addEventListener('click', mostrarListaPacientes);

    formNuevoPaciente.addEventListener('submit', (event) => {
        event.preventDefault();

        const nombre = document.getElementById('new-patient-name').value;
        const cedula = document.getElementById('new-patient-cedula').value;
        const edad = document.getElementById('new-patient-age').value;
        const contacto = document.getElementById('new-patient-contact').value;
        const alergias = document.getElementById('new-patient-allergies').value;
        const condiciones = document.getElementById('new-patient-conditions').value;

        const avatarFile = document.getElementById('new-patient-avatar').files[0];

        if (!nombre || !cedula) {
            alert('El Nombre y la Cédula son obligatorios.');
            return;
        }

        const guardarPaciente = (avatarDataUrl) => {
            const newId = 'p' + (Object.keys(pacientesData).length + 1);
            const hoy = new Date();
            const fechaHoy = hoy.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

            const newPatient = {
                id: newId,
                nombre: nombre,
                cedula: cedula,
                edad: edad || 'N/A',
                contacto: contacto || 'N/A',
                alergias: alergias || 'Ninguna',
                condiciones: condiciones || 'N/A',
                ultimaVisita: fechaHoy,
                motivoCita: "Nuevo Ingreso",
                avatar: avatarDataUrl,
                consultas: [],
            };

            pacientesData[newId] = newPatient;

            formNuevoPaciente.reset();

            renderPatientTable();
            mostrarListaPacientes();
        };


        if (avatarFile) {
            const reader = new FileReader();

            reader.onload = (e) => {
                const avatarDataURL = e.target.result;
                guardarPaciente(avatarDataURL);
            };

            reader.readAsDataURL(avatarFile);

        } else {
            const defaultAvatar = '../../sources/img/patient-default.png';
            guardarPaciente(defaultAvatar);
        }
    });

    renderPatientTable();
});