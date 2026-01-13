document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración de API ---
    const API_BASE_URL =
    location.hostname === 'localhost' || location.hostname === '127.0.0.1'
    ? 'http://localhost:3000/api'
    : 'https://medical-appointment-backend-2xx0.onrender.com/api';

    // --- Variables de estado ---
    let allCitas = [];
    let allConsultasModificadas = [];
    let citasTipoChart = null;
    let actividadSemanalChart = null;

    // ----------------------------------------------------------------------------------
    // 🔐 FUNCIONES DE AUTENTICACIÓN Y FETCH 🔐
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
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || errorData.message || 'Error en la petición');
        }

        return response;
    };

    // ----------------------------------------------------------------------------------
    // 📅 FUNCIONES DE MANEJO DE FECHAS 📅
    // ----------------------------------------------------------------------------------

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
            // Start and end are the same (today)
        } else if (periodo === 'semana') {
            const dayOfWeek = today.getDay();
            startDate.setDate(today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1));
            endDate.setDate(startDate.getDate() + 6);
            startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);
        } else if (periodo === 'mes') {
            startDate.setDate(1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            endDate.setHours(23, 59, 59, 999);
        } else if (periodo === 'anio') {
            startDate = new Date(today.getFullYear(), 0, 1);
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(today.getFullYear(), 11, 31);
            endDate.setHours(23, 59, 59, 999);
        } else if (periodo === 'todos') {
            // Fecha muy antigua para obtener todos los registros
            startDate = new Date('2000-01-01');
            endDate = new Date('2099-12-31');
        }
        return { startDate, endDate };
    };

    // ----------------------------------------------------------------------------------
    // 📊 FUNCIONES DE CARGA DE DATOS DEL BACKEND 📊
    // ----------------------------------------------------------------------------------

    async function loadAppointmentsData(periodo) {
        try {
            const { startDate, endDate } = getDateRange(periodo);
            
            const response = await fetchWithAuth(
                `${API_BASE_URL}/reports/appointments?` + 
                `startDate=${formatDate(startDate)}&` +
                `endDate=${formatDate(endDate)}`
            );
            
            const data = await response.json();
            
            // Transform API data to match frontend structure
            allCitas = data.appointments.map(apt => ({
                fecha: apt.fecha || apt.scheduled_start?.split('T')[0] || '',
                hora: apt.hora || apt.scheduled_start?.split('T')[1]?.substring(0, 5) || '',
                paciente: apt.paciente || `${apt.patient_first_name || ''} ${apt.patient_last_name || ''}`.trim(),
                tipo: apt.tipo || apt.appointment_type || apt.reason || 'Consulta General',
                estado: mapStatusToSpanish(apt.estado || apt.status_code || apt.status)
            }));

            console.log('✅ Citas cargadas:', allCitas.length);
            return allCitas;
        } catch (error) {
            console.error('❌ Error al cargar citas:', error);
            showError('Error al cargar las citas: ' + error.message);
            allCitas = [];
            return [];
        }
    }

    async function loadModifiedConsultations(periodo) {
        try {
            const { startDate, endDate } = getDateRange(periodo);
            
            const response = await fetchWithAuth(
                `${API_BASE_URL}/reports/modified?` + 
                `startDate=${formatDate(startDate)}&` +
                `endDate=${formatDate(endDate)}`
            );
            
            const data = await response.json();
            
            // Transform API data
            allConsultasModificadas = data.modifiedAppointments || [];
            
            console.log('✅ Consultas modificadas cargadas:', allConsultasModificadas.length);
            return allConsultasModificadas;
        } catch (error) {
            console.error('❌ Error al cargar consultas modificadas:', error);
            showError('Error al cargar consultas modificadas: ' + error.message);
            allConsultasModificadas = [];
            return [];
        }
    }

    async function loadStatistics(periodo) {
        try {
            const { startDate, endDate } = getDateRange(periodo);
            
            const response = await fetchWithAuth(
                `${API_BASE_URL}/reports/statistics?` + 
                `startDate=${formatDate(startDate)}&` +
                `endDate=${formatDate(endDate)}`
            );
            
            const data = await response.json();
            console.log('✅ Estadísticas cargadas:', data);
            return data;
        } catch (error) {
            console.error('❌ Error al cargar estadísticas:', error);
            showError('Error al cargar estadísticas: ' + error.message);
            return null;
        }
    }

    async function fetchActivityByPeriod(periodo) {
        try {
            await loadAppointmentsData(periodo);
            
            const activityMap = {};
            const labels = [];
            
            if (periodo === 'semana' || periodo === 'dia') {
                // Para semana, usar endpoint específico de weekly-activity
                const response = await fetchWithAuth(`${API_BASE_URL}/reports/weekly-activity`);
                const data = await response.json();
                return { activityByDay: data.activityByDay, labels: data.labels };
            } else if (periodo === 'mes') {
                // Agrupar por día del mes
                const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                for (let i = 1; i <= daysInMonth; i++) {
                    labels.push(i.toString());
                    activityMap[i] = 0;
                }
                allCitas.forEach(apt => {
                    if (apt.fecha) {
                        const day = new Date(apt.fecha).getDate();
                        activityMap[day] = (activityMap[day] || 0) + 1;
                    }
                });
            } else if (periodo === 'anio') {
                // Agrupar por mes del año
                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                meses.forEach((mes, idx) => {
                    labels.push(mes);
                    activityMap[idx] = 0;
                });
                allCitas.forEach(apt => {
                    if (apt.fecha) {
                        const month = new Date(apt.fecha).getMonth();
                        activityMap[month] = (activityMap[month] || 0) + 1;
                    }
                });
            } else if (periodo === 'todos') {
                // Agrupar por año
                const years = new Set();
                allCitas.forEach(apt => {
                    if (apt.fecha) {
                        const year = new Date(apt.fecha).getFullYear();
                        years.add(year);
                    }
                });
                const sortedYears = Array.from(years).sort();
                sortedYears.forEach(year => {
                    labels.push(year.toString());
                    activityMap[year] = 0;
                });
                allCitas.forEach(apt => {
                    if (apt.fecha) {
                        const year = new Date(apt.fecha).getFullYear();
                        activityMap[year] = (activityMap[year] || 0) + 1;
                    }
                });
            }

            // Construir el array final basado en el tipo de periodo
            let activityByDay;
            if (periodo === 'anio') {
                // Para año, usar índices (0-11)
                activityByDay = labels.map((label, idx) => activityMap[idx] || 0);
            } else if (periodo === 'mes') {
                // Para mes, usar días (1-31)
                activityByDay = labels.map(label => activityMap[parseInt(label)] || 0);
            } else {
                // Para 'todos' (años), usar el año como clave
                activityByDay = labels.map(label => activityMap[parseInt(label)] || 0);
            }
            
            return { activityByDay, labels };
        } catch (error) {
            console.error('❌ Error fetching activity by period:', error);
            return { activityByDay: [], labels: [] };
        }
    }

    // Helper function to map status codes to Spanish
    function mapStatusToSpanish(statusCode) {
        const statusMap = {
            'scheduled': 'Pendiente',
            'confirmed': 'Confirmada',
            'completed': 'Completada',
            'cancelled': 'Cancelada',
            'no_show': 'No asistió'
        };
        return statusMap[statusCode] || statusCode;
    }

    function showError(message) {
        // Simple error display - you can enhance this
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger';
        errorDiv.textContent = message;
        document.body.insertBefore(errorDiv, document.body.firstChild);
        
        setTimeout(() => errorDiv.remove(), 5000);
    }

    async function fetchActivityByPeriod(periodo) {
        try {
            await loadAppointmentsData(periodo);
            
            const activityMap = {};
            const labels = [];
            
            if (periodo === 'semana' || periodo === 'dia') {
                // Para semana, usar lógica de días de la semana
                const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                daysOfWeek.forEach((day, idx) => {
                    labels.push(day);
                    activityMap[idx] = 0;
                });
                allCitas.forEach(cita => {
                    if (cita.fecha) {
                        const dayOfWeek = new Date(cita.fecha).getDay();
                        activityMap[dayOfWeek] = (activityMap[dayOfWeek] || 0) + 1;
                    }
                });
                const activityByDay = labels.map((label, idx) => activityMap[idx] || 0);
                return { activityByDay, labels };
            } else if (periodo === 'mes') {
                // Agrupar por día del mes
                const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
                for (let i = 1; i <= daysInMonth; i++) {
                    labels.push(i.toString());
                    activityMap[i] = 0;
                }
                allCitas.forEach(apt => {
                    if (apt.fecha) {
                        const day = new Date(apt.fecha).getDate();
                        activityMap[day] = (activityMap[day] || 0) + 1;
                    }
                });
                const activityByDay = labels.map(label => activityMap[parseInt(label)] || 0);
                return { activityByDay, labels };
            } else if (periodo === 'anio') {
                // Agrupar por mes del año
                const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
                meses.forEach((mes, idx) => {
                    labels.push(mes);
                    activityMap[idx] = 0;
                });
                allCitas.forEach(apt => {
                    if (apt.fecha) {
                        const month = new Date(apt.fecha).getMonth();
                        activityMap[month] = (activityMap[month] || 0) + 1;
                    }
                });
                const activityByDay = labels.map((label, idx) => activityMap[idx] || 0);
                return { activityByDay, labels };
            } else if (periodo === 'todos') {
                // Agrupar por año
                const years = new Set();
                allCitas.forEach(apt => {
                    if (apt.fecha) {
                        const year = new Date(apt.fecha).getFullYear();
                        years.add(year);
                    }
                });
                const sortedYears = Array.from(years).sort();
                sortedYears.forEach(year => {
                    labels.push(year.toString());
                    activityMap[year] = 0;
                });
                allCitas.forEach(apt => {
                    if (apt.fecha) {
                        const year = new Date(apt.fecha).getFullYear();
                        activityMap[year] = (activityMap[year] || 0) + 1;
                    }
                });
                const activityByDay = labels.map(label => activityMap[parseInt(label)] || 0);
                return { activityByDay, labels };
            }
            
            return { activityByDay: [], labels: [] };
        } catch (error) {
            console.error('❌ Error fetching activity by period:', error);
            return { activityByDay: [], labels: [] };
        }
    }

    // ----------------------------------------------------------------------------------
    // 🎨 FUNCIONES DE RENDERIZADO 🎨
    // ----------------------------------------------------------------------------------

    const renderCitas = async (periodo) => {
        await loadAppointmentsData(periodo);
        
        const tbody = document.getElementById('citas-data');
        tbody.innerHTML = '';
        
        if (allCitas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hay citas en este período</td></tr>';
            document.getElementById('total-citas').textContent = '0';
            return;
        }
        
        allCitas.forEach(cita => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${cita.fecha}</td>
                <td>${cita.hora}</td>
                <td>${cita.paciente}</td>
                <td>${cita.tipo}</td>
                <td>${cita.estado}</td>
            `;
        });
        
        document.getElementById('total-citas').textContent = allCitas.length;
    };

    const renderPacientes = async (periodo) => {
        await loadAppointmentsData(periodo);
        
        const uniquePacientes = new Set();
        allCitas.forEach(cita => uniquePacientes.add(cita.paciente));

        const ul = document.getElementById('pacientes-data');
        ul.innerHTML = '';
        
        if (uniquePacientes.size === 0) {
            ul.innerHTML = '<li>No hay pacientes en este período</li>';
            document.getElementById('total-pacientes').textContent = '0';
            return;
        }
        
        uniquePacientes.forEach(paciente => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${paciente}</span>
                <button class="historial-btn" data-paciente="${paciente}">Ver historial clínico</button>
            `;
            ul.appendChild(li);
        });
        
        document.getElementById('total-pacientes').textContent = uniquePacientes.size;
    };

    const renderConsultasModificadas = async (estado, periodo) => {
        await loadModifiedConsultations(periodo);
        
        const filteredConsultas = allConsultasModificadas.filter(consulta => {
            return (
                (estado === 'canceladas' && consulta.motivo.includes('Cancelada')) ||
                (estado === 'reprogramadas' && consulta.motivo.includes('Reprogramada')) ||
                (estado === 'todas')
            );
        });

        const tbody = document.getElementById('consultas-data');
        tbody.innerHTML = '';
        
        if (filteredConsultas.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hay consultas modificadas en este período</td></tr>';
            document.getElementById('total-consultas').textContent = '0';
            return;
        }
        
        filteredConsultas.forEach(consulta => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${consulta.fechaOriginal}</td>
                <td>${consulta.nuevaFecha || 'N/A'}</td>
                <td>${consulta.paciente}</td>
                <td>${consulta.motivo}</td>
            `;
        });
        
        document.getElementById('total-consultas').textContent = filteredConsultas.length;
    };

    const renderTiposConsulta = async (periodo) => {
        await loadAppointmentsData(periodo);
        
        const tipoCounts = {};
        allCitas.forEach(cita => {
            tipoCounts[cita.tipo] = (tipoCounts[cita.tipo] || 0) + 1;
        });

        const ul = document.getElementById('tipos-consulta-data');
        ul.innerHTML = '';
        
        if (Object.keys(tipoCounts).length === 0) {
            ul.innerHTML = '<li>No hay datos en este período</li>';
            return;
        }
        
        for (const tipo in tipoCounts) {
            const li = document.createElement('li');
            li.textContent = `${tipo}: ${tipoCounts[tipo]}`;
            ul.appendChild(li);
        }
    };

    // ----------------------------------------------------------------------------------
    // 📈 FUNCIONES DE GRÁFICAS 📈
    // ----------------------------------------------------------------------------------

    const renderCitasTipoChart = async (periodo = 'mes') => {
        const ctx = document.getElementById('citasTipoChart').getContext('2d');
        if (citasTipoChart) citasTipoChart.destroy();

        // Load data for the specified period
        await loadAppointmentsData(periodo);

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

    const renderActividadSemanalChart = async (periodo = 'semana') => {
        const ctx = document.getElementById('actividadSemanalChart').getContext('2d');
        if (actividadSemanalChart) actividadSemanalChart.destroy();

        const data = await fetchActivityByPeriod(periodo);

        // Configurar título según el periodo
        let chartTitle = 'Actividad de Citas';
        if (periodo === 'dia' || periodo === 'semana') {
            chartTitle = 'Actividad de Citas por Día de la Semana';
        } else if (periodo === 'mes') {
            chartTitle = 'Actividad de Citas por Día del Mes';
        } else if (periodo === 'anio') {
            chartTitle = 'Actividad de Citas por Mes del Año';
        } else if (periodo === 'todos') {
            chartTitle = 'Actividad de Citas por Año';
        }

        actividadSemanalChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.labels,
                datasets: [{
                    label: 'Número de Citas',
                    data: data.activityByDay,
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
                        text: chartTitle
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

    // ----------------------------------------------------------------------------------
    // 👂 EVENT LISTENERS 👂
    // ----------------------------------------------------------------------------------

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

    // Event delegation for historial buttons
    document.getElementById('pacientes-data').addEventListener('click', (e) => {
        if (e.target.classList.contains('historial-btn')) {
            const paciente = e.target.dataset.paciente;
            // Guardar el nombre del paciente para buscarlo en la página de pacientes
            localStorage.setItem('buscarPaciente', paciente);
            // Redirigir a la página de pacientes
            window.location.href = './doctorPatients.html';
        }
    });

    // Event listeners para los selectores de periodo de las gráficas
    const graficaTipoPeriodoSelect = document.getElementById('grafica-tipo-periodo');
    const graficaActividadPeriodoSelect = document.getElementById('grafica-actividad-periodo');
    
    if (graficaTipoPeriodoSelect) {
        graficaTipoPeriodoSelect.addEventListener('change', (e) => {
            renderCitasTipoChart(e.target.value);
        });
    }
    
    if (graficaActividadPeriodoSelect) {
        graficaActividadPeriodoSelect.addEventListener('change', (e) => {
            renderActividadSemanalChart(e.target.value);
        });
    }

    // ----------------------------------------------------------------------------------
    // 🚀 INICIALIZACIÓN 🚀
    // ----------------------------------------------------------------------------------

    // Initial render
    (async () => {
        try {
            await renderCitas(document.getElementById('citas-periodo').value);
            await renderPacientes(document.getElementById('pacientes-periodo').value);
            await renderConsultasModificadas(
                document.getElementById('consultas-estado').value,
                document.getElementById('consultas-periodo').value
            );
            await renderTiposConsulta(document.getElementById('tipos-consulta-periodo').value);

            // Render charts if section is active
            if (document.getElementById('graficas-section').classList.contains('active-report-content')) {
                await renderCitasTipoChart();
                await renderActividadSemanalChart();
            }
        } catch (error) {
            console.error('Error en inicialización:', error);
            showError('Error al inicializar los reportes');
        }
    })();
});