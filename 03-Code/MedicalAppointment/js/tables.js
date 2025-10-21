document.getElementById('applyFilters').addEventListener('click', function() {
    const specialty = document.getElementById('specialtyFilter').value;
    const status = document.getElementById('statusFilter').value;
    const contract = document.getElementById('contractFilter').value;
    const search = document.getElementById('searchDoctor').value;
    
    console.log('Filtros aplicados:', { specialty, status, contract, search });
    // todo filter logic
    alert('Filtros aplicados');
});

document.getElementById('clearFilters').addEventListener('click', function() {
    document.getElementById('specialtyFilter').value = '';
    document.getElementById('statusFilter').value = '';
    document.getElementById('contractFilter').value = '';
    document.getElementById('searchDoctor').value = '';
    
    console.log('Filtros limpiados');
    alert('Filtros limpiados - Recargando todos los doctores');
});

function openAddDoctorModal() {
    console.log('Abrir modal para agregar doctor');
    alert('Aquí se abrirá un modal para agregar un nuevo doctor');
    // todo modal logic
}

function viewDoctor(id) {
    console.log('Ver detalles del doctor:', id);
    alert(`Ver detalles del doctor ID: ${id}`);
    // details logic
}

function editDoctor(id) {
    console.log('Editar doctor:', id);
    alert(`Editar doctor ID: ${id}`);
    // todo edition logic
}

function deleteDoctor(id) {
    if (confirm('¿Está seguro de que desea eliminar este doctor?')) {
        console.log('Eliminar doctor:', id);
        alert(`Doctor ID: ${id} eliminado`);
        // TODO delete doctor from database
    }
}

document.getElementById('searchDoctor').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    console.log('Buscando:', searchTerm);
    // todo search on real time
});

document.getElementById('applyFilters').addEventListener('click', function() {
    const status = document.getElementById('statusFilter').value;
    const department = document.getElementById('departmentFilter').value;
    const doctorCount = document.getElementById('doctorCountFilter').value;
    const search = document.getElementById('searchSpecialty').value;
    
    console.log('Filtros aplicados:', { status, department, doctorCount, search });
    alert('Filtros aplicados');
});

document.getElementById('clearFilters').addEventListener('click', function() {
    document.getElementById('statusFilter').value = '';
    document.getElementById('departmentFilter').value = '';
    document.getElementById('doctorCountFilter').value = '';
    document.getElementById('searchSpecialty').value = '';
    
    console.log('Filtros limpiados');
    alert('Filtros limpiados - Recargando todas las especialidades');
});

function openAddSpecialtyModal() {
    console.log('Abrir modal para agregar especialidad');
    alert('Aquí se abrirá un modal para agregar una nueva especialidad');
}

function viewSpecialty(id) {
    console.log('Ver detalles de la especialidad:', id);
    alert(`Ver detalles de la especialidad ID: ${id}`);
}

function editSpecialty(id) {
    console.log('Editar especialidad:', id);
    alert(`Editar especialidad ID: ${id}`);
}

function deleteSpecialty(id) {
    if (confirm('¿Está seguro de que desea eliminar esta especialidad?')) {
        console.log('Eliminar especialidad:', id);
        alert(`Especialidad ID: ${id} eliminada`);
    }
}

document.getElementById('searchSpecialty').addEventListener('input', function(e) {
    const searchTerm = e.target.value.toLowerCase();
    console.log('Buscando:', searchTerm);
});