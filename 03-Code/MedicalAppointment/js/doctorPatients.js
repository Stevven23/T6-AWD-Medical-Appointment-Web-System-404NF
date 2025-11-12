// Espera a que todo el HTML esté cargado
document.addEventListener('DOMContentLoaded', () => {

    // --- 1. "BASE DE DATOS" DE PACIENTES (Mutable) ---
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

    // --- 2. REFERENCIAS A LOS ELEMENTOS DEL DOM ---

    // Vistas principales
    const vistaLista = document.getElementById('patient-list-page');
    const vistaDetalle = document.getElementById('appointment-details-page');
    const vistaNuevoPaciente = document.getElementById('new-patient-form-page');

    // Elementos de la Lista
    const tablaPacientesBody = document.getElementById('patient-table-body');
    const btnNuevoPaciente = document.querySelector('#patient-list-page .btn-primary'); // Botón "+ Nuevo Paciente"

    // Elementos del Detalle
    const btnVolverDesdeDetalle = document.getElementById('btn-back-to-list');

    // Elementos del Formulario
    const btnVolverDesdeForm = document.getElementById('btn-back-to-list-from-form');
    const formNuevoPaciente = document.getElementById('new-patient-form');


    // --- 3. FUNCIONES DE RENDERIZADO Y NAVEGACIÓN ---

    /**
     * Dibuja la tabla de pacientes en el HTML.
     * Lee los datos de `pacientesData` y los inserta en el <tbody>.
     */
    function renderPatientTable() {
        // Limpiar la tabla antes de dibujar
        tablaPacientesBody.innerHTML = '';

        // Recorrer los datos y crear una fila (tr) por cada paciente
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

    // --- Funciones para cambiar de vista ---

    function mostrarListaPacientes() {
        vistaDetalle.style.display = 'none';
        vistaNuevoPaciente.style.display = 'none';
        vistaLista.style.display = 'block';
        renderPatientTable(); // Volvemos a renderizar la tabla para asegurar que esté actualizada
    }

    function mostrarDetallePaciente(pacienteId) {
        const paciente = pacientesData[pacienteId];
        if (!paciente) return;

        // Llenar datos del detalle
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

        // Cambiar vista
        vistaLista.style.display = 'none';
        vistaNuevoPaciente.style.display = 'none';
        vistaDetalle.style.display = 'block';
    }

    function mostrarFormularioNuevoPaciente() {
        vistaLista.style.display = 'none';
        vistaDetalle.style.display = 'none';
        vistaNuevoPaciente.style.display = 'block';
    }

    // --- Función para Eliminar Paciente ---
    function deletePatient(patientId) {
        if (confirm(`¿Estás seguro de que quieres eliminar a este paciente? Esta acción no se puede deshacer.`)) {
            delete pacientesData[patientId]; // Eliminar el paciente del objeto
            renderPatientTable(); // Volver a dibujar la tabla para reflejar el cambio
            alert('Paciente eliminado con éxito.');
        }
    }


    // --- 4. MANEJO DE EVENTOS ---

    // Evento para los botones "Ver Expediente" y "Eliminar" (Delegación)
    tablaPacientesBody.addEventListener('click', (event) => {
        const target = event.target;
        // Para "Ver Expediente"
        if (target.classList.contains('view-patient-btn') && target.dataset.patientId) {
            event.preventDefault();
            mostrarDetallePaciente(target.dataset.patientId);
        }
        // Para "Eliminar"
        if (target.classList.contains('delete-patient-btn') && target.dataset.patientId) {
            event.preventDefault();
            deletePatient(target.dataset.patientId);
        }
        // Si el click es en el icono dentro del botón de eliminar
        if (target.parentElement.classList.contains('delete-patient-btn') && target.parentElement.dataset.patientId) {
            event.preventDefault();
            deletePatient(target.parentElement.dataset.patientId);
        }
    });

    // Evento para el botón "+ Nuevo Paciente"
    btnNuevoPaciente.addEventListener('click', (event) => {
        event.preventDefault();
        mostrarFormularioNuevoPaciente();
    });

    // Eventos para los botones "Volver"
    btnVolverDesdeDetalle.addEventListener('click', mostrarListaPacientes);
    btnVolverDesdeForm.addEventListener('click', mostrarListaPacientes);

    // Evento para "Guardar Paciente" (Submit del formulario)
    formNuevoPaciente.addEventListener('submit', (event) => {
        event.preventDefault(); // ¡MUY IMPORTANTE! Evita que la página se recargue

        // 1. Leer los datos del formulario
        const nombre = document.getElementById('new-patient-name').value;
        const cedula = document.getElementById('new-patient-cedula').value;
        const edad = document.getElementById('new-patient-age').value;
        const contacto = document.getElementById('new-patient-contact').value;
        const alergias = document.getElementById('new-patient-allergies').value;
        const condiciones = document.getElementById('new-patient-conditions').value;

        // 2. Leer el ARCHIVO de la foto
        const avatarFile = document.getElementById('new-patient-avatar').files[0];

        // 3. Validación simple
        if (!nombre || !cedula) {
            alert('El Nombre y la Cédula son obligatorios.');
            return;
        }

        // 4. Función interna para guardar el paciente (se llamará después de leer la foto)
        const guardarPaciente = (avatarDataUrl) => {
            const newId = 'p' + (Object.keys(pacientesData).length + 1); // Crea un ID simple (p6, p7...)
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
                ultimaVisita: fechaHoy, // La última visita es hoy
                motivoCita: "Nuevo Ingreso",
                avatar: avatarDataUrl, // ¡Aquí usamos el Data URL de la foto!
                consultas: [], // Empeza sin consultas
            };

            // 5. Añadirlo a nuestra "base de datos"
            pacientesData[newId] = newPatient;

            // 6. Limpiar el formulario
            formNuevoPaciente.reset();

            // 7. Volver a dibujar la tabla y mostrar la lista
            renderPatientTable();
            mostrarListaPacientes();
        };


        // 5. Lógica de la foto: ¿El usuario subió un archivo?
        if (avatarFile) {
            // SÍ subió un archivo: Usar FileReader para convertirlo a base64
            const reader = new FileReader();

            reader.onload = (e) => {
                // Cuando la lectura esté completa, 'e.target.result' tendrá el Data URL
                const avatarDataURL = e.target.result;
                guardarPaciente(avatarDataURL); // Llamar a guardar con la foto
            };

            // Iniciar la lectura del archivo
            reader.readAsDataURL(avatarFile);

        } else {
            // NO subió un archivo: Usar la imagen por defecto
            const defaultAvatar = '../../sources/img/patient-default.png'; // Asegúrate de tener esta imagen
            guardarPaciente(defaultAvatar); // Llamar a guardar con el default
        }
    });


    // --- 5. INICIALIZACIÓN ---
    // Dibujar la tabla por primera vez al cargar la página
    renderPatientTable();
});