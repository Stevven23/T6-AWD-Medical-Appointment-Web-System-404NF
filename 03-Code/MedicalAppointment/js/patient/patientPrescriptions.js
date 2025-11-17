// ========== Inicialización ==========
document.addEventListener('DOMContentLoaded', () => {
    Helpers.checkAuth();
    loadPrescriptions();
    setupEventListeners();
});

// ========== Variables Globales ==========
let allPrescriptions = [];
let currentFilter = 'active'; // 'active' o 'history'

// ========== Configuración de Event Listeners ==========
function setupEventListeners() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach((btn, index) => {
        btn.addEventListener('click', () => {
            // Remover clase active de todos
            tabButtons.forEach(b => b.classList.remove('active'));
            // Agregar clase active al botón clickeado
            btn.classList.add('active');
            
            // Cambiar filtro
            currentFilter = index === 0 ? 'active' : 'history';
            displayPrescriptions();
        });
    });
}

// ========== Cargar Recetas desde API ==========
async function loadPrescriptions() {
    try {
        Helpers.showLoading();
        
        // Obtener notas de consulta que contienen las prescripciones
        const consultationNotes = await MedicalRecordAPI.getConsultationNotes();
        
        // Extraer y procesar las prescripciones
        allPrescriptions = [];
        
        consultationNotes.forEach(note => {
            if (note.prescriptions_given) {
                const prescriptions = parsePrescriptions(note);
                allPrescriptions.push(...prescriptions);
            }
        });
        
        displayPrescriptions();
    } catch (error) {
        console.error('Error al cargar recetas:', error);
        Helpers.showAlert('Error al cargar las recetas', 'error');
    } finally {
        Helpers.hideLoading();
    }
}

// ========== Parsear Prescripciones (CORREGIDO) ==========
function parsePrescriptions(note) {
    const prescriptions = [];
    const prescriptionText = note.prescriptions_given;
    
    // Dividir por líneas o separador
    const lines = prescriptionText.split(/\n|;/).filter(line => line.trim());
    
    lines.forEach(line => {
        // Extraer duración
        const durationInDays = extractDuration(line);
        // Extraer fecha de inicio
        const startDate = note.scheduled_start; 

        // Extraer información de la prescripción
        const prescription = {
            id: note.appointment_id,
            medication: extractMedication(line),
            dosage: extractDosage(line),
            instructions: extractInstructions(line),
            doctor: `${note.doctor_first_name || ''} ${note.doctor_last_name || ''}`.trim(),
            date: startDate, // <--- ✅ CORREGIDO
            duration: durationInDays,
            expiryDate: calculateExpiryDate(startDate, durationInDays), // <--- ✅ CORREGIDO
            isActive: isActivePrescription(startDate, durationInDays)  // <--- ✅ CORREGIDO
        };
        
        prescriptions.push(prescription);
    });
    
    return prescriptions;
}

// ========== Funciones de Extracción ==========
function extractMedication(text) {
    // Extraer nombre del medicamento (primera palabra o hasta 'mg')
    const match = text.match(/^([A-Za-záéíóúñ\s]+)(?:\s+\d+mg)?/i);
    return match ? match[1].trim() : text.split(' ')[0];
}

function extractDosage(text) {
    // Buscar dosis (ej: "20mg", "1 tableta", etc.)
    const dosageMatch = text.match(/\d+\s*mg|(\d+)\s*(tableta|cápsula|comprimido)/i);
    const frequencyMatch = text.match(/cada\s+(\d+)\s+(hora|horas|día|días)/i);
    
    let dosage = dosageMatch ? dosageMatch[0] : '';
    if (frequencyMatch) {
        dosage += ` cada ${frequencyMatch[1]} ${frequencyMatch[2]}`;
    }
    
    return dosage || 'Según indicación médica';
}

function extractInstructions(text) {
    // Buscar instrucciones comunes
    const instructions = [
        'en ayunas',
        'después de',
        'antes de',
        'con alimentos',
        'con comida',
        'después de la cena',
        'por la mañana',
        'por la noche'
    ];
    
    for (let instruction of instructions) {
        if (text.toLowerCase().includes(instruction)) {
            return text.substring(text.toLowerCase().indexOf(instruction));
        }
    }
    
    return 'Seguir indicaciones médicas';
}

function extractDuration(text) {
    // Buscar duración en meses o días
    const monthMatch = text.match(/(\d+)\s*mes(?:es)?/i);
    const dayMatch = text.match(/(\d+)\s*día(?:s)?/i);
    
    if (monthMatch) {
        return parseInt(monthMatch[1]) * 30; // convertir a días
    }
    if (dayMatch) {
        return parseInt(dayMatch[1]);
    }
    
    return 90; // Default: 3 meses
}

function calculateExpiryDate(startDate, durationDays) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + durationDays);
    return date;
}

function isActivePrescription(startDate, durationDays) {
    const expiryDate = calculateExpiryDate(startDate, durationDays);
    return new Date() < expiryDate;
}

// ========== Mostrar Recetas ==========
function displayPrescriptions() {
    const container = document.querySelector('.prescriptions-grid');
    
    if (!container) return;
    
    // Filtrar según el tab activo
    const filteredPrescriptions = allPrescriptions.filter(prescription => {
        if (currentFilter === 'active') {
            return prescription.isActive;
        } else {
            return !prescription.isActive;
        }
    });
    
    if (filteredPrescriptions.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; color: var(--text-light);">
                <i class="fas fa-prescription-bottle-alt" style="font-size: 3rem; margin-bottom: 1rem;"></i>
                <p>No hay recetas ${currentFilter === 'active' ? 'activas' : 'en el historial'}</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filteredPrescriptions.map(prescription => 
        createPrescriptionCard(prescription)
    ).join('');
    
    // Agregar event listeners a los botones
    attachButtonListeners();
}

// ========== Crear Tarjeta de Receta ==========
function createPrescriptionCard(prescription) {
    const status = getPrescriptionStatus(prescription);
    const statusClass = status.class;
    const statusLabel = status.label;
    
    return `
        <div class="prescription-card ${statusClass}">
            <div class="prescription-header">
                <div class="medication-icon">
                    <i class="fas fa-prescription-bottle-alt"></i>
                </div>
                <div class="prescription-title">
                    <h3>${prescription.medication}</h3>
                    <p class="prescribed-by">Prescrito por ${prescription.doctor}</p>
                </div>
                <span class="badge-${statusClass}">${statusLabel}</span>
            </div>
            <div class="prescription-body">
                <div class="prescription-detail">
                    <i class="fas fa-calendar"></i>
                    <div>
                        <strong>Fecha de emisión:</strong>
                        <p>${Helpers.formatDate(prescription.date)}</p>
                    </div>
                </div>
                <div class="prescription-detail">
                    <i class="fas fa-clock"></i>
                    <div>
                        <strong>Duración:</strong>
                        <p>${Math.floor(prescription.duration / 30)} meses (${prescription.isActive ? 'válida hasta' : 'venció el'} ${Helpers.formatDate(prescription.expiryDate)})</p>
                    </div>
                </div>
                <div class="prescription-detail">
                    <i class="fas fa-pills"></i>
                    <div>
                        <strong>Dosis:</strong>
                        <p>${prescription.dosage}</p>
                    </div>
                </div>
                <div class="prescription-detail">
                    <i class="fas fa-info-circle"></i>
                    <div>
                        <strong>Indicaciones:</strong>
                        <p>${prescription.instructions}</p>
                    </div>
                </div>
            </div>
            <div class="prescription-footer">
                <button class="btn-secondary" onclick="downloadPrescription('${prescription.id}')">
                    <i class="fas fa-download"></i> Descargar
                </button>
                ${prescription.isActive ? `
                    <button class="btn-info" onclick="renewPrescription('${prescription.id}')">
                        <i class="fas fa-redo"></i> Renovar
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// ========== Determinar Estado de Receta ==========
function getPrescriptionStatus(prescription) {
    if (!prescription.isActive) {
        return { class: 'expired', label: 'Vencida' };
    }
    
    // Calcular días hasta vencimiento
    const today = new Date();
    const expiryDate = new Date(prescription.expiryDate);
    const daysUntilExpiry = Math.floor((expiryDate - today) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry <= 30) {
        return { class: 'expiring', label: 'Por Vencer' };
    }
    
    return { class: 'active', label: 'Activa' };
}

// ========== Acciones de Botones ==========
function attachButtonListeners() {
    // Los onclick ya están en el HTML generado dinámicamente
}

function downloadPrescription(prescriptionId) {
    Helpers.showAlert('Descargando receta...', 'info');
    // Implementar lógica de descarga
    console.log('Descargar receta:', prescriptionId);
}

function renewPrescription(prescriptionId) {
    Helpers.showAlert('Solicitud de renovación enviada', 'success');
    // Implementar lógica de renovación
    console.log('Renovar receta:', prescriptionId);
}

// ========== Exportar funciones globales ==========
window.downloadPrescription = downloadPrescription;
window.renewPrescription = renewPrescription;
