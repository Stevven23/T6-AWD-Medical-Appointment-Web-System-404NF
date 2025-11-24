// utils/validation.js

/**
 * Función auxiliar para validar cédula ecuatoriana.
 */
function validateCedula(cedula) {
    if (!cedula || cedula.length !== 10) return false;
    
    const digits = cedula.split('').map(Number);
    const province = parseInt(cedula.substring(0, 2));
    
    if (province < 1 || province > 24) return false;
    
    const coefficients = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let sum = 0;
    
    for (let i = 0; i < 9; i++) {
        let value = digits[i] * coefficients[i];
        if (value > 9) value -= 9;
        sum += value;
    }
    
    const verifier = sum % 10 === 0 ? 0 : 10 - (sum % 10);
    return verifier === digits[9];
}

// Exportar la función para que pueda ser utilizada
module.exports = {
    validateCedula
};