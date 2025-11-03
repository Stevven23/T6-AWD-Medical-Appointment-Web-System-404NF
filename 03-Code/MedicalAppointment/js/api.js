const API_URL = 'https://medical-appointment-backend-2xx0.onrender.com';

// Función para probar la conexión con el backend
async function testBackendConnection() {
    try {
        const response = await fetch(`${API_URL}/api/test`);
        const data = await response.json();
        console.log('Respuesta del backend:', data.message);
    } catch (error) {
        console.error('Error conectando con el backend:', error);
    }
}

// Función para obtener doctores
async function getDoctors() {
    try {
        const response = await fetch(`${API_URL}/api/doctors`);
        const doctors = await response.json();
        return doctors;
    } catch (error) {
        console.error('Error obteniendo doctores:', error);
        return [];
    }
}

// Función para crear una cita
async function createAppointment(appointmentData) {
    try {
        const response = await fetch(`${API_URL}/api/appointments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(appointmentData)
        });
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('Error creando cita:', error);
        throw error;
    }
}

// Ejemplo de uso:
document.addEventListener('DOMContentLoaded', async () => {
    await testBackendConnection();
    const doctors = await getDoctors();
    console.log('Doctores obtenidos:', doctors);
    const appointmentForm = document.getElementById('appointmentForm');
    if (appointmentForm) {
        appointmentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                patient_id: document.getElementById('patientId').value,
                doctor_id: document.getElementById('doctorId').value,
                date: document.getElementById('appointmentDate').value
            };
            try {
                const result = await createAppointment(formData);
                alert('Cita creada con éxito!');
            } catch (error) {
                alert('Error al crear la cita');
            }
        });
    }
});
