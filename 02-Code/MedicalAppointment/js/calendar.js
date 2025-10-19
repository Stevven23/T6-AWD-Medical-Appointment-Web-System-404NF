document.addEventListener('DOMContentLoaded', () => {
    const currentMonthYearSpan = document.getElementById('currentMonthYear');
    const calendarDaysDiv = document.getElementById('calendarDays');

    let currentDate = new Date();

    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        currentMonthYearSpan.textContent = `${monthNames[month]} ${year}`;

        calendarDaysDiv.innerHTML = '';

        // Obtener el primer día del mes (0 = Domingo, 1 = Lunes, etc.)
        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const startDayIndex = (firstDayOfMonth === 0) ? 6 : firstDayOfMonth - 1;

        const lastDayOfMonth = new Date(year, month + 1, 0).getDate();

        const lastDayOfPrevMonth = new Date(year, month, 0).getDate();
        for (let i = startDayIndex; i > 0; i--) {
            const dayElement = document.createElement('span');
            dayElement.classList.add('inactive');
            dayElement.textContent = lastDayOfPrevMonth - i + 1;
            calendarDaysDiv.appendChild(dayElement);
        }

        const today = new Date();
        for (let i = 1; i <= lastDayOfMonth; i++) {
            const dayElement = document.createElement('span');
            dayElement.textContent = i;
            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayElement.classList.add('today');
            }
            calendarDaysDiv.appendChild(dayElement);
        }

        const totalCells = calendarDaysDiv.children.length;
        const remainingCells = 42 - totalCells;
        for (let i = 1; i <= remainingCells; i++) {
            const dayElement = document.createElement('span');
            dayElement.classList.add('inactive');
            dayElement.textContent = i;
            calendarDaysDiv.appendChild(dayElement);
        }
    }

    renderCalendar();
});


document.addEventListener('DOMContentLoaded', () => {
    function updateCurrentTimeLine() {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        // Calendario empieza a las 7 AM
        const startHour = 7;
        const totalMinutesSinceStart = (hours - startHour) * 60 + minutes;

        // Si la hora actual está fuera del rango visible del calendario, ocultar la línea
        if (hours < startHour || hours > 22) {
            document.querySelectorAll('.current-time-line').forEach(line => {
                line.style.display = 'none';
            });
            return;
        }

        const position = (totalMinutesSinceStart / 60) * 60;

        document.querySelectorAll('.current-time-line').forEach(line => {
            line.style.top = `${position}px`;
            line.style.display = 'block';
        });

        const calendarBody = document.querySelector('.calendar-body');
        if (calendarBody) {
            const scrollOffset = position - (calendarBody.offsetHeight / 2);
            calendarBody.scrollTop = Math.max(0, scrollOffset);
        }
    }

    updateCurrentTimeLine();
    setInterval(updateCurrentTimeLine, 60 * 1000);

    const todayElement = document.querySelector('.day-label.today');
});

// calendar.js

document.addEventListener('DOMContentLoaded', () => {
    const calendarHeaderWeek = document.querySelector('.calendar-header-week');
    const dayLabels = calendarHeaderWeek.querySelectorAll('.day-label');
    const calendarBody = document.querySelector('.calendar-body');
    const dayColumns = calendarBody.querySelectorAll('.day-column');
    const timeColumn = calendarBody.querySelector('.time-column');

    const today = new Date();
    const currentDay = today.getDay();
    const todayDate = today.getDate();

    // Función para obtener el nombre del día
    const getDayName = (dayIndex) => {
        const names = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];
        return names[dayIndex];
    };

    let currentDayIterator = new Date(today);
    currentDayIterator.setDate(today.getDate() - currentDay);

    dayLabels.forEach((label, index) => {
        const dayNameSpan = label.querySelector('.day-name');
        const dayNumberSpan = label.querySelector('.day-number');

        dayNameSpan.textContent = getDayName(currentDayIterator.getDay());
        dayNumberSpan.textContent = currentDayIterator.getDate();

        label.classList.remove('today');
        if (currentDayIterator.toDateString() === today.toDateString()) {
            label.classList.add('today');
        }

        currentDayIterator.setDate(currentDayIterator.getDate() + 1);
    });

    // Scroll to current day
    const dayColumnsWithoutTime = Array.from(dayColumns).slice(0);

    if (dayColumnsWithoutTime[currentDay]) {
        const columnWidth = dayColumnsWithoutTime[currentDay].offsetWidth;
        const timeColumnWidth = timeColumn.offsetWidth;
        const scrollPosition = timeColumnWidth + (columnWidth * currentDay);

        calendarBody.scrollTo({
            left: scrollPosition,
            behavior: 'smooth'
        });
    }

    // Current time line handling
    const todayColumn = Array.from(dayColumns).find((col, index) => {
        return dayLabels[index].classList.contains('today');
    });

    if (todayColumn) {
        const currentTimeLine = todayColumn.querySelector('.current-time-line');
        if (!currentTimeLine) {
            const newTimeLine = document.createElement('div');
            newTimeLine.classList.add('current-time-line');
            todayColumn.appendChild(newTimeLine);
            updateCurrentTimeLinePosition(newTimeLine);
            setInterval(() => updateCurrentTimeLinePosition(newTimeLine), 60 * 1000);
        } else {
            updateCurrentTimeLinePosition(currentTimeLine);
            setInterval(() => updateCurrentTimeLinePosition(currentTimeLine), 60 * 1000);
        }
    }

    function updateCurrentTimeLinePosition(lineElement) {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        const startHour = 7;
        const totalMinutesFromStart = (hours * 60 + minutes) - (startHour * 60);
        const topPosition = (totalMinutesFromStart < 0) ? 0 : totalMinutesFromStart;

        lineElement.style.top = `${topPosition}px`;
    }
});


document.addEventListener('DOMContentLoaded', () => {
    const headerScrollable = document.querySelector('.days-header-scrollable');
    const bodyScrollable = document.querySelector('.days-columns-scrollable');
    const timeColumnScrollable = document.querySelector('.time-column');

    if (headerScrollable && bodyScrollable) {
        // Sincronizar el scroll horizontal del header con el body
        headerScrollable.addEventListener('scroll', () => {
            bodyScrollable.scrollLeft = headerScrollable.scrollLeft;
        });

        bodyScrollable.addEventListener('scroll', () => {
            headerScrollable.scrollLeft = bodyScrollable.scrollLeft;
        });
    }

    // Opcional: Si quieres que el scroll vertical de las citas también afecte la línea de tiempo actual
    if (timeColumnScrollable) {
        timeColumnScrollable.addEventListener('scroll', () => {
            // Aquí puedes ajustar la posición de la línea de tiempo si es dinámico
            // Por ahora, solo nos aseguramos de que el scroll vertical funcione para las horas
        });
    }

    // Lógica para la línea de tiempo actual (si no la tienes ya)
    const updateCurrentTimeLine = () => {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();

        // Asumiendo que 7 AM es la primera hora mostrada (índice 0)
        const startHour = 7;
        const totalMinutesFromStart = (hours - startHour) * 60 + minutes;

        // Cada hora tiene 60px de alto, así que 1 minuto es 1px
        const pixelsFromTop = totalMinutesFromStart;

        const currentDayColumn = document.querySelector('.day-column.today');
        if (currentDayColumn) {
            let timeLine = currentDayColumn.querySelector('.current-time-line');
            if (!timeLine) {
                timeLine = document.createElement('div');
                timeLine.className = 'current-time-line';
                currentDayColumn.appendChild(timeLine);
            }
            // Asegurarse de que la línea se mueva dentro del contenedor desplazable verticalmente
            timeLine.style.top = `${pixelsFromTop}px`;
        }
    };

    // Llama a la función al cargar y cada minuto para mantenerla actualizada
    updateCurrentTimeLine();
    setInterval(updateCurrentTimeLine, 60 * 1000); // Actualizar cada minuto
});