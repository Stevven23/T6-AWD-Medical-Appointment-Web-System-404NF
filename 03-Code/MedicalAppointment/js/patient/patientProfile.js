document.addEventListener('DOMContentLoaded', async () => {
  // Verificar autenticación
  if (!Helpers.checkAuth()) return;

  const user = Helpers.getCurrentUser();
  
  // Verificar que sea paciente
  if (user.role !== 'patient') {
    window.location.href = '/panels/login.html';
    return;
  }

  // Elementos del DOM
  const profileForm = document.getElementById('profileForm');
  const passwordForm = document.getElementById('passwordForm');

  // Cargar perfil
  await loadProfile();

  // Event listeners
  profileForm?.addEventListener('submit', handleProfileUpdate);
  passwordForm?.addEventListener('submit', handlePasswordChange);

  /**
   * Cargar datos del perfil
   */
  async function loadProfile() {
    try {
      const profile = await PatientAPI.getProfile();

      // Llenar formulario de información personal
      document.getElementById('firstName').value = profile.first_name || '';
      document.getElementById('lastName').value = profile.last_name || '';
      document.getElementById('email').value = profile.email || '';
      document.getElementById('phone').value = profile.phone_number || '';
      document.getElementById('birthDate').value = profile.date_of_birth || '';
      document.getElementById('gender').value = profile.gender || '';
      
      // Información de contacto
      document.getElementById('address').value = profile.address || '';
      document.getElementById('city').value = profile.city || '';
      document.getElementById('state').value = profile.state || '';
      document.getElementById('postalCode').value = profile.postal_code || '';
      document.getElementById('country').value = profile.country || 'Ecuador';

      // Información médica
      document.getElementById('allergies').value = profile.allergies || '';
      document.getElementById('conditions').value = profile.medical_conditions || '';
      document.getElementById('medications').value = profile.current_medications || '';

      // Seguro
      document.getElementById('insurancePlan').value = profile.insurance_plan || '';
      document.getElementById('insuranceNumber').value = profile.insurance_number || '';

      // Contacto de emergencia
      document.getElementById('emergencyName').value = profile.emergency_contact_name || '';
      document.getElementById('emergencyPhone').value = profile.emergency_contact_phone || '';

      // Mostrar edad si hay fecha de nacimiento
      if (profile.date_of_birth) {
        const age = Helpers.calculateAge(profile.date_of_birth);
        const ageDisplay = document.getElementById('ageDisplay');
        if (ageDisplay) ageDisplay.textContent = `${age} años`;
      }

    } catch (error) {
      console.error('Error al cargar perfil:', error);
      Helpers.showAlert('Error al cargar el perfil: ' + error.message, 'error');
    }
  }

  /**
   * Actualizar perfil
   */
  async function handleProfileUpdate(e) {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';

    try {
      const profileData = {
        first_name: document.getElementById('firstName').value,
        last_name: document.getElementById('lastName').value,
        phone_number: document.getElementById('phone').value,
        date_of_birth: document.getElementById('birthDate').value,
        gender: document.getElementById('gender').value,
        address: document.getElementById('address').value,
        city: document.getElementById('city').value,
        state: document.getElementById('state').value,
        postal_code: document.getElementById('postalCode').value,
        country: document.getElementById('country').value,
        allergies: document.getElementById('allergies').value,
        medical_conditions: document.getElementById('conditions').value,
        current_medications: document.getElementById('medications').value,
        insurance_plan: document.getElementById('insurancePlan').value,
        insurance_number: document.getElementById('insuranceNumber').value,
        emergency_contact_name: document.getElementById('emergencyName').value,
        emergency_contact_phone: document.getElementById('emergencyPhone').value
      };

      await PatientAPI.updateProfile(profileData);

      // Actualizar nombre en localStorage
      const user = Helpers.getCurrentUser();
      user.first_name = profileData.first_name;
      user.last_name = profileData.last_name;
      localStorage.setItem('user', JSON.stringify(user));

      Helpers.showAlert('✅ Perfil actualizado exitosamente');

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      Helpers.showAlert('❌ Error al actualizar el perfil: ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  /**
   * Cambiar contraseña
   */
  async function handlePasswordChange(e) {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validaciones
    if (newPassword !== confirmPassword) {
      Helpers.showAlert('❌ Las contraseñas no coinciden');
      return;
    }

    if (newPassword.length < 8) {
      Helpers.showAlert('❌ La contraseña debe tener al menos 8 caracteres');
      return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Cambiando...';

    try {
      await PatientAPI.changePassword(currentPassword, newPassword);

      Helpers.showAlert('✅ Contraseña cambiada exitosamente');
      passwordForm.reset();

    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      Helpers.showAlert('❌ ' + error.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }
});
