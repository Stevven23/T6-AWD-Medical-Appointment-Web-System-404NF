// services/patientService.js

const supabase = require('../database');
const bcrypt = require('bcrypt');
const { validateCedula } = require('../utils/validation');

// --- Función auxiliar (Corregida: usa ageDifMs en lugar de diffMs) ---
function calculateAge(dobString) {
    if (!dobString) return 0;
    const dob = new Date(dobString);
    
    // 1. Calcula la diferencia en milisegundos (Variable: ageDifMs)
    const ageDifMs = Date.now() - dob.getTime(); 
    
    // 2. Crea un objeto Date a partir de esa diferencia, usando la variable CORRECTA
    const ageDate = new Date(ageDifMs); 
    
    // 3. Retorna la diferencia de años
    return Math.abs(ageDate.getUTCFullYear() - 1970);
}


/**
 * Obtiene la lista base de pacientes con su última visita.
 * (Consulta PostgREST limpia y correcta)
 */
async function getPatientsList(doctorId = null) {
    try {
        let patientQuery = supabase
            .from('patients')
            .select(`
                date_of_birth,
                allergies,
                medical_conditions,
                
                users(
                    id, 
                    first_name, 
                    last_name, 
                    cedula, 
                    phone_number, 
                    email
                )
            `);

        const { data: patientsData, error: patientsError } = await patientQuery;
        if (patientsError) throw patientsError;

        // Procesamos la lista para obtener la última cita de cada paciente
        const patientsWithDetails = await Promise.all(patientsData.map(async (patient) => {
            
            // Accedemos a los datos de usuario a través de patient.users
            const patientUserId = patient.users.id;
            
            // Sub-consulta para la última cita
            const { data: lastAppointment } = await supabase
                .from('appointments')
                .select('scheduled_start')
                .eq('patient_user_id', patientUserId)
                .order('scheduled_start', { ascending: false })
                .limit(1);

            const lastVisit = (lastAppointment && lastAppointment.length > 0) 
                ? lastAppointment[0].scheduled_start 
                : null;
            
            // Retornamos el objeto con el formato final
            return {
                user_id: patientUserId,
                
                // Mapeamos los campos desde patient.users
                first_name: patient.users.first_name,
                last_name: patient.users.last_name,
                cedula: patient.users.cedula,
                phone_number: patient.users.phone_number,
                email: patient.users.email,
                
                date_of_birth: patient.date_of_birth,
                principal_condition: patient.medical_conditions || 'No especificada',
                allergies: patient.allergies,
                ultima_visita: lastVisit,
                age: calculateAge(patient.date_of_birth),
            };
        }));
        
        return patientsWithDetails;

    } catch (error) {
        console.error('Error en patientService.getPatientsList:', error);
        throw new Error('Fallo en el servicio al cargar pacientes.'); 
    }
}

/**
 * Obtiene el historial clínico detallado de un paciente específico.
 */
async function getPatientRecordDetails(userId) {
    try {
        const [
            medicalRecordsResult,
            consultationNotesResult,
            labReportsResult
        ] = await Promise.all([
            // Consulta de Medical Records
            supabase.from('medical_records').select('*').eq('patient_user_id', userId).maybeSingle(),
            
            // Consulta de Notas de Consulta
            supabase.from('consultation_notes')
                    .select('*, appointment:appointments!inner(scheduled_start, doctor:doctors!inner(users!inner(first_name, last_name)))')
                    .eq('appointment.patient_user_id', userId)
                    .order('created_at', { ascending: false }),

            // Consulta de Reportes de Laboratorio
            supabase.from('lab_reports')
                    .select('*, lab_results(*)')
                    .eq('patient_user_id', userId)
                    .order('order_date', { ascending: false })
        ]);

        return {
            medical_record: medicalRecordsResult.data,
            consultation_notes: consultationNotesResult.data || [],
            lab_reports: labReportsResult.data || []
        };
    } catch (error) {
        console.error('Error en patientService.getPatientRecordDetails:', error);
        throw new Error('Fallo en el servicio al obtener el historial.');
    }
}

/**
 * Crea un nuevo usuario y registro de paciente.
 */
async function createPatient(patientData) {
    const { 
        email, password, first_name, last_name, cedula, 
        date_of_birth, allergies, medical_conditions, phone_number
    } = patientData;

    try {
        // 1. Buscar Role ID
        const { data: role, error: roleError } = await supabase
            .from('roles')
            .select('id')
            .eq('code', 'patient')
            .single();

        if (roleError || !role) throw new Error('Role patient no encontrado.');

        // 2. Verificar existencia del email
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', email)
            .maybeSingle();

        if (existingUser) throw new Error('El email ya está registrado');

        // 3. Crear Usuario
        const passwordHash = await bcrypt.hash(password, 10);
        
        const { data: user, error: userError } = await supabase
            .from('users')
            .insert([{
                email,
                password_hash: passwordHash,
                role_id: role.id,
                first_name,
                last_name,
                cedula: cedula || null,
                phone_number: phone_number || null,
                is_active: true,
            }])
            .select()
            .single();

        if (userError) throw userError;

        // 4. Crear Registro de Paciente
        const { data: patient, error: patientError } = await supabase
            .from('patients')
            .insert([{
                user_id: user.id,
                date_of_birth: date_of_birth || null,
                allergies: allergies || null,
                medical_conditions: medical_conditions || null,
            }])
            .select()
            .single();

        if (patientError) throw patientError;
        
        // Retorna el objeto combinado para el controlador
        return { ...user, ...patient }; 

    } catch (error) {
        console.error('Error en patientService.createPatient:', error);
        // Propaga el mensaje de error para que el controlador lo use en la respuesta 400/500
        throw new Error(error.message || 'Fallo al crear el nuevo paciente.');
    }
}


module.exports = {
    getPatientsList,
    getPatientRecordDetails,
    createPatient
};