import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    cedula: '',
    date_of_birth: '',
    phone_number: '',
    email: '',
    password: '',
    confirm_password: '',
    role: 'patient',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [maxDob, setMaxDob] = useState('');

  useEffect(() => {
    // Set max date to ensure user is at least 18 years old
    const today = new Date();
    const max = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
    setMaxDob(max.toISOString().split('T')[0]);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
    setError('');
    setSuccess('');
  };

  const validate = () => {
    if (!form.first_name || !form.last_name || !form.email || !form.password || !form.confirm_password) {
      setError('Por favor completa todos los campos obligatorios');
      return false;
    }
    if (form.password !== form.confirm_password) {
      setError('Las contraseñas no coinciden');
      return false;
    }
    if (!/^[0-9]{10}$/.test(form.cedula)) {
      setError('La cédula debe tener 10 dígitos numéricos');
      return false;
    }
    if (form.phone_number && !/^[0-9]{10}$/.test(form.phone_number)) {
      setError('El teléfono debe tener 10 dígitos numéricos');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validate()) return;

    setLoading(true);
    try {
      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        cedula: form.cedula,
        date_of_birth: form.date_of_birth,
        phone_number: form.phone_number,
        email: form.email,
        password: form.password,
        role: form.role,
      };

      const resp = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const contentType = resp.headers.get('content-type') || '';
      let data = {};
      if (contentType.includes('application/json')) data = await resp.json();
      else data = { message: await resp.text() };

      if (!resp.ok) throw new Error(data.error || data.message || 'Error al registrar');

      setSuccess('¡Registro exitoso! Redirigiendo al inicio de sesión...');
      setForm({ first_name: '', last_name: '', cedula: '', date_of_birth: '', phone_number: '', email: '', password: '', confirm_password: '', role: 'patient' });
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.message || 'Error al registrar el paciente');
    } finally {
      setLoading(false);
    }
  };

  const registerWithGoogle = () => {
    // Use relative URL so dev proxy still applies
    window.location.href = '/api/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div className="hidden md:flex flex-col items-center justify-center bg-white p-8 shadow rounded">
          <img src="/logo.png" alt="Logo" className="w-28 mb-4" />
          <h3 className="text-2xl font-semibold">¡Únete a Clínica San Miguel!</h3>
          <p className="text-gray-600 mt-2 text-center">Registra tus datos para acceder a nuestros servicios médicos.</p>
        </div>

        <div className="bg-white p-6 shadow rounded">
          <h2 className="text-2xl font-semibold mb-4">Registro de Paciente</h2>

          {error && <div className="mb-3 text-red-600 bg-red-50 p-3 rounded">{error}</div>}
          {success && <div className="mb-3 text-green-700 bg-green-50 p-3 rounded">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input name="first_name" value={form.first_name} onChange={handleChange} placeholder="Nombres" className="border p-2 rounded w-full" required />
              <input name="last_name" value={form.last_name} onChange={handleChange} placeholder="Apellidos" className="border p-2 rounded w-full" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input name="cedula" value={form.cedula} onChange={handleChange} placeholder="Cédula" maxLength={10} className="border p-2 rounded w-full" required />
              <input name="date_of_birth" value={form.date_of_birth} onChange={handleChange} type="date" placeholder="Fecha de Nacimiento" max={maxDob} className="border p-2 rounded w-full" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input name="phone_number" value={form.phone_number} onChange={handleChange} placeholder="Celular" maxLength={10} className="border p-2 rounded w-full" />
              <input name="email" type="email" value={form.email} onChange={handleChange} placeholder="Correo Electrónico" className="border p-2 rounded w-full" required />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input name="password" type="password" value={form.password} onChange={handleChange} placeholder="Contraseña (mínimo 6 caracteres)" minLength={6} className="border p-2 rounded w-full" required />
              <input name="confirm_password" type="password" value={form.confirm_password} onChange={handleChange} placeholder="Confirmar Contraseña" minLength={6} className="border p-2 rounded w-full" required />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60 flex items-center">
                  <span>{loading ? 'Registrando...' : 'Registrarse'}</span>
                  {loading && (
                    <svg className="animate-spin ml-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                    </svg>
                  )}
                </button>
              </div>

                <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  ¿Ya tienes cuenta? <br></br> <a href="/login" className="text-blue-600">Inicia sesión aquí</a>
                </div>
                <button type="button" onClick={() => navigate('/login')} className="text-sm text-gray-700 underline">
                  Volver a inicio de sesión
                </button>
              </div>
            </div>

            <div className="divider text-center py-2">O</div>

            <div className="flex justify-center">
              <button type="button" onClick={registerWithGoogle} className="bg-white border px-4 py-2 rounded inline-flex items-center gap-2">
                <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                Continuar con Google
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
