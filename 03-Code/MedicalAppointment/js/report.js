document.addEventListener('DOMContentLoaded', () => {
    // --- Configuración de API ---
    const API_BASE_URL = window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : 'https://t6-awd-medical-appointment-web-system.onrender.com/api';

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
                fecha: apt.scheduled_start?.split('T')[0] || '',
                hora: apt.scheduled_start?.split('T')[1]?.substring(0, 5) || '',
                paciente: `${apt.patient_first_name || ''} ${apt.patient_last_name || ''}`.trim(),
                tipo: apt.appointment_type || 'Consulta General',
                estado: mapStatusToSpanish(apt.status_code)
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
                `${API_BASE_URL}/reports/modified-appointments?` + 
                `startDate=${formatDate(startDate)}&` +
                `endDate=${formatDate(endDate)}`
            );
            
            const data = await response.json();
            
            // Transform API data
            allConsultasModificadas = data.modifications.map(mod => ({
                fechaOriginal: mod.original_date?.split('T')[0] || '',
                nuevaFecha: mod.new_date?.split('T')[0] || mod.cancelled_at?.split('T')[0] || '',
                paciente: `${mod.patient_first_name || ''} ${mod.patient_last_name || ''}`.trim(),
                motivo: mod.modification_reason || 'No especificado'
            }));

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

    const renderCitasTipoChart = async () => {
        const ctx = document.getElementById('citasTipoChart').getContext('2d');
        if (citasTipoChart) citasTipoChart.destroy();

        // Use current data or load for current month
        if (allCitas.length === 0) {
            await loadAppointmentsData('mes');
        }

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

    const renderActividadSemanalChart = async () => {
        const ctx = document.getElementById('actividadSemanalChart').getContext('2d');
        if (actividadSemanalChart) actividadSemanalChart.destroy();

        // Load data for current week
        await loadAppointmentsData('semana');

        const daysOfWeek = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const activityByDay = new Array(7).fill(0);

        allCitas.forEach(cita => {
            const citaDate = new Date(cita.fecha);
            activityByDay[citaDate.getDay()]++;
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
            // TODO: Implement patient history view
            console.log('Ver historial de:', paciente);
            alert(`Funcionalidad de historial clínico para ${paciente} - Por implementar`);
        }
    });

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