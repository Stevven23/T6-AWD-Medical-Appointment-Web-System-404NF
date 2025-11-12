
document.getElementById('emailForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const newEmail = document.getElementById('newEmail').value;
    const confirmEmail = document.getElementById('confirmEmail').value;

    if (!newEmail || !confirmEmail) {
        alert('Por favor, completa todos los campos de correo electrónico.');
        return;
    }

    if (newEmail !== confirmEmail) {
        alert('Los correos electrónicos no coinciden.');
        return;
    }

    if (!validateEmail(newEmail)) {
        alert('Por favor, ingresa un correo electrónico válido.');
        return;
    }

    alert('Correo electrónico actualizado exitosamente.');
    document.getElementById('currentEmail').value = newEmail;
    document.getElementById('newEmail').value = '';
    document.getElementById('confirmEmail').value = '';
});

document.getElementById('passwordForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Por favor, completa todos los campos de contraseña.');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Las contraseñas no coinciden.');
        return;
    }

    if (newPassword.length < 8) {
        alert('La contraseña debe tener al menos 8 caracteres.');
        return;
    }

    if (!validatePassword(newPassword)) {
        alert('La contraseña debe incluir mayúsculas, minúsculas y números.');
        return;
    }

    alert('Contraseña cambiada exitosamente.');
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
    document.getElementById('confirmPassword').value = '';
});

function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    return hasUpperCase && hasLowerCase && hasNumbers;
}