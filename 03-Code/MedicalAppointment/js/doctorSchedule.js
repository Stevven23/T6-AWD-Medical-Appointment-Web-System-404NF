document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : 'https://medical-appointment-backend-2xx0.onrender.com/api';

    const calendarGrid = document.querySelector('.calendar-grid-layout');
    const currentTimeLine = document.querySelector('.current-time-line');

    const getAuthHeaders = () => {
        const token = localStorage.getItem('token');
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    };

    const fetchWithAuth = async (url) => {
        const res = await fetch(url, { headers: getAuthHeaders() });
        if (!res.ok) throw new Error('Error fetching ' + url);
        return res.json();
    };

    function startOfWeek(date) {
        const d = new Date(date);
        const day = d.getDay();
        // Make Monday = 0
        const diff = (day === 0 ? -6 : 1 - day);
        d.setDate(d.getDate() + diff);
        d.setHours(0,0,0,0);
        return d;
    }

    function formatDayName(date) {
        return date.toLocaleDateString('es-ES', { weekday: 'short' }).toUpperCase();
    }

    function pad(n){ return n.toString().padStart(2,'0'); }

    function timeStringToMinutes(t) {
        // handles '09:00:00' or '09:00' or '09:00:00+00:00'
        const hhmm = t.split('T').pop().split('+')[0].split('Z')[0];
        const parts = hhmm.split(':');
        return parseInt(parts[0],10)*60 + parseInt(parts[1]||0,10);
    }

    function minutesToTimeString(m) {
        const hh = Math.floor(m/60);
        const mm = m % 60;
        return `${pad(hh)}:${pad(mm)}`;
    }

    async function buildCalendar() {
        try {
            const [schedules, appointments] = await Promise.all([
                fetchWithAuth(`${API_BASE_URL}/doctors/schedule`),
                fetchWithAuth(`${API_BASE_URL}/appointments/doctor`)
            ]);

            console.log('Schedules:', schedules);
            console.log('Appointments:', appointments);

            // Determine baseline hour range from schedules (fallback 7-17)
            let minMin = 24*60, maxMin = 0;
            schedules.forEach(s => {
                const start = timeStringToMinutes(s.start_time);
                const end = timeStringToMinutes(s.end_time);
                if (start < minMin) minMin = start;
                if (end > maxMin) maxMin = end;
            });
            if (minMin === 24*60) { minMin = 7*60; maxMin = 17*60; }

            // Round to whole hours for labels
            const baselineHour = Math.floor(minMin/60);
            const endHour = Math.ceil(maxMin/60);

            const today = new Date();
            // Default to current week (Monday start)
            let weekStart = startOfWeek(today);

            // If there are appointments but none fall within the current week,
            // show the week that contains the first appointment so the user sees it.
            if (appointments && appointments.length > 0) {
                const anyInCurrentWeek = appointments.some(a => {
                    const sd = new Date(a.scheduled_start);
                    const idx = Math.floor((sd - weekStart) / (24*60*60*1000));
                    return idx >= 0 && idx <= 6;
                });
                if (!anyInCurrentWeek) {
                    // Use the week of the earliest appointment
                    const firstApt = appointments.slice().sort((x,y) => new Date(x.scheduled_start) - new Date(y.scheduled_start))[0];
                    weekStart = startOfWeek(new Date(firstApt.scheduled_start));
                    console.log('No appointments in current week, switching weekStart to appointment week:', weekStart.toLocaleDateString());
                }
            }

            // Build header
            let html = '';
            html += `<div class="header-cell header-corner"></div>`;
            for (let i=0;i<7;i++){
                const day = new Date(weekStart);
                day.setDate(weekStart.getDate()+i);
                const dayName = formatDayName(day);
                const dayNum = day.getDate();
                const cls = (day.toDateString() === today.toDateString()) ? 'header-cell day-label today' : 'header-cell day-label';
                html += `<div class="${cls}"><span class="day-name">${dayName}</span><span class="day-number">${dayNum}</span></div>`;
            }

            // Build time rows and day columns
            for (let h = baselineHour; h < endHour; h++){
                html += `<div class="time-label-cell"><div class="time-slot-label">${h} AM</div></div>`;
                for (let d=0; d<7; d++){
                    html += `<div class="day-column" data-day-index="${d}"><div class="time-slot"></div></div>`;
                }
            }

            calendarGrid.innerHTML = html;

            // Place appointments
            appointments.forEach(apt => {
                const start = new Date(apt.scheduled_start);
                const end = new Date(apt.scheduled_end);
                // compute day index relative to weekStart (Monday=0)
                const dayIdx = Math.floor((start - weekStart) / (24*60*60*1000));
                if (dayIdx < 0 || dayIdx > 6) return; // outside week

                const startMinutes = start.getHours()*60 + start.getMinutes();
                const duration = Math.max(30, Math.round((end - start)/60000));

                const topPx = (startMinutes - baselineHour*60);
                const heightPx = duration;

                // create appointment element
                const aptDiv = document.createElement('div');
                aptDiv.className = 'appointment';
                if (apt.status_label && apt.status_label.toLowerCase().includes('cancel')) aptDiv.classList.add('status-cancelled');
                if (apt.status_label && apt.status_label.toLowerCase().includes('pending')) aptDiv.classList.add('status-pending');
                aptDiv.style.top = `${topPx}px`;
                aptDiv.style.height = `${heightPx}px`;
                aptDiv.innerHTML = `<span class="appointment-title">${apt.patient_name || 'Paciente'}</span><span class="appointment-time">${start.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})} - ${end.toLocaleTimeString('es-ES',{hour:'2-digit',minute:'2-digit'})}</span>`;

                // append to correct day column
                const dayColumn = calendarGrid.querySelector(`.day-column[data-day-index="${dayIdx}"]`);
                if (dayColumn) dayColumn.appendChild(aptDiv);
            });

            // Position current time line
            const now = new Date();
            const nowDayIdx = Math.floor((now - weekStart) / (24*60*60*1000));
            if (nowDayIdx >=0 && nowDayIdx <=6) {
                const nowMinutes = now.getHours()*60 + now.getMinutes();
                const top = (nowMinutes - baselineHour*60) + 95; // 95px header height
                currentTimeLine.style.top = `${top}px`;
                currentTimeLine.style.display = 'block';
            } else {
                currentTimeLine.style.display = 'none';
            }

        } catch (e) {
            console.error('Error building calendar', e);
        }
    }

    buildCalendar();

});
