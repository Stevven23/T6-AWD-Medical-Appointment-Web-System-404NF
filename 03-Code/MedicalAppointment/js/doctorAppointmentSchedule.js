document.addEventListener('DOMContentLoaded', () => {

    // --- API Configuration ---
    const API_BASE_URL = window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : 'https://medical-appointment-backend-2xx0.onrender.com/api';

    // --- UI Elements ---
    const step1Patient = document.getElementById('step-1-patient');
    const step2Schedule = document.getElementById('step-2-schedule');
    const step3Confirmation = document.getElementById('step-3-confirmation');
    const step4Appointments = document.getElementById('step-4-appointments');

    const activePatientList = document.getElementById('active-patient-list');
    const newPatientList = document.getElementById('new-patient-list');
    const patientNameHeader = document.getElementById('patient-name-header');
    const appointmentForm = document.getElementById('appointment-form');
    const appointmentDateInput = document.getElementById('appointment-date');
    const appointmentTimeSelect = document.getElementById('appointment-time');
    const reasonTextarea = document.getElementById('reason');
    const roomSelect = document.getElementById('room');
    const confirmationDetails = document.getElementById('confirmation-details');
    const appointmentsListContainer = document.getElementById('appointments-list-container');

    // --- Global State ---
    let activePatients = [];
    let newPatients = [];
    let roomsFromDB = [];
    let currentPatient = null;
    let currentDoctorId = null;
    let currentUserId = null;
    let doctorSchedules = [];
    let appointmentsFromDB = [];
    let editingAppointmentId = null;  // Track if we're editing

    // ----------------------------------------------------------------------------------
    // 🔐 AUTHENTICATION & FETCH HELPERS 🔐
    // ----------------------------------------------------------------------------------

    // Helper: return only first token of first name and first token of last name
    const shortFullName = (firstName, lastName) => {
        const f = (firstName || '').toString().trim().split(/\s+/)[0] || '';
        const l = (lastName || '').toString().trim().split(/\s+/)[0] || '';
        return `${f} ${l}`.trim();
    };

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
    // 📊 DATA LOADING FUNCTIONS 📊
    // ----------------------------------------------------------------------------------

    // Get current doctor info from user data
    async function loadCurrentDoctorInfo() {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            currentUserId = user.id;

            // Get doctor info from current user
            const response = await fetchWithAuth(`${API_BASE_URL}/doctors/me`);
            const doctorData = await response.json();
            currentDoctorId = doctorData.id;
            console.log("Doctor ID actual:", currentDoctorId);
            return doctorData;
        } catch (error) {
            console.error("Error al cargar información del doctor:", error);
            throw error;
        }
    }

    // Load patients from database
    async function loadPatientsFromDB() {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/doctors/my-patients`);
            const data = await response.json();
            
            activePatients = (data.activePatients || []).map(p => ({
                id: p.user_id || p.id,
                name: shortFullName(p.first_name, p.last_name),
                first_name: p.first_name,
                last_name: p.last_name,
                cedula: p.cedula,
                email: p.email
            }));
            
            newPatients = (data.newPatients || []).map(p => ({
                id: p.user_id || p.id,
                name: shortFullName(p.first_name, p.last_name),
                first_name: p.first_name,
                last_name: p.last_name,
                cedula: p.cedula,
                email: p.email
            }));
            
            console.log("Pacientes activos cargados:", activePatients);
            console.log("Pacientes nuevos cargados:", newPatients);
            return { activePatients, newPatients };
        } catch (error) {
            console.error("Error al cargar pacientes:", error);
            // Try fallback endpoint
            try {
                const fallbackResponse = await fetchWithAuth(`${API_BASE_URL}/doctors/patients`);
                const fallbackPatients = await fallbackResponse.json();
                activePatients = (fallbackPatients || []).map(p => ({
                    id: p.user_id || p.id,
                    name: shortFullName(p.first_name, p.last_name),
                    first_name: p.first_name,
                    last_name: p.last_name,
                    cedula: p.cedula,
                    email: p.email
                }));
                newPatients = [];
                return { activePatients, newPatients };
            } catch (fallbackError) {
                console.error("Error al cargar pacientes (fallback):", fallbackError);
                alert("Error al cargar pacientes: " + error.message);
                activePatients = [];
                newPatients = [];
                return { activePatients, newPatients };
            }
        }
    }

    // Load doctor's schedule
    async function loadDoctorSchedule() {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/doctors/schedule`);
            doctorSchedules = await response.json();
            console.log("Horarios del doctor cargados:", doctorSchedules);
            return doctorSchedules;
        } catch (error) {
            console.error("Error al cargar horarios:", error);
            doctorSchedules = [];
            return [];
        }
    }

    // Load consultation rooms
    async function loadRooms() {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/consultation-rooms`);
            roomsFromDB = await response.json();
            console.log("Salas cargadas:", roomsFromDB);
            populateRoomSelect();
            return roomsFromDB;
        } catch (error) {
            console.error("Error al cargar salas:", error);
            roomsFromDB = [];
            return [];
        }
    }

    // Load doctor's appointments
    async function loadAppointments() {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/appointments/doctor`);
            appointmentsFromDB = await response.json();
            console.log("Citas cargadas:", appointmentsFromDB);
            return appointmentsFromDB;
        } catch (error) {
            console.error("Error al cargar citas:", error);
            appointmentsFromDB = [];
            return [];
        }
    }

    // ----------------------------------------------------------------------------------
    // ⚙️ UI & LOGIC FUNCTIONS ⚙️
    // ----------------------------------------------------------------------------------

    function showStep1() {
        step1Patient.style.display = 'block';
        step2Schedule.style.display = 'none';
        step3Confirmation.style.display = 'none';
        step4Appointments.style.display = 'none';
        loadPatients();
    }

    function showStep2(patient) {
        currentPatient = patient;
        // Show step 1.5 (patient appointments) instead of going directly to schedule
        showStep1_5(patient);
    }

    function showStep1_5(patient) {
        currentPatient = patient;
        const step1_5 = document.getElementById('step-1-5-patient-appointments');
        document.getElementById('patient-appointments-header').textContent = `Citas de: ${patient.name}`;
        
        step1Patient.style.display = 'none';
        step1_5.style.display = 'block';
        step2Schedule.style.display = 'none';
        step3Confirmation.style.display = 'none';
        step4Appointments.style.display = 'none';

        loadPatientAppointments(patient.id);
    }

    function showStep2Schedule() {
        const step1_5 = document.getElementById('step-1-5-patient-appointments');
        patientNameHeader.textContent = `Agendar cita para: ${currentPatient.name}`;
        appointmentForm.reset();
        appointmentDateInput.value = '';
        appointmentTimeSelect.innerHTML = '<option value="">-- Seleccione una hora --</option>';

        step1Patient.style.display = 'none';
        step1_5.style.display = 'none';
        step2Schedule.style.display = 'block';
        step3Confirmation.style.display = 'none';
        step4Appointments.style.display = 'none';
    }

    function showStep3(appointmentData) {
        step1Patient.style.display = 'none';
        step2Schedule.style.display = 'none';
        step3Confirmation.style.display = 'block';
        step4Appointments.style.display = 'none';

        const formattedDate = new Date(appointmentData.scheduled_start).toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = new Date(appointmentData.scheduled_start).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });

        confirmationDetails.innerHTML = `
            <div class="confirmation-item">
                <strong>Paciente:</strong>
                <p>${currentPatient.name}</p>
            </div>
            <div class="confirmation-item">
                <strong>Fecha:</strong>
                <p>${formattedDate}</p>
            </div>
            <div class="confirmation-item">
                <strong>Hora:</strong>
                <p>${formattedTime}</p>
            </div>
            <div class="confirmation-item">
                <strong>Motivo:</strong>
                <p>${appointmentData.reason || 'No especificado'}</p>
            </div>
            <div class="confirmation-item">
                <strong>Sala:</strong>
                <p>${appointmentData.room_name || 'No asignada'}</p>
            </div>
        `;
    }

    function showStep4() {
        step1Patient.style.display = 'none';
        step2Schedule.style.display = 'none';
        step3Confirmation.style.display = 'none';
        step4Appointments.style.display = 'block';
        loadAppointmentsView();
    }

    function loadPatients() {
        // Load active patients
        activePatientList.innerHTML = '';
        if (activePatients.length === 0) {
            activePatientList.innerHTML = '<p style="color: #999;">No hay pacientes activos registrados.</p>';
        } else {
            activePatients.forEach(patient => {
                const card = document.createElement('div');
                card.className = 'patient-card';
                card.innerHTML = `<i class="fas fa-user"></i><div class="patient-name">${patient.name}</div>`;
                card.addEventListener('click', () => showStep2(patient));
                activePatientList.appendChild(card);
            });
        }

        // Load new patients
        newPatientList.innerHTML = '';
        if (newPatients.length === 0) {
            newPatientList.innerHTML = '<p style="color: #999;">No hay pacientes nuevos registrados.</p>';
        } else {
            newPatients.forEach(patient => {
                const card = document.createElement('div');
                card.className = 'patient-card';
                card.innerHTML = `<i class="fas fa-user"></i><div class="patient-name">${patient.name}</div>`;
                card.addEventListener('click', () => showStep2(patient));
                newPatientList.appendChild(card);
            });
        }
    }

    function populateRoomSelect() {
        roomSelect.innerHTML = '<option value="">-- Seleccione una sala (opcional) --</option>';
        roomsFromDB.forEach(room => {
            if (room.is_available) {
                const option = document.createElement('option');
                option.value = room.id;
                option.textContent = `${room.name} (${room.room_number})`;
                roomSelect.appendChild(option);
            }
        });
    }

    function loadStats() {
        const totalPatients = activePatients.length + newPatients.length;
        document.getElementById('total-patients').textContent = totalPatients;
        document.getElementById('total-appointments').textContent = appointmentsFromDB.length;
    }

    // Get available times for a date based on doctor's schedule
    function getAvailableTimesForDate(date) {
        // Parse date in local timezone, not UTC
        const [year, month, day] = date.split('-');
        const selectedDate = new Date(year, month - 1, day);
        const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0 = Monday format

        console.log('getAvailableTimesForDate:', date, 'parsed as:', selectedDate.toLocaleDateString(), 'dayOfWeek:', dayOfWeek, 'adjustedDay:', adjustedDay);

        const scheduleForDay = doctorSchedules.find(s => s.day_of_week === adjustedDay && s.is_working_day);
        console.log('scheduleForDay:', scheduleForDay);

        if (!scheduleForDay) {
            return []; // No schedule for this day
        }

        const times = [];
        const [startHour, startMin] = scheduleForDay.start_time.split(':').map(Number);
        const [endHour, endMin] = scheduleForDay.end_time.split(':').map(Number);

        // Create times using the SELECTED DATE, not today's date
        let currentTime = new Date(selectedDate);
        currentTime.setHours(startHour, startMin, 0);

        const endTime = new Date(selectedDate);
        endTime.setHours(endHour, endMin, 0);

        console.log('Horarios:', { startHour, startMin, endHour, endMin });

        // 30-minute intervals
        while (currentTime < endTime) {
            const timeString = currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            times.push({
                time: timeString,
                datetime: new Date(currentTime)
            });
            currentTime.setMinutes(currentTime.getMinutes() + 30);
        }

        console.log('Horas generadas:', times.length);
        return times;
    }

    function loadAppointmentsView() {
        appointmentsListContainer.innerHTML = '';

        if (appointmentsFromDB.length === 0) {
            appointmentsListContainer.innerHTML = '<p>No hay citas agendadas próximamente.</p>';
            return;
        }

        // Filter and sort upcoming appointments
        const now = new Date();
        const upcomingAppointments = appointmentsFromDB
            .filter(a => new Date(a.scheduled_start) > now)
            .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));

        upcomingAppointments.forEach(apt => {
            const startDate = new Date(apt.scheduled_start);
            const formattedDate = startDate.toLocaleDateString('es-ES');
            const formattedTime = startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            const card = document.createElement('div');
            card.className = 'appointment-card';
            card.innerHTML = `
                <div class="appointment-header">
                    <h3>${apt.patient_name || 'Paciente'}</h3>
                    <span class="appointment-status">${apt.status_label || 'Agendada'}</span>
                </div>
                <div class="appointment-details">
                    <p><i class="fas fa-calendar"></i> ${formattedDate}</p>
                    <p><i class="fas fa-clock"></i> ${formattedTime}</p>
                    <p><i class="fas fa-stethoscope"></i> ${apt.reason || 'Sin motivo especificado'}</p>
                </div>
            `;
            appointmentsListContainer.appendChild(card);
        });
    }

    // Load patient appointments (for step 1.5)
    function loadPatientAppointments(patientId) {
        const container = document.getElementById('patient-appointments-list');
        container.innerHTML = '';

        console.log('loadPatientAppointments: patientId =', patientId);
        console.log('loadPatientAppointments: appointmentsFromDB =', appointmentsFromDB);

        const patientAppointments = appointmentsFromDB.filter(a => {
            console.log('Comparando:', a.patient_user_id, '===', patientId, '?', a.patient_user_id === patientId);
            return a.patient_user_id === patientId;
        });

        console.log('loadPatientAppointments: patientAppointments encontradas =', patientAppointments);

        if (patientAppointments.length === 0) {
            container.innerHTML = '<p style="color: #999; text-align: center;">Este paciente no tiene citas agendadas.</p>';
            return;
        }

        patientAppointments.forEach(apt => {
            const startDate = new Date(apt.scheduled_start);
            const formattedDate = startDate.toLocaleDateString('es-ES');
            const formattedTime = startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

            const card = document.createElement('div');
            card.style.cssText = 'background:#f9f9f9;border:1px solid #ddd;border-radius:8px;padding:12px;margin-bottom:12px;';
            card.innerHTML = `
                <div style="display:flex;justify-content:space-between;align-items:start;gap:10px;">
                    <div style="flex:1;">
                        <p><strong>Fecha:</strong> ${formattedDate}</p>
                        <p><strong>Hora:</strong> ${formattedTime}</p>
                        <p><strong>Motivo:</strong> ${apt.reason || 'No especificado'}</p>
                        <p><strong>ID Cita:</strong> <small>${apt.id}</small></p>
                    </div>
                    <div style="display:flex;gap:6px;flex-direction:column;">
                        <button class="btn-edit-appointment" data-apt-id="${apt.id}" style="padding:6px 12px;background:#2196F3;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.85rem;">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        <button class="btn-delete-appointment" data-apt-id="${apt.id}" style="padding:6px 12px;background:#f44336;color:white;border:none;border-radius:4px;cursor:pointer;font-size:0.85rem;">
                            <i class="fas fa-trash"></i> Eliminar
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });

        // Add event listeners to edit/delete buttons
        document.querySelectorAll('.btn-edit-appointment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const aptId = e.currentTarget.getAttribute('data-apt-id');
                console.log('Botón editar clickeado, aptId:', aptId);
                editAppointment(aptId);
            });
        });

        document.querySelectorAll('.btn-delete-appointment').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const aptId = e.currentTarget.getAttribute('data-apt-id');
                deleteAppointment(aptId);
            });
        });
    }

    async function editAppointment(appointmentId) {
        const apt = appointmentsFromDB.find(a => a.id === appointmentId);
        console.log('Editando cita:', appointmentId, apt);
        
        if (!apt) {
            alert('No se encontró la cita');
            console.error('Cita no encontrada. appointmentsFromDB:', appointmentsFromDB);
            return;
        }

        editingAppointmentId = appointmentId;  // Mark we're editing
        const startDate = new Date(apt.scheduled_start);
        const dateString = startDate.toISOString().split('T')[0];
        const timeString = startDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

        console.log('Valores a precargar:', { dateString, timeString, reason: apt.reason, roomId: apt.room_id });

        // Show schedule form to edit first (it will reset the form)
        showStep2Schedule();

        // Now set form values
        appointmentDateInput.value = dateString;
        reasonTextarea.value = apt.reason || '';
        roomSelect.value = apt.room_id || '';

        // Fill the time select directly using the selected date
        const availableTimes = getAvailableTimesForDate(dateString);
        console.log('Horas disponibles para editar:', availableTimes);

        appointmentTimeSelect.innerHTML = '<option value="">-- Seleccione una hora --</option>';
        if (availableTimes.length > 0) {
            availableTimes.forEach(slot => {
                const option = document.createElement('option');
                option.value = slot.time;
                option.textContent = slot.time;
                appointmentTimeSelect.appendChild(option);
            });
        }

        // After a short delay, find and set the matching time option
        setTimeout(() => {
            console.log('Buscando opción con hora:', timeString);
            console.log('Total opciones en select:', appointmentTimeSelect.options.length);

            // Find the option that matches the time
            const options = Array.from(appointmentTimeSelect.options);

            const matchingOption = options.find(opt => {
                const optText = opt.text.trim();
                console.log('Comparando:', optText, '===', timeString, '?', optText === timeString);
                return optText === timeString;
            });

            if (matchingOption) {
                appointmentTimeSelect.value = matchingOption.value;
                console.log('Hora establecida:', matchingOption.value);
            } else {
                console.warn('No se encontró opción para la hora:', timeString);
                console.log('Opciones disponibles:', Array.from(appointmentTimeSelect.options).map(o => o.text));
            }
        }, 200);
    }

    async function deleteAppointment(appointmentId) {
        if (!confirm('¿Está seguro de que desea eliminar esta cita?')) {
            return;
        }

        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/appointments/${appointmentId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Error al eliminar la cita');
            }

            alert('Cita eliminada exitosamente');
            await loadAppointments();
            loadPatientAppointments(currentPatient.id);
            loadStats();
        } catch (error) {
            console.error('Error al eliminar cita:', error);
            alert('Error al eliminar cita: ' + error.message);
        }
    }

    // Save appointment
    async function saveAppointment(appointmentData) {
        try {
            const response = await fetchWithAuth(`${API_BASE_URL}/appointments/doctor/create`, {
                method: 'POST',
                body: JSON.stringify(appointmentData)
            });

            const result = await response.json();
            console.log("Cita agendada:", result);
            return result.appointment || result;
        } catch (error) {
            console.error("Error al agendar cita:", error);
            alert('Error al agendar cita: ' + error.message);
            throw error;
        }
    }

    // ----------------------------------------------------------------------------------
    // 👂 EVENT LISTENERS 👂
    // ----------------------------------------------------------------------------------

    // Button: Back to patients
    document.getElementById('back-to-patients').addEventListener('click', showStep1);

    // Button: Back to patient list (from step 1.5)
    document.getElementById('back-to-patient-list').addEventListener('click', showStep1);

    // Button: Add new appointment (from step 1.5)
    document.getElementById('btn-add-new-appointment').addEventListener('click', showStep2Schedule);

    // Button: Cancel appointment
    document.getElementById('btn-cancel-appointment').addEventListener('click', showStep1);

    // Button: New appointment (from confirmation)
    document.getElementById('btn-new-appointment').addEventListener('click', showStep1);

    // Button: View appointments
    document.getElementById('btn-view-appointments').addEventListener('click', showStep4);

    // Button: Back from appointments
    document.getElementById('back-from-appointments').addEventListener('click', showStep1);

    // Date input change
    appointmentDateInput.addEventListener('change', (e) => {
        const selectedDate = e.target.value;
        if (!selectedDate) {
            appointmentTimeSelect.innerHTML = '<option value="">-- Seleccione una hora --</option>';
            return;
        }

        const availableTimes = getAvailableTimesForDate(selectedDate);

        if (availableTimes.length === 0) {
            appointmentTimeSelect.innerHTML = '<option value="">No hay horarios disponibles para este día</option>';
            return;
        }

        appointmentTimeSelect.innerHTML = '<option value="">-- Seleccione una hora --</option>';
        availableTimes.forEach(slot => {
            const option = document.createElement('option');
            option.value = slot.time;
            option.textContent = slot.time;
            appointmentTimeSelect.appendChild(option);
        });
    });

    // Form submission
    appointmentForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!currentPatient) {
            alert('Por favor seleccione un paciente');
            return;
        }

        const selectedDate = appointmentDateInput.value;
        const selectedTime = appointmentTimeSelect.value;
        const reason = reasonTextarea.value;
        const roomId = roomSelect.value;

        if (!selectedDate || !selectedTime) {
            alert('Por favor seleccione fecha y hora');
            return;
        }

        // Construct datetime
        const [hour, min] = selectedTime.split(':').map(Number);
        const startDateTime = new Date(selectedDate);
        startDateTime.setHours(hour, min, 0);

        const endDateTime = new Date(startDateTime);
        endDateTime.setMinutes(endDateTime.getMinutes() + 30); // Default 30-minute appointment

        const appointmentData = {
            patient_user_id: currentPatient.id,
            doctor_id: currentDoctorId,
            scheduled_start: startDateTime.toISOString(),
            scheduled_end: endDateTime.toISOString(),
            reason: reason,
            room_id: roomId || null,
            status_id: 1 // Assuming 1 = scheduled
        };

        console.log('Enviando cita:', appointmentData);

        try {
            const savedAppointment = await saveAppointment(appointmentData);
            showStep3(appointmentData);
            await loadAppointments(); // Refresh appointments list
            loadStats();
        } catch (error) {
            console.error("Error al guardar cita:", error);
        }
    });

    // ----------------------------------------------------------------------------------
    // 🚀 INITIALIZATION 🚀
    // ----------------------------------------------------------------------------------

    Promise.all([
        loadCurrentDoctorInfo(),
        loadPatientsFromDB(),
        loadDoctorSchedule(),
        loadRooms(),
        loadAppointments()
    ])
        .then(() => {
            loadStats();
            showStep1();
        })
        .catch(error => {
            console.error("Error al cargar datos iniciales:", error);
            showStep1();
        });
});
