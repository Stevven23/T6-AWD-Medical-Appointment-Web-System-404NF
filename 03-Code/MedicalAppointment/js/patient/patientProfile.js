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
      Helpers.showLoading();
      const profile = await PatientAPI.getProfile();

      // Actualizar nombre en el header
      const headerUserName = document.getElementById('headerUserName');
      if (headerUserName) {
        headerUserName.textContent = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'Usuario';
      }

      // Llenar formulario de información personal
      document.getElementById('firstName').value = profile.first_name || '';
      document.getElementById('lastName').value = profile.last_name || '';
      document.getElementById('email').value = profile.email || '';
      document.getElementById('cedula').value = profile.cedula || profile.identification_number || '';
      document.getElementById('phone').value = profile.phone_number || '';
      document.getElementById('birthDate').value = profile.date_of_birth || '';
      document.getElementById('gender').value = profile.gender || '';
      
      // Información de contacto
      document.getElementById('homePhone').value = profile.home_phone || '';
      document.getElementById('address').value = profile.address || '';
      document.getElementById('city').value = profile.city || '';
      document.getElementById('state').value = profile.state || '';
      document.getElementById('postalCode').value = profile.postal_code || '';
      document.getElementById('country').value = profile.country || 'Ecuador';

      // Información médica
      document.getElementById('bloodType').value = profile.blood_type || '';
      document.getElementById('allergies').value = profile.allergies || '';
      document.getElementById('conditions').value = profile.medical_conditions || '';
      document.getElementById('medications').value = profile.current_medications || '';
      document.getElementById('height').value = profile.height || '';
      document.getElementById('weight').value = profile.weight || '';

      // Seguro
      document.getElementById('insurancePlan').value = profile.insurance_plan || '';
      document.getElementById('insuranceNumber').value = profile.insurance_number || '';

      // Contacto de emergencia
      document.getElementById('emergencyName').value = profile.emergency_contact_name || '';
      document.getElementById('emergencyRelation').value = profile.emergency_contact_relation || '';
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
    } finally {
      Helpers.hideLoading();
    }
  }

  /**
   * Actualizar perfil
   */
  async function handleProfileUpdate(e) {
    e.preventDefault();

    const submitBtn = document.querySelector('.btn-primary');
    if (!submitBtn) return;
    
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';

    try {
      const profileData = {
        first_name: document.getElementById('firstName')?.value || '',
        last_name: document.getElementById('lastName')?.value || '',
        phone_number: document.getElementById('phone')?.value || '',
        home_phone: document.getElementById('homePhone')?.value || '',
        date_of_birth: document.getElementById('birthDate')?.value || null,
        gender: document.getElementById('gender')?.value || null,
        address: document.getElementById('address')?.value || '',
        city: document.getElementById('city')?.value || '',
        state: document.getElementById('state')?.value || '',
        postal_code: document.getElementById('postalCode')?.value || '',
        country: document.getElementById('country')?.value || 'Ecuador',
        blood_type: document.getElementById('bloodType')?.value || '',
        allergies: document.getElementById('allergies')?.value || '',
        medical_conditions: document.getElementById('conditions')?.value || '',
        current_medications: document.getElementById('medications')?.value || '',
        height: document.getElementById('height')?.value || null,
        weight: document.getElementById('weight')?.value || null,
        insurance_plan: document.getElementById('insurancePlan')?.value || '',
        insurance_number: document.getElementById('insuranceNumber')?.value || '',
        emergency_contact_name: document.getElementById('emergencyName')?.value || '',
        emergency_contact_relation: document.getElementById('emergencyRelation')?.value || '',
        emergency_contact_phone: document.getElementById('emergencyPhone')?.value || ''
      };

      await PatientAPI.updateProfile(profileData);

      // Actualizar nombre en localStorage
      const user = Helpers.getCurrentUser();
      user.first_name = profileData.first_name;
      user.last_name = profileData.last_name;
      localStorage.setItem('user', JSON.stringify(user));

      // Actualizar nombre en el header
      const headerUserName = document.getElementById('headerUserName');
      if (headerUserName) {
        headerUserName.textContent = `${profileData.first_name} ${profileData.last_name}`.trim();
      }

      Helpers.showAlert('Perfil actualizado exitosamente', 'success');

    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      Helpers.showAlert('Error al actualizar el perfil: ' + error.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  }

  /**
   * Cambiar contraseña
   */
  async function handlePasswordChange(e) {
    if (e && e.preventDefault) {
      e.preventDefault();
    }

    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      Helpers.showAlert('Por favor complete todos los campos de contraseña', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      Helpers.showAlert('Las contraseñas no coinciden', 'warning');
      return;
    }

    if (newPassword.length < 8) {
      Helpers.showAlert('La contraseña debe tener al menos 8 caracteres', 'warning');
      return;
    }

    try {
      Helpers.showLoading();

      await PatientAPI.changePassword(currentPassword, newPassword);

      Helpers.showAlert('Contraseña cambiada exitosamente', 'success');
      
      // Limpiar campos
      document.getElementById('currentPassword').value = '';
      document.getElementById('newPassword').value = '';
      document.getElementById('confirmPassword').value = '';

    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      Helpers.showAlert(error.message || 'Error al cambiar la contraseña', 'error');
    } finally {
      Helpers.hideLoading();
    }
  }

  // Exportar función para que esté disponible globalmente
  window.changePassword = handlePasswordChange;
});
