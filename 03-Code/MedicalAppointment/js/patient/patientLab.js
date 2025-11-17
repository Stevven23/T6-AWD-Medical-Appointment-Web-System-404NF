// ========== Inicialización ==========
document.addEventListener('DOMContentLoaded', () => {
    Helpers.checkAuth();
    loadLabResults();
});

// ========== Variables Globales ==========
let allLabResults = []; // Almacenará los informes completos

// ========== Cargar Resultados de Laboratorio ==========
async function loadLabResults() {
    try {
        Helpers.showLoading();
        
        // 1. Llamar a la NUEVA función de la API
        allLabResults = await MedicalRecordAPI.getLabReports();
        
        // 2. Mostrar los resultados
        displayLabResults();

    } catch (error) {
        console.error('Error al cargar resultados de laboratorio:', error);
        Helpers.showAlert('Error al cargar los resultados de laboratorio', 'error');
        displayEmptyState();
    } finally {
        Helpers.hideLoading();
    }
}

// ========== Mostrar Resultados ==========
function displayLabResults() {
    const container = document.querySelector('.lab-results-list');
    if (!container) return;
    
    if (allLabResults.length === 0) {
        displayEmptyState();
        return;
    }
    
    // Crear una tarjeta por cada INFORME
    container.innerHTML = allLabResults.map(report => createLabResultCard(report)).join('');
    
    // NOTA: Los listeners de botones ya están en el HTML (onclick)
}

// ========== Crear Tarjeta de Resultado ==========
function createLabResultCard(report) {
    // 'report' es el objeto de lab_reports, que ya contiene 'lab_results' anidado

    // Mapear el estado del reporte a un badge (como en tu imagen)
    const statusMap = {
        'completed': { badge: 'success', label: 'Normal', icon: 'check-circle' },
        'needs_review': { badge: 'warning', label: 'Revisar', icon: 'exclamation-triangle' },
        'pending': { badge: 'info', label: 'Pendiente', icon: 'clock' }
    };
    const status = statusMap[report.status] || statusMap['pending'];

    // Generar las filas de la tabla a partir de report.lab_results
    const parameterRows = report.lab_results.map(param => {
        // Mapear el estado del parámetro (Alto, Normal, Bajo) a una clase CSS
        const statusClass = (param.status || 'normal').toLowerCase();
        
        return `
            <tr>
                <td>${param.parameter_name}</td>
                <td><strong>${param.result_value} ${param.unit || ''}</strong></td>
                <td>${param.reference_range}</td>
                <td><span class="status-${statusClass}">${param.status}</span></td>
            </tr>
        `;
    }).join('');

    return `
        <div class="lab-result-card">
            <div class="lab-result-header">
                <div class="lab-icon">
                    <i class="fas fa-vial"></i> </div>
                <div class="lab-info">
                    <h3>${report.test_name}</h3>
                    <p class="lab-date"><i class="fas fa-calendar"></i> ${Helpers.formatDate(report.order_date)}</p>
                    <p class="lab-doctor">Ordenado por: ${report.doctor_full_name || 'Dr. Desconocido'}</p>
                </div>
                <span class="badge-${status.badge}">
                    <i class="fas fa-${status.icon}"></i> ${status.label}
                </span>
            </div>
            
            <div class="lab-result-body">
                ${parameterRows.length > 0 ? `
                    <table class="results-table">
                        <thead>
                            <tr>
                                <th>Parámetro</th>
                                <th>Resultado</th>
                                <th>Rango Normal</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${parameterRows}
                        </tbody>
                    </table>
                ` : '<p>Resultados detallados no disponibles.</p>'}
                
                ${report.doctor_notes ? `
                    <div class="lab-notes alert-warning">
                        <i class="fas fa-info-circle"></i>
                        <strong>Nota del médico:</strong> ${report.doctor_notes}
                    </div>
                ` : ''}
            </div>
            
            <div class="lab-result-footer">
                <button class="btn-secondary" onclick="downloadLabResult('${report.id}')">
                    <i class="fas fa-download"></i> Descargar PDF
                </button>
                <button class="btn-info" onclick="shareLabResult('${report.id}')">
                    <i class="fas fa-share"></i> Compartir
                </button>
            </div>
        </div>
    `;
}

// ========== Estado Vacío ==========
function displayEmptyState() {
    const container = document.querySelector('.lab-results-list');
    if (!container) return;
    
    container.innerHTML = `
        <div class="empty-state-container" style="text-align: center; padding: 3rem; color: var(--text-light);"> 
            <i class="fas fa-flask" style="font-size: 3rem; margin-bottom: 1rem;"></i>
            <p>No hay resultados de laboratorio disponibles</p>
        </div>
    `;
}

// ========== Acciones de Botones (No necesitan cambios) ==========
function downloadLabResult(reportId) {
    Helpers.showAlert('Descargando resultado...', 'info');
    console.log('Descargar resultado:', reportId);
}

function shareLabResult(reportId) {
    Helpers.showAlert('Función de compartir próximamente', 'info');
    console.log('Compartir resultado:', reportId);
}

function downloadAllResults() {
    Helpers.showAlert('Descargando todos los resultados...', 'info');
    console.log('Descargar todos los resultados');
}

// ========== Exportar funciones globales ==========
window.downloadLabResult = downloadLabResult;
window.shareLabResult = shareLabResult;
window.downloadAllResults = downloadAllResults;