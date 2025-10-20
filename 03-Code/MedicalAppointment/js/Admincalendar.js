// Datos de prueba
const doctors = [
    'Dr. Carlos Méndez',
    'Dra. María González',
    'Dr. Juan Rodríguez',
    'Dra. Ana Martínez',
    'Dr. Pedro López'
];

const specialties = [
    'Cardiología',
    'Pediatría',
    'Traumatología',
    'Ginecología',
    'Dermatología'
];

const appointments = {
    '2025-10-19': [
        { time: '09:00', patient: 'Juan Pérez', doctor: 'Dr. Carlos Méndez', specialty: 'Cardiología' },
        { time: '10:30', patient: 'María López', doctor: 'Dra. María González', specialty: 'Pediatría' },
        { time: '14:00', patient: 'Pedro Gómez', doctor: 'Dr. Juan Rodríguez', specialty: 'Traumatología' }
    ],
    '2025-10-20': [
        { time: '08:30', patient: 'Ana Martín', doctor: 'Dra. Ana Martínez', specialty: 'Ginecología' },
        { time: '11:00', patient: 'Luis García', doctor: 'Dr. Pedro López', specialty: 'Dermatología' }
    ],
    '2025-10-22': [
        { time: '09:30', patient: 'Carmen Ruiz', doctor: 'Dr. Carlos Méndez', specialty: 'Cardiología' },
        { time: '15:00', patient: 'Roberto Silva', doctor: 'Dra. María González', specialty: 'Pediatría' }
    ],
    '2025-10-25': [
        { time: '10:00', patient: 'Laura Torres', doctor: 'Dr. Juan Rodríguez', specialty: 'Traumatología' }
    ]
};

let currentDate = new Date();
let selectedDate = new Date();

const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

function initializeFilters() {
    const doctorSelect = document.getElementById('filterDoctor');
    const specialtySelect = document.getElementById('filterSpecialty');

    doctors.forEach(doctor => {
        const option = document.createElement('option');
        option.value = doctor;
        option.textContent = doctor;
        doctorSelect.appendChild(option);
    });

    specialties.forEach(specialty => {
        const option = document.createElement('option');
        option.value = specialty;
        option.textContent = specialty;
        specialtySelect.appendChild(option);
    });
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    document.getElementById('currentMonth').textContent = 
        `${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const grid = document.getElementById('calendarGrid');
    grid.innerHTML = '';

    // Headers
    dayNames.forEach(day => {
        const header = document.createElement('div');
        header.className = 'calendar-day-header';
        header.textContent = day;
        grid.appendChild(header);
    });

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i;
        const dayElement = createDayElement(day, true, month - 1, year);
        grid.appendChild(dayElement);
    }

    // Current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = createDayElement(day, false, month, year);
        
        // Check if it's today
        if (year === today.getFullYear() && 
            month === today.getMonth() && 
            day === today.getDate()) {
            dayElement.classList.add('today');
        }

        // Check if selected
        if (year === selectedDate.getFullYear() && 
            month === selectedDate.getMonth() && 
            day === selectedDate.getDate()) {
            dayElement.classList.add('selected');
        }

        // Check if has appointments
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (appointments[dateStr]) {
            dayElement.classList.add('has-appointments');
        }

        grid.appendChild(dayElement);
    }

    const totalCells = grid.children.length - 7;
    const remainingCells = 42 - totalCells;
    for (let day = 1; day <= remainingCells; day++) {
        const dayElement = createDayElement(day, true, month + 1, year);
        grid.appendChild(dayElement);
    }
}

function createDayElement(day, isOtherMonth, month, year) {
    const div = document.createElement('div');
    div.className = 'calendar-day';
    if (isOtherMonth) div.classList.add('other-month');

    const dayNumber = document.createElement('div');
    dayNumber.className = 'day-number';
    dayNumber.textContent = day;
    div.appendChild(dayNumber);

    if (!isOtherMonth) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        if (appointments[dateStr]) {
            const indicator = document.createElement('div');
            indicator.className = 'appointments-indicator';
            div.appendChild(indicator);
        }
    }

    div.addEventListener('click', () => {
        selectedDate = new Date(year, month, day);
        renderCalendar();
        showAppointments();
    });

    return div;
}

function showAppointments() {
    const dateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    
    document.getElementById('selectedDate').textContent = 
        `${selectedDate.getDate()} de ${monthNames[selectedDate.getMonth()]} de ${selectedDate.getFullYear()}`;

    const list = document.getElementById('appointmentsList');
    const dayAppointments = appointments[dateStr] || [];

    if (dayAppointments.length === 0) {
        list.innerHTML = '<div class="no-appointments">📭 No hay citas programadas para este día</div>';
        return;
    }

    list.innerHTML = dayAppointments.map(apt => `
        <div class="appointment-card">
            <div class="appointment-time">🕐 ${apt.time}</div>
            <div class="appointment-patient">👤 ${apt.patient}</div>
            <div class="appointment-doctor">👨‍⚕️ ${apt.doctor}</div>
            <span class="appointment-specialty">${apt.specialty}</span>
        </div>
    `).join('');
}

function previousMonth() {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
}

function nextMonth() {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
}

function addAppointment() {
    alert('Función para agregar nueva cita\nEsta función abrirá un formulario modal');
}

document.addEventListener('DOMContentLoaded', () => {
    initializeFilters();
    renderCalendar();
    showAppointments();
});