
document.addEventListener('DOMContentLoaded', function () {

    const monthYearDisplay = document.getElementById('currentMonthYear');
    const calendarDaysGrid = document.getElementById('calendarDays');
    const prevMonthBtn = document.getElementById('prevMonthBtn');
    const nextMonthBtn = document.getElementById('nextMonthBtn');

    let currentDate = new Date();

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthNames = [
            "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
            "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
        ];

        if (monthYearDisplay) {
            monthYearDisplay.textContent = `${monthNames[month]} ${year}`;
        }

        if (calendarDaysGrid) {
            calendarDaysGrid.innerHTML = '';
        } else {
            return;
        }

        let firstDayOfMonth = new Date(year, month, 1).getDay();
        if (firstDayOfMonth === 0) {
            firstDayOfMonth = 7;
        }

        const daysInLastMonth = new Date(year, month, 0).getDate();

        const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();

        for (let i = firstDayOfMonth - 1; i > 0; i--) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day', 'other-month');
            dayElement.textContent = daysInLastMonth - i + 1;
            calendarDaysGrid.appendChild(dayElement);
        }

        for (let i = 1; i <= daysInCurrentMonth; i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day');
            dayElement.textContent = i;

            const today = new Date();
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('today');
            }

            calendarDaysGrid.appendChild(dayElement);
        }

        const totalCells = calendarDaysGrid.children.length;
        const nextMonthDay = 1;
        for (let i = totalCells; i < 42; i++) {
            const dayElement = document.createElement('div');
            dayElement.classList.add('calendar-day', 'other-month');
            dayElement.textContent = nextMonthDay++;
            calendarDaysGrid.appendChild(dayElement);
        }
    }

    if (prevMonthBtn) {
        prevMonthBtn.addEventListener('click', function () {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
            console.log('Navegar al mes anterior');
        });
    }

    if (nextMonthBtn) {
        nextMonthBtn.addEventListener('click', function () {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
            console.log('Navegar al mes siguiente');
        });
    }

    if (calendarDaysGrid) {
        calendarDaysGrid.addEventListener('click', function (event) {
            const clickedDay = event.target.closest('.calendar-day');

            if (clickedDay && !clickedDay.classList.contains('other-month')) {
                document.querySelectorAll('.calendar-day.selected').forEach(d => {
                    d.classList.remove('selected');
                });

                clickedDay.classList.add('selected');

                const dayNumber = clickedDay.textContent;
                console.log(`Día seleccionado: ${dayNumber}`);
            }
        });
    }

    const applyFiltersBtn = document.getElementById('applyFilters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function () {
            const doctor = document.getElementById('doctorFilter').value;
            const specialty = document.getElementById('specialtyFilter').value;
            const status = document.getElementById('statusFilter').value;
            const patient = document.getElementById('patientSearch').value;

            console.log('Filtros aplicados:', { doctor, specialty, status, patient });
            alert('Filtros aplicados');
        });
    }

    const clearFiltersBtn = document.getElementById('clearFilters');
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', function () {
            document.getElementById('doctorFilter').value = '';
            document.getElementById('specialtyFilter').value = '';
            document.getElementById('statusFilter').value = '';
            document.getElementById('patientSearch').value = '';

            console.log('Filtros limpiados');
            alert('Filtros limpiados');
        });
    }
    renderCalendar();

});