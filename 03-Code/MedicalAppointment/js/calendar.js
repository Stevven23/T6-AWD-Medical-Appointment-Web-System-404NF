
document.getElementById('prevMonth').addEventListener('click', function() {
    alert('Navegar al mes anterior');
});

document.getElementById('nextMonth').addEventListener('click', function() {
    alert('Navegar al mes siguiente');
});


document.querySelectorAll('.calendar-day').forEach(day => {
    day.addEventListener('click', function() {
        if (!this.classList.contains('other-month')) {
            const dayNumber = this.querySelector('.day-number').textContent;
            alert(`Ver detalles del día ${dayNumber}`);
        }
    });
});

document.getElementById('applyFilters').addEventListener('click', function() {
    const doctor = document.getElementById('doctorFilter').value;
    const specialty = document.getElementById('specialtyFilter').value;
    const status = document.getElementById('statusFilter').value;
    const patient = document.getElementById('patientSearch').value;
    
    console.log('Filtros aplicados:', { doctor, specialty, status, patient });
    // TODO filter logic
    alert('Filtros aplicados');
});

document.getElementById('clearFilters').addEventListener('click', function() {
    document.getElementById('doctorFilter').value = '';
    document.getElementById('specialtyFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('patientSearch').value = '';
    
    console.log('Filtros limpiados');
    // TODO filter reset logic
    alert('Filtros limpiados');
});

document.getElementById('prevMonth').addEventListener('click', function() {
    console.log('Navegar al mes anterior');
    //TODO logic with database
});

document.getElementById('nextMonth').addEventListener('click', function() {
    console.log('Navegar al mes siguiente');
    // TODO logic with database
});

document.querySelectorAll('.calendar-day').forEach(day => {
    day.addEventListener('click', function() {
        if (!this.classList.contains('other-month')) {
            document.querySelectorAll('.calendar-day').forEach(d => {
                d.style.backgroundColor = '';
            });
            
            if (!this.classList.contains('today')) {
                this.style.backgroundColor = '#d4f4dd';
            }
            
            const dayNumber = this.querySelector('.day-number').textContent;
            console.log(`Día seleccionado: ${dayNumber}`);
        }
    });
});