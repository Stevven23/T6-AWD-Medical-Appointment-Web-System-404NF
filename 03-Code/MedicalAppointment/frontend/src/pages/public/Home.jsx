import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartIcon, 
  UserGroupIcon, 
  BeakerIcon, 
  ClockIcon,
  CheckCircleIcon,
  CalendarIcon,
  DocumentTextIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Navbar */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-2 rounded-xl shadow-lg">
                <img 
                  src="/logo.png" 
                  alt="Clínica San Miguel" 
                  className="h-10 w-auto object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                  Clínica San Miguel
                </span>
                <p className="text-xs text-gray-600">Tu salud, nuestra prioridad</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                to="/register" 
                className="hidden sm:inline-flex px-6 py-2.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                Registrarse
              </Link>
              <Link 
                to="/login" 
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 opacity-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-28 relative">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 bg-clip-text text-transparent leading-tight">
              Bienvenido a Clínica San Miguel
            </h1>
            <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-3xl mx-auto leading-relaxed">
              Tu salud es nuestra prioridad. Agenda citas con especialistas, revisa tus resultados y gestiona tu historial médico de forma fácil y segura.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                to="/register" 
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                Registrarse Ahora
              </Link>
              <Link 
                to="/login" 
                className="px-8 py-4 bg-white border-2 border-blue-600 text-blue-600 rounded-xl font-bold text-lg shadow-lg hover:bg-blue-50 hover:scale-105 transition-all"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>

          {/* Features Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-16">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <CalendarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Agenda Fácil</h3>
              <p className="text-gray-600 text-sm">Reserva citas en línea 24/7</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="bg-green-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <DocumentTextIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Historial Digital</h3>
              <p className="text-gray-600 text-sm">Accede a tu información médica</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="bg-purple-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <BeakerIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Resultados Online</h3>
              <p className="text-gray-600 text-sm">Consulta tus exámenes de laboratorio</p>
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1">
              <div className="bg-red-100 w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                <ShieldCheckIcon className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Seguro y Privado</h3>
              <p className="text-gray-600 text-sm">Protección total de tus datos</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Instalaciones Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Nuestras Instalaciones
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Contamos con infraestructura moderna y personal altamente calificado
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="overflow-hidden">
                <img 
                  src="/fachadaclinicasanmiguel.jpg" 
                  alt="fachada" 
                  className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2 text-gray-900">Clínica de Especialidades</h3>
                <p className="text-gray-600">
                  Instalaciones diseñadas para brindar atención médica de excelencia
                </p>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="overflow-hidden">
                <img 
                  src="/personal.jpg" 
                  alt="personal" 
                  className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2 text-gray-900">Personal Calificado</h3>
                <p className="text-gray-600">
                  Equipo médico profesional comprometido con tu bienestar
                </p>
              </div>
            </div>

            <div className="group bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-2xl transition-all hover:-translate-y-2">
              <div className="overflow-hidden">
                <img 
                  src="/instalaciones.jpg" 
                  alt="instalaciones" 
                  className="w-full h-56 object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <h3 className="font-bold text-xl mb-2 text-gray-900">Instalaciones Modernas</h3>
                <p className="text-gray-600">
                  Tecnología de punta para diagnósticos precisos y tratamientos efectivos
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Video Section */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Conoce Nuestro Centro
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Descubre todo lo que tenemos para ofrecerte en este recorrido virtual
            </p>
          </div>
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden p-2">
            <div className="aspect-w-16 aspect-h-9 bg-black rounded-xl overflow-hidden">
              <iframe 
                className="w-full h-[400px] md:h-[500px] rounded-xl" 
                src="https://www.youtube.com/embed/-KId984cnzk?si=2WbrgKUzH22fMds4" 
                title="YouTube video" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                allowFullScreen
              ></iframe>
            </div>
          </div>
        </section>

        {/* Servicios Section */}
        <section>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
              Nuestros Servicios
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Atención médica integral con especialistas en todas las áreas
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-blue-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-blue-100">
              <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <HeartIcon className="h-9 w-9 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Consulta General</h3>
              <p className="text-gray-600">
                Atención médica integral para toda la familia con profesionales experimentados.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-green-100">
              <div className="bg-green-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <UserGroupIcon className="h-9 w-9 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Especialidades</h3>
              <p className="text-gray-600">
                Cardiología, pediatría, ginecología, traumatología y más especialidades médicas.
              </p>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-purple-100">
              <div className="bg-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <BeakerIcon className="h-9 w-9 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Laboratorio</h3>
              <p className="text-gray-600">
                Análisis clínicos con tecnología avanzada y resultados rápidos y confiables.
              </p>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 border border-red-100">
              <div className="bg-red-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                <ClockIcon className="h-9 w-9 text-white" />
              </div>
              <h3 className="font-bold text-xl mb-3 text-gray-900">Urgencias 24/7</h3>
              <p className="text-gray-600">
                Atención permanente para emergencias con equipo médico disponible las 24 horas.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="mt-20 bg-gradient-to-r from-blue-600 to-blue-700 rounded-3xl p-12 md:p-16 text-center shadow-2xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            ¿Listo para cuidar tu salud?
          </h2>
          <p className="text-blue-100 text-lg mb-8 max-w-2xl mx-auto">
            Únete a miles de pacientes que confían en nosotros para su bienestar
          </p>
          <Link 
            to="/register" 
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
          >
            <CheckCircleIcon className="h-6 w-6" />
            Crear mi cuenta gratis
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="bg-white p-2 rounded-lg">
                  <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
                </div>
                <span className="font-bold text-xl">Clínica San Miguel</span>
              </div>
              <p className="text-gray-400">
                Tu salud es nuestra prioridad. Atención médica de calidad para toda la familia.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-4">Sucursales</h3>
              <ul className="space-y-2 text-gray-400">
                <li>📍 Quito - Av. Principal 123</li>
                <li>📍 Guayaquil - Calle Centro 456</li>
                <li>📍 Cuenca - Av. de las Américas 789</li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-4">Contacto</h3>
              <ul className="space-y-2 text-gray-400">
                <li>📞 (02) 123-4567</li>
                <li>📧 info@clinicasanmiguel.com</li>
                <li>⏰ Lun - Dom: 24/7</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-700 pt-8 text-center text-gray-400 text-sm">
            © {new Date().getFullYear()} Clínica San Miguel — Todos los derechos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}
