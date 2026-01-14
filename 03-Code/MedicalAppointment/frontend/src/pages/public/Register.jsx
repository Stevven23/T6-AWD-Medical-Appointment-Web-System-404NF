import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

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
      setForm({
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
      setTimeout(() => navigate('/login'), 1800);
    } catch (err) {
      setError(err.message || 'Error al registrar el paciente');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'https://medical-appointment-backend-2xx0.onrender.com';
    window.location.href = `${API_URL}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-5xl min-h-[500px] flex relative">
        {/* Back to Home Button */}
        <Link
          to="/"
          className="absolute top-5 left-5 z-10 flex items-center gap-2 px-5 py-2.5 bg-white/95 text-primary-500 rounded-full font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          Inicio
        </Link>

        {/* Left Side - Branding */}
        <div className="hidden md:flex flex-1 bg-gradient-to-br from-primary-500 to-primary-700 p-10 flex-col justify-center items-center text-white rounded-r-[100px]">
          <div className="w-64 h-44 flex items-center justify-center mb-5">
            <img 
              src="/logo.png" 
              alt="Clínica San Miguel" 
              className="max-w-[220px] max-h-[140px] object-contain rounded-lg"
            />
          </div>
          <div className="text-center max-w-xs">
            <h2 className="text-4xl font-bold mb-4 drop-shadow-md">¡Únete a nosotros!</h2>
            <p className="text-blue-100 text-lg">Tu salud es nuestra prioridad</p>
          </div>
        </div>

        {/* Right Side - Register Form */}
        <div className="flex-1 p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Crea tu cuenta
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="first_name"
                  value={form.first_name}
                  onChange={handleChange}
                  placeholder="Nombre"
                  required
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-base bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:shadow-lg transition-all"
                />
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Apellido"
                  required
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-base bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:shadow-lg transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="cedula"
                  value={form.cedula}
                  onChange={handleChange}
                  placeholder="Cédula"
                  required
                  maxLength="10"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-base bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:shadow-lg transition-all"
                />
                <input
                  type="tel"
                  name="phone_number"
                  value={form.phone_number}
                  onChange={handleChange}
                  placeholder="Teléfono"
                  maxLength="10"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-base bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:shadow-lg transition-all"
                />
              </div>

              <div>
                <input
                  type="date"
                  name="date_of_birth"
                  value={form.date_of_birth}
                  onChange={handleChange}
                  max={maxDob}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-base bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:shadow-lg transition-all"
                />
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Correo Electrónico"
                  required
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-base bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:shadow-lg transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Contraseña"
                  required
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-base bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:shadow-lg transition-all"
                />
                <input
                  type="password"
                  name="confirm_password"
                  value={form.confirm_password}
                  onChange={handleChange}
                  placeholder="Confirmar"
                  required
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-base bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:shadow-lg transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white font-bold py-4 px-6 rounded-2xl text-lg shadow-xl hover:shadow-2xl hover:scale-[1.02] transform transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registrando...' : 'Crear Cuenta'}
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t-2 border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="px-4 bg-white text-gray-500 font-medium">O continúa con</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleRegister}
                className="w-full bg-white border-2 border-gray-200 text-gray-700 font-semibold py-4 px-6 rounded-2xl text-base shadow-md hover:shadow-xl hover:scale-[1.02] transform transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Registrarse con Google
              </button>
            </form>

            <p className="text-center text-gray-600 mt-8 text-sm">
              ¿Ya tienes una cuenta?{' '}
              <Link to="/login" className="text-primary-500 font-bold hover:underline">
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
