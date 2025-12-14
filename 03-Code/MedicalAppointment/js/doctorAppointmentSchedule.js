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

    const patientList = document.getElementById('patient-list');
    const patientNameHeader = document.getElementById('patient-name-header');
    const appointmentForm = document.getElementById('appointment-form');
    const appointmentDateInput = document.getElementById('appointment-date');
    const appointmentTimeSelect = document.getElementById('appointment-time');
    const reasonTextarea = document.getElementById('reason');
    const roomSelect = document.getElementById('room');
    const confirmationDetails = document.getElementById('confirmation-details');
    const appointmentsListContainer = document.getElementById('appointments-list-container');

    // --- Global State ---
    let patientsFromDB = [];
    let roomsFromDB = [];
    let currentPatient = null;
    let currentDoctorId = null;
    let currentUserId = null;
    let doctorSchedules = [];
    let appointmentsFromDB = [];

    // ----------------------------------------------------------------------------------
    // 🔐 AUTHENTICATION & FETCH HELPERS 🔐
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
            const patients = await response.json();
            patientsFromDB = (patients || []).map(p => ({
                user_id: p.id,
                name: `${p.first_name} ${p.last_name}`,
                first_name: p.first_name,
                last_name: p.last_name,
                cedula: p.cedula,
                email: p.email
            }));
            console.log("Pacientes cargados:", patientsFromDB);
            return patientsFromDB;
        } catch (error) {
            console.error("Error al cargar pacientes:", error);
            // Try fallback endpoint
            try {
                const fallbackResponse = await fetchWithAuth(`${API_BASE_URL}/doctors/patients`);
                const fallbackPatients = await fallbackResponse.json();
                patientsFromDB = (fallbackPatients || []).map(p => ({
                    user_id: p.user_id,
                    name: `${p.first_name} ${p.last_name}`,
                    first_name: p.first_name,
                    last_name: p.last_name,
                    cedula: p.cedula,
                    email: p.email
                }));
                return patientsFromDB;
            } catch (fallbackError) {
                console.error("Error al cargar pacientes (fallback):", fallbackError);
                alert("Error al cargar pacientes: " + error.message);
                patientsFromDB = [];
                return [];
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
        patientNameHeader.textContent = `Agendar cita para: ${patient.name}`;
        appointmentForm.reset();
        appointmentDateInput.value = '';
        appointmentTimeSelect.innerHTML = '<option value="">-- Seleccione una hora --</option>';

        step1Patient.style.display = 'none';
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
        patientList.innerHTML = '';
        const patients = patientsFromDB || [];

        if (patients.length === 0) {
            patientList.innerHTML = '<p>No hay pacientes registrados.</p>';
            return;
        }

        patients.forEach(patient => {
            const card = document.createElement('div');
            card.className = 'patient-card';
            card.innerHTML = `<i class="fas fa-user"></i><div class="patient-name">${patient.name}</div>`;
            card.addEventListener('click', () => showStep2(patient));
            patientList.appendChild(card);
        });
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
        document.getElementById('total-patients').textContent = patientsFromDB.length;
        document.getElementById('total-appointments').textContent = appointmentsFromDB.length;
    }

    // Get available times for a date based on doctor's schedule
    function getAvailableTimesForDate(date) {
        const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc
        const adjustedDay = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert to 0 = Monday format

        const scheduleForDay = doctorSchedules.find(s => s.day_of_week === adjustedDay && s.is_working_day);

        if (!scheduleForDay) {
            return []; // No schedule for this day
        }

        const times = [];
        const [startHour, startMin] = scheduleForDay.start_time.split(':').map(Number);
        const [endHour, endMin] = scheduleForDay.end_time.split(':').map(Number);

        let currentTime = new Date();
        currentTime.setHours(startHour, startMin, 0);

        const endTime = new Date();
        endTime.setHours(endHour, endMin, 0);

        // 30-minute intervals
        while (currentTime < endTime) {
            const timeString = currentTime.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
            times.push({
                time: timeString,
                datetime: new Date(currentTime)
            });
            currentTime.setMinutes(currentTime.getMinutes() + 30);
        }

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
            patient_user_id: currentPatient.user_id,
            doctor_id: currentDoctorId,
            scheduled_start: startDateTime.toISOString(),
            scheduled_end: endDateTime.toISOString(),
            reason: reason,
            room_id: roomId || null,
            status_id: 1 // Assuming 1 = scheduled
        };

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
