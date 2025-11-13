// Función auxiliar para agregar eventos de forma segura
function safeAddEventListener(elementId, event, callback) {
    const element = document.getElementById(elementId);
    if (element) {
        element.addEventListener(event, callback);
    } else {
        console.warn(`Elemento con ID "${elementId}" no encontrado`);
    }
}

// Solo ejecutar cuando el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    
    // ========== FILTROS PARA DOCTORES ==========
    safeAddEventListener('applyFilters', 'click', function() {
        const specialty = document.getElementById('specialtyFilter')?.value || '';
        const status = document.getElementById('statusFilter')?.value || '';
        const contract = document.getElementById('contractFilter')?.value || '';
        const search = document.getElementById('searchDoctor')?.value || '';
        
        console.log('Filtros de doctores aplicados:', { specialty, status, contract, search });
    });

    safeAddEventListener('clearFilters', 'click', function() {
        const fields = ['specialtyFilter', 'statusFilter', 'contractFilter', 'searchDoctor'];
        fields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) element.value = '';
        });
        console.log('Filtros de doctores limpiados');
    });

    safeAddEventListener('searchDoctor', 'input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        console.log('Buscando doctores:', searchTerm);
    });

    // ========== FILTROS PARA ESPECIALIDADES ==========
    safeAddEventListener('statusFilter', 'change', function() {
        const status = document.getElementById('statusFilter')?.value || '';
        const department = document.getElementById('departmentFilter')?.value || '';
        const doctorCount = document.getElementById('doctorCountFilter')?.value || '';
        const search = document.getElementById('searchSpecialty')?.value || '';
        
        console.log('Filtros de especialidades aplicados:', { status, department, doctorCount, search });
    });

    safeAddEventListener('searchSpecialty', 'input', function(e) {
        const searchTerm = e.target.value.toLowerCase();
        console.log('Buscando especialidades:', searchTerm);
    });

});

// ========== FUNCIONES GLOBALES ==========
window.openAddSpecialtyModal = function() {
    console.log('Abrir modal para agregar especialidad');
};

window.viewSpecialty = function(id) {
    console.log('Ver detalles de la especialidad:', id);
};

window.editSpecialty = function(id) {
    console.log('Editar especialidad:', id);
};

window.deleteSpecialty = function(id) {
    if (confirm('¿Está seguro de que desea eliminar esta especialidad?')) {
        console.log('Eliminar especialidad:', id);
    }
};