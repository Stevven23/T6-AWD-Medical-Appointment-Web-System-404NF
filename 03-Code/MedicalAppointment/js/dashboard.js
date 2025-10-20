// Datos de prueba
const testData = {
    specialties: [
        { name: 'Cardiología', doctors: 8, avgTime: 35 },
        { name: 'Pediatría', doctors: 12, avgTime: 25 },
        { name: 'Ginecología', doctors: 6, avgTime: 30 },
        { name: 'Traumatología', doctors: 10, avgTime: 40 },
        { name: 'Dermatología', doctors: 5, avgTime: 20 },
        { name: 'Oftalmología', doctors: 7, avgTime: 28 },
        { name: 'Neurología', doctors: 4, avgTime: 45 },
        { name: 'Psiquiatría', doctors: 6, avgTime: 50 }
    ],
    appointmentsPerDay: [
        { day: 'Lunes', count: 145 },
        { day: 'Martes', count: 132 },
        { day: 'Miércoles', count: 158 },
        { day: 'Jueves', count: 142 },
        { day: 'Viernes', count: 168 },
        { day: 'Sábado', count: 95 },
        { day: 'Domingo', count: 45 }
    ]
};

let currentFilter = 'all';
let charts = {};

const colors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#fee140', '#30cfd0'
];

function initDashboard() {
    populateSpecialtyFilter();
    updateStats();
    createCharts();
    renderSpecialtyList();
}

function populateSpecialtyFilter() {
    const select = document.getElementById('specialtyFilter');
    testData.specialties.forEach(specialty => {
        const option = document.createElement('option');
        option.value = specialty.name;
        option.textContent = specialty.name;
        select.appendChild(option);
    });
}

function updateStats() {
    const filteredData = getFilteredData();
    
    const totalDoctors = filteredData.reduce((sum, s) => sum + s.doctors, 0);
    const totalAppointments = testData.appointmentsPerDay.reduce((sum, d) => sum + d.count, 0);
    const avgTimeWeighted = filteredData.reduce((sum, s) => sum + (s.avgTime * s.doctors), 0) / totalDoctors;
    
    document.getElementById('activeDoctors').textContent = totalDoctors;
    document.getElementById('totalSpecialties').textContent = filteredData.length;
    document.getElementById('todayAppointments').textContent = Math.floor(totalAppointments / 7);
    document.getElementById('avgTime').textContent = Math.round(avgTimeWeighted);
}

function getFilteredData() {
    if (currentFilter === 'all') {
        return testData.specialties;
    }
    return testData.specialties.filter(s => s.name === currentFilter);
}

function createCharts() {
    createDoctorsBarChart();
    createSpecialtyPieChart();
    createAppointmentsLineChart();
    createTimeChart();
}

function createDoctorsBarChart() {
    const ctx = document.getElementById('doctorsChart').getContext('2d');
    const filteredData = getFilteredData();
    
    if (charts.doctors) charts.doctors.destroy();
    
    charts.doctors = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: filteredData.map(s => s.name),
            datasets: [{
                label: 'Número de Doctores',
                data: filteredData.map(s => s.doctors),
                backgroundColor: colors,
                borderColor: colors.map(c => c),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 2
                    }
                }
            }
        }
    });
}

function createSpecialtyPieChart() {
    const ctx = document.getElementById('pieChart').getContext('2d');
    const filteredData = getFilteredData();
    
    if (charts.pie) charts.pie.destroy();
    
    charts.pie = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: filteredData.map(s => s.name),
            datasets: [{
                data: filteredData.map(s => s.doctors),
                backgroundColor: colors,
                borderColor: '#fff',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 10,
                        font: {
                            size: 11
                        }
                    }
                }
            }
        }
    });
}

function createAppointmentsLineChart() {
    const ctx = document.getElementById('appointmentsChart').getContext('2d');
    
    if (charts.appointments) charts.appointments.destroy();
    
    charts.appointments = new Chart(ctx, {
        type: 'line',
        data: {
            labels: testData.appointmentsPerDay.map(d => d.day),
            datasets: [{
                label: 'Citas',
                data: testData.appointmentsPerDay.map(d => d.count),
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointRadius: 5,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#fff',
                pointBorderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 25
                    }
                }
            }
        }
    });
}

function createTimeChart() {
    const ctx = document.getElementById('timeChart').getContext('2d');
    const filteredData = getFilteredData();
    
    if (charts.time) charts.time.destroy();
    
    charts.time = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: filteredData.map(s => s.name),
            datasets: [{
                label: 'Minutos',
                data: filteredData.map(s => s.avgTime),
                backgroundColor: '#764ba2',
                borderColor: '#764ba2',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 10
                    }
                }
            }
        }
    });
}

function renderSpecialtyList() {
    const container = document.getElementById('specialtyListContainer');
    const filteredData = getFilteredData();
    
    container.innerHTML = '';
    
    filteredData.forEach(specialty => {
        const item = document.createElement('div');
        item.className = 'specialty-item';
        item.innerHTML = `
            <span class="specialty-name">${specialty.name}</span>
            <span class="specialty-count">${specialty.doctors} doctores</span>
        `;
        container.appendChild(item);
    });
}

function applyFilter() {
    const select = document.getElementById('specialtyFilter');
    currentFilter = select.value;
    updateStats();
    createCharts();
    renderSpecialtyList();
}

function resetFilter() {
    currentFilter = 'all';
    document.getElementById('specialtyFilter').value = 'all';
    updateStats();
    createCharts();
    renderSpecialtyList();
}

document.addEventListener('DOMContentLoaded', initDashboard);