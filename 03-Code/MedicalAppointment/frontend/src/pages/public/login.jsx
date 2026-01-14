import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Manejar errores de OAuth desde query params
    const oauthError = searchParams.get('error');
    if (oauthError) {
      const errorMessages = {
        'google_auth_failed': 'Error al autenticar con Google. Intenta nuevamente.',
        'callback_failed': 'Error en el proceso de autenticación.',
        'authentication_failed': 'No se pudo completar la autenticación.'
      };
      setError(errorMessages[oauthError] || 'Error desconocido');
    }

    // Manejar callback exitoso de OAuth
    const oauthParam = searchParams.get('oauth');
    if (oauthParam) {
      try {
        const binaryString = atob(oauthParam);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        const decoder = new TextDecoder('utf-8');
        const jsonPayload = decoder.decode(bytes);
        const payload = JSON.parse(jsonPayload);
        
        // Guardar en localStorage
        localStorage.setItem('token', payload.token);
        localStorage.setItem('user', JSON.stringify(payload.user));
        
        // Verificar si necesita completar perfil
        const needsCompletion = searchParams.get('needs_completion') === 'true';
        if (needsCompletion) {
          navigate('/complete-profile', { replace: true });
        } else {
          // Redirigir según rol
          const roleRoutes = {
            patient: '/patient/dashboard',
            doctor: '/doctor/dashboard',
            admin: '/admin/dashboard',
          };
          navigate(roleRoutes[payload.user.role] || '/', { replace: true });
        }
      } catch (error) {
        console.error('Error procesando OAuth:', error);
        setError('Error al procesar la autenticación');
      }
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // Redirect based on role
        const roleRoutes = {
          patient: '/patient/dashboard',
          doctor: '/doctor/dashboard',
          admin: '/admin/dashboard',
        };
        
        const route = roleRoutes[result.user.role] || '/';
        navigate(route, { replace: true });
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error de conexión con el servidor');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
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
            <h2 className="text-4xl font-bold mb-4 drop-shadow-md">¡Bienvenido!</h2>
            <p className="text-blue-100 text-lg">Tu salud es nuestra prioridad</p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 p-12 flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                Accede a tu cuenta
              </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Correo Electrónico"
                  required
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-base bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:shadow-lg transition-all"
                />
              </div>

              <div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  required
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-2xl text-base bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:bg-white focus:shadow-lg transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-4 rounded-full text-lg font-semibold uppercase tracking-wide hover:from-green-600 hover:to-green-700 hover:-translate-y-1 hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Cargando...
                  </span>
                ) : (
                  'Ingresar'
                )}
              </button>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-3 bg-white text-gray-500 font-medium">O</span>
                </div>
              </div>

              {/* Google Login */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-5 py-3.5 border-2 border-gray-200 rounded-3xl bg-white text-gray-700 text-base font-semibold hover:bg-gray-50 hover:border-blue-400 hover:-translate-y-0.5 hover:shadow-lg transition-all"
              >
                <svg width="20" height="20" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                </svg>
                Continuar con Google
              </button>

              {/* Register Link */}
              <div className="text-center mt-4">
                <p className="text-gray-600 text-sm">
                  ¿No tienes una cuenta?{' '}
                  <Link 
                    to="/register" 
                    className="text-primary-500 font-semibold hover:text-primary-600 hover:underline transition-colors"
                  >
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}