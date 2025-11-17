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

// ========== Acciones de Botones ==========
async function downloadLabResult(reportId) {
    const report = allLabResults.find(r => r.id.toString() === reportId);
    if (!report) {
        Helpers.showAlert('Reporte no encontrado', 'error');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        let y = 20;

        // Colores corporativos
        const primaryColor = [41, 128, 185];
        const secondaryColor = [52, 73, 94];
        const accentColor = [46, 204, 113];
        const warningColor = [241, 196, 15];
        const dangerColor = [231, 76, 60];

        // Función para verificar espacio
        const checkPageBreak = (space) => {
            if (y + space > pageHeight - 25) {
                pdf.addPage();
                y = 20;
                return true;
            }
            return false;
        };

        // ===== ENCABEZADO =====
        pdf.setFillColor(...primaryColor);
        pdf.rect(0, 0, pageWidth, 50, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(24);
        pdf.setFont(undefined, 'bold');
        pdf.text('CLÍNICA SAN MIGUEL', margin, 20);
        
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.text('Laboratorio Clínico', margin, 28);
        pdf.text('Tel: (02) 2XXX-XXXX | Email: laboratorio@clinicasanmiguel.ec', margin, 34);
        pdf.text(`Fecha de Emisión: ${new Date().toLocaleDateString('es-ES')}`, margin, 40);

        y = 60;

        // ===== TÍTULO =====
        pdf.setTextColor(...secondaryColor);
        pdf.setFontSize(18);
        pdf.setFont(undefined, 'bold');
        pdf.text('RESULTADO DE LABORATORIO', margin, y);
        
        y += 3;
        pdf.setDrawColor(...accentColor);
        pdf.setLineWidth(1);
        pdf.line(margin, y, pageWidth - margin, y);
        y += 10;

        // ===== INFORMACIÓN DEL EXAMEN =====
        pdf.setFillColor(245, 245, 245);
        pdf.rect(margin, y, pageWidth - 2 * margin, 30, 'F');
        
        y += 8;
        pdf.setFontSize(11);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...primaryColor);
        pdf.text('INFORMACIÓN DEL EXAMEN', margin + 5, y);
        
        y += 7;
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        pdf.setTextColor(...secondaryColor);
        pdf.text(`Examen: ${report.test_name}`, margin + 5, y);
        
        y += 6;
        pdf.text(`Fecha de Orden: ${Helpers.formatDate(report.order_date)}`, margin + 5, y);
        
        y += 6;
        pdf.text(`Ordenado por: ${report.doctor_full_name || 'Dr. Desconocido'}`, margin + 5, y);

        y += 15;

        // ===== RESULTADOS =====
        pdf.setFontSize(14);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(...primaryColor);
        pdf.text('RESULTADOS', margin, y);
        y += 8;

        if (report.lab_results && report.lab_results.length > 0) {
            // Encabezado de tabla
            pdf.setFillColor(...primaryColor);
            pdf.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
            
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(9);
            pdf.setFont(undefined, 'bold');
            
            const col1 = margin + 3;
            const col2 = margin + 50;
            const col3 = margin + 85;
            const col4 = margin + 130;
            
            pdf.text('Parámetro', col1, y + 7);
            pdf.text('Resultado', col2, y + 7);
            pdf.text('Rango Normal', col3, y + 7);
            pdf.text('Estado', col4, y + 7);
            
            y += 10;

            // Filas de resultados
            pdf.setFont(undefined, 'normal');
            pdf.setFontSize(9);

            report.lab_results.forEach((param, index) => {
                checkPageBreak(12);

                // Alternar color de fondo
                if (index % 2 === 0) {
                    pdf.setFillColor(250, 250, 250);
                    pdf.rect(margin, y, pageWidth - 2 * margin, 10, 'F');
                }

                // Determinar color según estado
                let statusColor = secondaryColor;
                if (param.status === 'Alto' || param.status === 'High') {
                    statusColor = dangerColor;
                } else if (param.status === 'Bajo' || param.status === 'Low') {
                    statusColor = warningColor;
                } else if (param.status === 'Normal') {
                    statusColor = accentColor;
                }

                pdf.setTextColor(...secondaryColor);
                pdf.text(param.parameter_name, col1, y + 7);
                
                pdf.setFont(undefined, 'bold');
                pdf.text(`${param.result_value} ${param.unit || ''}`, col2, y + 7);
                
                pdf.setFont(undefined, 'normal');
                pdf.text(param.reference_range || 'N/A', col3, y + 7);
                
                pdf.setTextColor(...statusColor);
                pdf.setFont(undefined, 'bold');
                pdf.text(param.status || 'N/A', col4, y + 7);
                
                pdf.setFont(undefined, 'normal');
                y += 10;
            });
        } else {
            pdf.setTextColor(...secondaryColor);
            pdf.setFontSize(10);
            pdf.text('No hay resultados detallados disponibles', margin + 5, y);
            y += 10;
        }

        // ===== NOTAS DEL MÉDICO =====
        if (report.doctor_notes) {
            y += 5;
            checkPageBreak(25);
            
            pdf.setDrawColor(...warningColor);
            pdf.setLineWidth(0.5);
            pdf.setFillColor(255, 250, 230);
            pdf.rect(margin, y, pageWidth - 2 * margin, 20, 'FD');
            
            y += 7;
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(...warningColor);
            pdf.text('NOTA DEL MÉDICO:', margin + 5, y);
            
            y += 6;
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(...secondaryColor);
            const notesLines = pdf.splitTextToSize(report.doctor_notes, pageWidth - 2 * margin - 10);
            notesLines.forEach(line => {
                checkPageBreak(6);
                pdf.text(line, margin + 5, y);
                y += 5;
            });
        }

        // ===== PIE DE PÁGINA =====
        pdf.setFontSize(8);
        pdf.setTextColor(150, 150, 150);
        pdf.text('Clínica San Miguel - Resultados de Laboratorio', pageWidth / 2, pageHeight - 15, { align: 'center' });
        pdf.text('Este documento es confidencial y está dirigido únicamente al paciente', pageWidth / 2, pageHeight - 10, { align: 'center' });

        // Abrir en nueva pestaña
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');

    } catch (error) {
        console.error('Error al generar PDF:', error);
        Helpers.showAlert('Error al generar el PDF', 'error');
    }
}

async function downloadAllResults() {
    if (allLabResults.length === 0) {
        Helpers.showAlert('No hay resultados para descargar', 'info');
        return;
    }

    try {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 20;
        let y = 20;

        // Colores
        const primaryColor = [41, 128, 185];
        const secondaryColor = [52, 73, 94];
        const accentColor = [46, 204, 113];

        const checkPageBreak = (space) => {
            if (y + space > pageHeight - 25) {
                addFooter();
                pdf.addPage();
                y = 20;
                return true;
            }
            return false;
        };

        const addFooter = () => {
            const pageNum = pdf.internal.getCurrentPageInfo().pageNumber;
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`Página ${pageNum}`, pageWidth / 2, pageHeight - 15, { align: 'center' });
            pdf.text('Clínica San Miguel - Laboratorio Clínico', pageWidth / 2, pageHeight - 10, { align: 'center' });
        };

        // ===== PORTADA =====
        pdf.setFillColor(...primaryColor);
        pdf.rect(0, 0, pageWidth, pageHeight, 'F');

        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(32);
        pdf.setFont(undefined, 'bold');
        pdf.text('RESULTADOS DE', pageWidth / 2, pageHeight / 2 - 20, { align: 'center' });
        pdf.text('LABORATORIO', pageWidth / 2, pageHeight / 2 - 5, { align: 'center' });

        pdf.setFontSize(14);
        pdf.setFont(undefined, 'normal');
        pdf.text('CLÍNICA SAN MIGUEL', pageWidth / 2, pageHeight / 2 + 20, { align: 'center' });
        pdf.text(`Generado: ${new Date().toLocaleDateString('es-ES')}`, pageWidth / 2, pageHeight / 2 + 35, { align: 'center' });

        // ===== PÁGINA DE RESULTADOS =====
        allLabResults.forEach((report, index) => {
            pdf.addPage();
            y = 20;

            // Encabezado de sección
            pdf.setFillColor(...primaryColor);
            pdf.rect(0, y - 5, pageWidth, 15, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(14);
            pdf.setFont(undefined, 'bold');
            pdf.text(`${index + 1}. ${report.test_name}`, margin, y + 6);
            
            y += 20;

            // Información básica
            pdf.setTextColor(...secondaryColor);
            pdf.setFontSize(10);
            pdf.setFont(undefined, 'normal');
            pdf.text(`Fecha: ${Helpers.formatDate(report.order_date)}`, margin, y);
            y += 6;
            pdf.text(`Doctor: ${report.doctor_full_name || 'N/A'}`, margin, y);
            y += 10;

            // Resultados
            if (report.lab_results && report.lab_results.length > 0) {
                report.lab_results.forEach(param => {
                    checkPageBreak(10);
                    
                    pdf.setFont(undefined, 'bold');
                    pdf.text(`${param.parameter_name}:`, margin + 5, y);
                    pdf.setFont(undefined, 'normal');
                    pdf.text(`${param.result_value} ${param.unit || ''} (${param.reference_range})`, margin + 60, y);
                    
                    // Estado
                    if (param.status === 'Alto' || param.status === 'High') {
                        pdf.setTextColor(231, 76, 60);
                    } else if (param.status === 'Normal') {
                        pdf.setTextColor(46, 204, 113);
                    }
                    pdf.text(param.status || 'N/A', margin + 130, y);
                    pdf.setTextColor(...secondaryColor);
                    
                    y += 7;
                });
            }

            if (report.doctor_notes) {
                y += 5;
                checkPageBreak(15);
                pdf.setFont(undefined, 'bold');
                pdf.text('Notas:', margin, y);
                y += 6;
                pdf.setFont(undefined, 'normal');
                const notes = pdf.splitTextToSize(report.doctor_notes, pageWidth - 2 * margin - 5);
                notes.forEach(line => {
                    checkPageBreak(6);
                    pdf.text(line, margin + 5, y);
                    y += 5;
                });
            }

            addFooter();
        });

        // Descargar
        const fileName = `Resultados_Laboratorio_Completos_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

    } catch (error) {
        console.error('Error al generar PDF:', error);
        Helpers.showAlert('Error al generar el PDF completo', 'error');
    }
}

function shareLabResult(reportId) {
    Helpers.showAlert('Función de compartir próximamente', 'info');
    console.log('Compartir resultado:', reportId);
}

// ========== Exportar funciones globales ==========
window.downloadLabResult = downloadLabResult;
window.shareLabResult = shareLabResult;
window.downloadAllResults = downloadAllResults;