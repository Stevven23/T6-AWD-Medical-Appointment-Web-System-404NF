document.addEventListener('DOMContentLoaded', async () => {
  if (!Helpers.checkAuth()) return;

  // Elementos del DOM
  const specialtySelect = document.getElementById('specialty');
  const doctorSelect = document.getElementById('doctor');
  const dateInput = document.getElementById('appointmentDate');
  const slotsContainer = document.getElementById('availableSlots');
  const appointmentForm = document.getElementById('newAppointmentForm');
  const doctorInfoDiv = document.getElementById('doctorInfo');

  let selectedSlot = null;

  // Cargar especialidades
  await loadSpecialties();

  // Event listeners
  specialtySelect?.addEventListener('change', handleSpecialtyChange);
  doctorSelect?.addEventListener('change', handleDoctorChange);
  dateInput?.addEventListener('change', handleDateChange);
  appointmentForm?.addEventListener('submit', handleCreateAppointment);

  /**
   * Cargar especialidades
   */
  async function loadSpecialties() {
    try {
      const specialties = await DoctorAPI.getSpecialties();
      
      specialtySelect.innerHTML = '<option value="">Seleccione una especialidad</option>';
      specialties.forEach(specialty => {
        const option = document.createElement('option');
        option.value = specialty.id;
        option.textContent = specialty.name;
        specialtySelect.appendChild(option);
      });
    } catch (error) {
      console.error('Error al cargar especialidades:', error);
      Helpers.showAlert('Error al cargar especialidades');
    }
  }

  /**
   * Manejar cambio de especialidad
   */
  async function handleSpecialtyChange() {
    const specialtyId = specialtySelect.value;
    
    doctorSelect.innerHTML = '<option value="">Cargando...</option>';
    doctorSelect.disabled = true;
    dateInput.disabled = true;
    slotsContainer.innerHTML = '';
    doctorInfoDiv.innerHTML = '';

    if (!specialtyId) {
      doctorSelect.innerHTML = '<option value="">Seleccione un doctor</option>';
      return;
    }

    try {
      const doctors = await DoctorAPI.getDoctors(specialtyId);
      
      doctorSelect.innerHTML = '<option value="">Seleccione un doctor</option>';
      
      if (doctors.length === 0) {
        doctorSelect.innerHTML = '<option value="">No hay doctores disponibles</option>';
        return;
      }

      doctors.forEach(doctor => {
        const option = document.createElement('option');
        option.value = doctor.id;
        // Los datos del doctor vienen en doctor.users
        const firstName = doctor.users?.first_name || doctor.first_name || '';
        const lastName = doctor.users?.last_name || doctor.last_name || '';
        option.textContent = `Dr. ${firstName} ${lastName}`;
        doctorSelect.appendChild(option);
      });

      doctorSelect.disabled = false;

    } catch (error) {
      console.error('Error al cargar doctores:', error);
      Helpers.showAlert('Error al cargar doctores');
      doctorSelect.innerHTML = '<option value="">Error al cargar</option>';
    }
  }

  /**
   * Manejar cambio de doctor
   */
  async function handleDoctorChange() {
    const doctorId = doctorSelect.value;
    
    dateInput.disabled = true;
    slotsContainer.innerHTML = '';

    if (!doctorId) {
      doctorInfoDiv.innerHTML = '';
      return;
    }

    try {
      const doctor = await DoctorAPI.getDoctorById(doctorId);
      
      // Los datos del doctor vienen en doctor.users
      const firstName = doctor.users?.first_name || doctor.first_name || '';
      const lastName = doctor.users?.last_name || doctor.last_name || '';
      const specialtyName = doctor.specialties?.name || doctor.specialty_name || 'No especificada';
      const phoneNumber = doctor.users?.phone_number || doctor.phone_number || '';
      
      doctorInfoDiv.innerHTML = `
        <div class="card mt-3">
          <div class="card-body">
            <h5 class="card-title">Dr. ${firstName} ${lastName}</h5>
            <p class="card-text">
              <strong>Especialidad:</strong> ${specialtyName}<br>
              ${doctor.bio ? `<strong>Biografía:</strong> ${doctor.bio}<br>` : ''}
              ${phoneNumber ? `<strong>Teléfono:</strong> ${phoneNumber}` : ''}
            </p>
          </div>
        </div>
      `;

      dateInput.disabled = false;
      const today = new Date().toISOString().split('T')[0];
      dateInput.min = today;

    } catch (error) {
      console.error('Error al cargar doctor:', error);
      Helpers.showAlert('Error al cargar información del doctor');
    }
  }

  /**
   * Manejar cambio de fecha
   */
  async function handleDateChange() {
    const doctorId = doctorSelect.value;
    const date = dateInput.value;

    if (!doctorId || !date) return;

    slotsContainer.innerHTML = '<p class="text-center"><span class="spinner-border"></span> Cargando horarios...</p>';

    try {
      const response = await DoctorAPI.getAvailableSlots(doctorId, date);
      const slots = response.slots;

      if (slots.length === 0) {
        slotsContainer.innerHTML = `
          <div class="alert alert-warning mt-3">
            <i class="fas fa-exclamation-triangle"></i>
            No hay horarios disponibles para esta fecha.
          </div>
        `;
        return;
      }

      slotsContainer.innerHTML = '<h6 class="mt-3">Horarios Disponibles:</h6><div class="row g-2" id="slotsGrid"></div>';
      const slotsGrid = document.getElementById('slotsGrid');

      slots.forEach(slot => {
        const slotButton = document.createElement('button');
        slotButton.type = 'button';
        slotButton.className = 'col-4 col-md-3 btn btn-outline-primary btn-slot';
        slotButton.textContent = slot.start;
        slotButton.dataset.start = slot.start;
        slotButton.dataset.end = slot.end;
        
        slotButton.addEventListener('click', () => handleSlotSelection(slotButton, slot));
        
        slotsGrid.appendChild(slotButton);
      });

    } catch (error) {
      console.error('Error al cargar slots:', error);
      slotsContainer.innerHTML = `
        <div class="alert alert-danger mt-3">
          Error al cargar horarios: ${error.message}
        </div>
      `;
    }
  }

  /**
   * Seleccionar slot
   */
  function handleSlotSelection(button, slot) {
    document.querySelectorAll('.btn-slot').forEach(btn => {
      btn.classList.remove('active', 'btn-primary');
      btn.classList.add('btn-outline-primary');
    });

    button.classList.add('active', 'btn-primary');
    button.classList.remove('btn-outline-primary');

    selectedSlot = slot;
  }

  /**
   * Crear cita
   */
  async function handleCreateAppointment(e) {
    e.preventDefault();

    if (!selectedSlot) {
      Helpers.showAlert('⚠️ Por favor, seleccione un horario');
      return;
    }

    const doctorId = doctorSelect.value;
    const date = dateInput.value;
    const reason = document.getElementById('reason').value;

    const scheduled_start = `${date}T${selectedSlot.start}:00`;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Creando...';

    try {
      await AppointmentAPI.createAppointment({
        doctor_id: doctorId,
        scheduled_start: scheduled_start,
        reason: reason || null,
        duration_minutes: 30
      });

      Helpers.showAlert('✅ Cita creada exitosamente');
      
      setTimeout(() => {
        window.location.href = 'patientAppointments.html';
      }, 1500);

    } catch (error) {
      console.error('Error al crear cita:', error);
      Helpers.showAlert('❌ ' + error.message);
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Agendar Cita';
    }
  }
});
