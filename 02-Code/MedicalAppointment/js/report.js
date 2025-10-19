document.addEventListener('DOMContentLoaded', () => {
    const formatDate = (date) => {
        const d = new Date(date);
        let month = '' + (d.getMonth() + 1);
        let day = '' + d.getDate();
        let year = d.getFullYear();

        if (month.length < 2) month = '0' + month;
        if (day.length < 2) day = '0' + day;

        return [year, month, day].join('-');
    };

    const getDateRange = (periodo) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let startDate = new Date(today);
        let endDate = new Date(today);

        if (periodo === 'dia') {
        } else if (periodo === 'semana') {
            const dayOfWeek = today.getDay();
            startDate.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
            endDate.setDate(startDate.getDate() + 6);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        } else if (periodo === 'mes') {
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
        }
        return { startDate, endDate };
    };

    const generateDynamicData = () => {
        const today = new Date();
        const currentWeekStart = new Date(today);
        currentWeekStart.setDate(today.getDate() - (today.getDay() + 6) % 7);
        currentWeekStart.setHours(0, 0, 0, 0);

        const getPastDate = (daysAgo) => {
            const d = new Date(today);
            d.setDate(today.getDate() - daysAgo);
            return d;
        };

        const allCitas = [
            { fecha: formatDate(today), hora: '10:00', paciente: 'Ana García', tipo: 'Consulta General', estado: 'Confirmada' },
            { fecha: formatDate(today), hora: '11:00', paciente: 'Juan Pérez', tipo: 'Revisión', estado: 'Confirmada' },

            { fecha: formatDate(getPastDate(1)), hora: '09:30', paciente: 'María López', tipo: 'Seguimiento', estado: 'Confirmada' },
            { fecha: formatDate(getPastDate(2)), hora: '14:00', paciente: 'Carlos Ruiz', tipo: 'Consulta General', estado: 'Pendiente' },
            { fecha: formatDate(getPastDate(3)), hora: '16:00', paciente: 'Sofía Martínez', tipo: 'Urgencia', estado: 'Confirmada' },
            { fecha: formatDate(getPastDate(8)), hora: '17:00', paciente: 'Pedro Sánchez', tipo: 'Consulta General', estado: 'Confirmada' },
            { fecha: formatDate(getPastDate(10)), hora: '10:30', paciente: 'Laura Gómez', tipo: 'Vacunación', estado: 'Confirmada' },
            { fecha: formatDate(getPastDate(15)), hora: '12:00', paciente: 'Diego Fernández', tipo: 'Revisión', estado: 'Confirmada' },
            { fecha: formatDate(getPastDate(20)), hora: '09:00', paciente: 'Elena Díaz', tipo: 'Consulta General', estado: 'Confirmada' },
            { fecha: formatDate(getPastDate(25)), hora: '13:00', paciente: 'Jorge Herrera', tipo: 'Seguimiento', estado: 'Cancelada' },
        ];

        const allConsultasModificadas = [
            { fechaOriginal: formatDate(getPastDate(5)), nuevaFecha: formatDate(today), paciente: 'Jorge Herrera', motivo: 'Cancelada por paciente' },
            { fechaOriginal: formatDate(getPastDate(10)), nuevaFecha: formatDate(getPastDate(2)), paciente: 'Lucía Morales', motivo: 'Reprogramada por médico' },
            { fechaOriginal: formatDate(getPastDate(12)), nuevaFecha: 'N/A', paciente: 'Roberto Vega', motivo: 'Cancelada por médico' },
        ];

        return { allCitas, allConsultasModificadas };
    };

    const { allCitas, allConsultasModificadas } = generateDynamicData();

    // Renderizar datos de citas
    const renderCitas = (periodo) => {
        const { startDate, endDate } = getDateRange(periodo);
        const filteredCitas = allCitas.filter(cita => {
            const citaDate = new Date(cita.fecha);
            citaDate.setHours(0, 0, 0, 0);
            return citaDate >= startDate && citaDate <= endDate;
        });

        const tbody = document.getElementById('citas-data');
        tbody.innerHTML = '';
        filteredCitas.forEach(cita => {
            const row = tbody.insertRow();
            row.innerHTML = `
                        <td>${cita.fecha}</td>
                        <td>${cita.hora}</td>
                        <td>${cita.paciente}</td>
                        <td>${cita.tipo}</td>
                        <td>${cita.estado}</td>
                    `;
        });
        document.getElementById('total-citas').textContent = filteredCitas.length;
    };

    // Renderizar datos de pacientes (se mantiene igual, ya que usa `allCitas`)
    const renderPacientes = (periodo) => {
        const { startDate, endDate } = getDateRange(periodo);
        const uniquePacientes = new Set();
        allCitas.filter(cita => {
            const citaDate = new Date(cita.fecha);
            citaDate.setHours(0, 0, 0, 0);
            return citaDate >= startDate && citaDate <= endDate;
        }).forEach(cita => uniquePacientes.add(cita.paciente));

        const ul = document.getElementById('pacientes-data');
        ul.innerHTML = '';
        uniquePacientes.forEach(paciente => {
            const li = document.createElement('li');
            li.textContent = paciente;
            ul.appendChild(li);
        });
        document.getElementById('total-pacientes').textContent = uniquePacientes.size;
    };

    // Renderizar datos de consultas modificadas
    const renderConsultasModificadas = (estado, periodo) => {
        const { startDate, endDate } = getDateRange(periodo);
        const filteredConsultas = allConsultasModificadas.filter(consulta => {
            const originalDate = new Date(consulta.fechaOriginal);
            originalDate.setHours(0, 0, 0, 0);
            const isWithinPeriod = originalDate >= startDate && originalDate <= endDate;
            return isWithinPeriod && (
                (estado === 'canceladas' && consulta.motivo.includes('Cancelada')) ||
                (estado === 'reprogramadas' && consulta.motivo.includes('Reprogramada'))
            );
        });

        const tbody = document.getElementById('consultas-data');
        tbody.innerHTML = '';
        filteredConsultas.forEach(consulta => {
            const row = tbody.insertRow();
            row.innerHTML = `
                        <td>${consulta.fechaOriginal}</td>
                        <td>${consulta.nuevaFecha}</td>
                        <td>${consulta.paciente}</td>
                        <td>${consulta.motivo}</td>
                    `;
        });
        document.getElementById('total-consultas').textContent = filteredConsultas.length;
    };

    // Renderizar tipos de consulta
    const renderTiposConsulta = (periodo) => {
        const { startDate, endDate } = getDateRange(periodo);
        const tipoCounts = {};
        allCitas.filter(cita => {
            const citaDate = new Date(cita.fecha);
            citaDate.setHours(0, 0, 0, 0);
            return citaDate >= startDate && citaDate <= endDate;
        }).forEach(cita => {
            tipoCounts[cita.tipo] = (tipoCounts[cita.tipo] || 0) + 1;
        });

        const ul = document.getElementById('tipos-consulta-data');
        ul.innerHTML = '';
        for (const tipo in tipoCounts) {
            const li = document.createElement('li');
            li.textContent = `${tipo}: ${tipoCounts[tipo]}`;
            ul.appendChild(li);
        }
    };

    // Gráficas
    let citasTipoChart, actividadSemanalChart;

    const renderCitasTipoChart = () => {
        const ctx = document.getElementById('citasTipoChart').getContext('2d');
        if (citasTipoChart) citasTipoChart.destroy(); // Destruir instancia anterior si existe

        const tipoCounts = {};
        allCitas.forEach(cita => {
            tipoCounts[cita.tipo] = (tipoCounts[cita.tipo] || 0) + 1;
        });

        citasTipoChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(tipoCounts),
                datasets: [{
                    data: Object.values(tipoCounts),
                    backgroundColor: ['#007bff', '#28a745', '#ffc107', '#dc3545', '#6c757d', '#17a2b8'],
                    hoverOffset: 4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    title: {
                        display: true,
                        text: 'Distribución de Citas por Tipo'
                    }
                }
            }
        });
    };

    const renderActividadSemanalChart = () => {
        const ctx = document.getElementById('actividadSemanalChart').getContext('2d');
        if (actividadSemanalChart) actividadSemanalChart.destroy();

        const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const activityByDay = new Array(7).fill(0);

        const today = new Date();
        const currentWeekStart = new Date(today);
        currentWeekStart.setDate(today.getDate() - (today.getDay() + 6) % 7);
        currentWeekStart.setHours(0, 0, 0, 0);

        const currentWeekEnd = new Date(currentWeekStart);
        currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
        currentWeekEnd.setHours(23, 59, 59, 999);


        allCitas.forEach(cita => {
            const citaDate = new Date(cita.fecha);
            citaDate.setHours(0, 0, 0, 0);
            if (citaDate >= currentWeekStart && citaDate <= currentWeekEnd) {
                activityByDay[citaDate.getDay()]++;
            }
        });

        actividadSemanalChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: daysOfWeek,
                datasets: [{
                    label: 'Número de Citas',
                    data: activityByDay,
                    backgroundColor: '#007bff',
                    borderColor: '#007bff',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false,
                    },
                    title: {
                        display: true,
                        text: 'Actividad de Citas por Día de la Semana'
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Cantidad de Citas'
                        }
                    }
                }
            }
        });
    };

    const reportNavLinks = document.querySelectorAll('.reports-nav a');
    const reportSections = document.querySelectorAll('.report-section');

    reportNavLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            reportNavLinks.forEach(nav => nav.classList.remove('active-report-link'));
            reportSections.forEach(section => section.classList.remove('active-report-content'));

            e.target.classList.add('active-report-link');

            const targetId = e.target.dataset.target;
            document.getElementById(targetId).classList.add('active-report-content');

            if (targetId === 'graficas-section') {
                renderCitasTipoChart();
                renderActividadSemanalChart();
            }
        });
    });
    document.getElementById('citas-periodo').addEventListener('change', (e) => renderCitas(e.target.value));
    document.getElementById('pacientes-periodo').addEventListener('change', (e) => renderPacientes(e.target.value));
    document.getElementById('consultas-estado').addEventListener('change', () => {
        const estado = document.getElementById('consultas-estado').value;
        const periodo = document.getElementById('consultas-periodo').value;
        renderConsultasModificadas(estado, periodo);
    });
    document.getElementById('consultas-periodo').addEventListener('change', () => {
        const estado = document.getElementById('consultas-estado').value;
        const periodo = document.getElementById('consultas-periodo').value;
        renderConsultasModificadas(estado, periodo);
    });
    document.getElementById('tipos-consulta-periodo').addEventListener('change', (e) => renderTiposConsulta(e.target.value));


    renderCitas(document.getElementById('citas-periodo').value);
    renderPacientes(document.getElementById('pacientes-periodo').value);
    renderConsultasModificadas(
        document.getElementById('consultas-estado').value,
        document.getElementById('consultas-periodo').value
    );
    renderTiposConsulta(document.getElementById('tipos-consulta-periodo').value);

    if (document.getElementById('graficas-section').classList.contains('active-report-content')) {
        renderCitasTipoChart();
        renderActividadSemanalChart();
    }
});