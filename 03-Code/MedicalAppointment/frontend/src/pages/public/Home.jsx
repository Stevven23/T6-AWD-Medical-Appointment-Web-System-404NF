import React from 'react';
import { Link } from 'react-router-dom';
import { 
  HeartIcon, 
  UserGroupIcon, 
  BeakerIcon, 
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Navbar */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/logo.png" 
                alt="Clínica San Miguel" 
                className="h-10 w-auto object-contain"
              />
              <div>
                <span className="text-xl font-bold text-gray-900 leading-none block">
                  Clínica San Miguel
                </span>
                <p className="text-xs text-blue-600 font-medium mt-1">Tu salud, nuestra prioridad</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link 
                to="/register" 
                className="hidden sm:inline-flex px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-blue-600 transition-colors"
              >
                Registrarse
              </Link>
              <Link 
                to="/login" 
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="relative overflow-hidden bg-white pt-10 pb-24 lg:pt-20 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Texto Hero */}
            <div className="text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold mb-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                </span>
                Atención disponible 24/7
              </div>
              
              <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 leading-tight">
                Cuidamos de tu familia como si fuera <span className="text-blue-600">la nuestra</span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Agenda citas con especialistas, revisa resultados y gestiona tu historial médico en un entorno seguro y amigable.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                <Link 
                  to="/register" 
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-200 hover:shadow-2xl hover:bg-blue-700 hover:-translate-y-1 transition-all text-center"
                >
                  Agendar Cita Ahora
                </Link>
                <Link 
                  to="/login" 
                  className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-lg hover:border-blue-600 hover:text-blue-600 transition-all text-center"
                >
                  Ya tengo cuenta
                </Link>
              </div>
            </div>

            {/* Ilustración Hero */}
            <div className="relative mx-auto lg:ml-auto w-full max-w-lg lg:max-w-full">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[110%] h-[110%] bg-gradient-to-tr from-blue-100/60 to-purple-100/60 rounded-full blur-3xl -z-10"></div>
               <img 
                 src="/hero-welcome.png" 
                 alt="Doctor pediatra atendiendo a familia" 
                 className="w-full h-auto drop-shadow-xl hover:scale-105 transition-transform duration-700"
               />
            </div>
          </div>
        </div>
      </header>

      {/* --- FEATURES SECTION --- */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 mb-24 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-50 hover:-translate-y-2 transition-all text-center group">
            <img src="/feat-booking.png" alt="Calendario" className="h-28 w-auto mx-auto mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-xl text-gray-900 mb-2">Agenda Fácil</h3>
            <p className="text-gray-500">Reserva tus citas 100% online en segundos.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-50 hover:-translate-y-2 transition-all text-center group">
            <img src="/feat-records.png" alt="Historial" className="h-28 w-auto mx-auto mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-xl text-gray-900 mb-2">Historial Digital</h3>
            <p className="text-gray-500">Accede a tu información médica centralizada.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-50 hover:-translate-y-2 transition-all text-center group">
            <img src="/feat-results.png" alt="Resultados" className="h-28 w-auto mx-auto mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-xl text-gray-900 mb-2">Resultados Online</h3>
            <p className="text-gray-500">Consulta tus exámenes de laboratorio al instante.</p>
          </div>
          <div className="bg-white rounded-2xl p-8 shadow-xl shadow-gray-200/50 border border-gray-50 hover:-translate-y-2 transition-all text-center group">
            <img src="/feat-security.png" alt="Seguridad" className="h-28 w-auto mx-auto mb-6 group-hover:scale-110 transition-transform" />
            <h3 className="font-bold text-xl text-gray-900 mb-2">Seguro y Privado</h3>
            <p className="text-gray-500">Protección total de tus datos personales.</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Instalaciones Section */}
        <section className="mb-24">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4 text-gray-900">Nuestras Instalaciones</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Infraestructura moderna diseñada para tu confort</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
              <img src="/fachadaclinicasanmiguel.jpg" alt="fachada" className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="p-6 bg-white">
                <h3 className="font-bold text-lg mb-2">Clínica Central</h3>
                <p className="text-gray-500 text-sm">Ubicación estratégica y accesible</p>
              </div>
            </div>
            <div className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
              <img src="/personal.jpg" alt="personal" className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="p-6 bg-white">
                <h3 className="font-bold text-lg mb-2">Equipo Médico</h3>
                <p className="text-gray-500 text-sm">Especialistas certificados</p>
              </div>
            </div>
            <div className="group rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all">
              <img src="/instalaciones.jpg" alt="equipos" className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-500" />
              <div className="p-6 bg-white">
                <h3 className="font-bold text-lg mb-2">Tecnología</h3>
                <p className="text-gray-500 text-sm">Equipamiento de última generación</p>
              </div>
            </div>
          </div>
        </section>

        {/* Servicios Section */}
        <section className="mb-24">
          <div className="text-center mb-12">
             <h2 className="text-3xl font-bold mb-4 text-gray-900">Especialidades Médicas</h2>
             <p className="text-gray-600 max-w-xl mx-auto">Atención integral cubriendo todas tus necesidades de salud.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: HeartIcon, title: "Cardiología", color: "blue" },
              { icon: UserGroupIcon, title: "Pediatría", color: "green" },
              { icon: BeakerIcon, title: "Laboratorio", color: "purple" },
              { icon: ClockIcon, title: "Urgencias", color: "red" }
            ].map((service, idx) => (
              <div key={idx} className={`p-8 rounded-2xl bg-white shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-b-4 border-${service.color}-500 group`}>
                <div className={`w-14 h-14 rounded-xl bg-${service.color}-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <service.icon className={`h-8 w-8 text-${service.color}-600`} />
                </div>
                <h3 className="font-bold text-xl mb-3 text-gray-900">{service.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Atención especializada con los mejores profesionales y tecnología.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* --- CTA SECTION CORREGIDO --- */}
        {/* CORRECCIÓN 1: items-center para centrar verticalmente la imagen */}
        <section className="relative overflow-hidden bg-blue-600 rounded-3xl shadow-2xl my-20">
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-10"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center relative z-10 p-12 md:p-16">
            
            {/* Texto CTA */}
            <div className="text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 leading-tight">
                Tu tiempo es valioso,<br />agenda en segundos
              </h2>
              <p className="text-blue-100 text-lg mb-8 max-w-md mx-auto md:mx-0">
                Nuestro sistema inteligente te permite encontrar el horario perfecto con tu doctor preferido al instante.
              </p>
              <Link 
                to="/register" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 rounded-xl font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all"
              >
                <CheckCircleIcon className="h-6 w-6" />
                Agendar mi cita
              </Link>
            </div>

            {/* Ilustración CTA */}
            {/* Como la imagen tiene fondo blanco, le añadimos bordes redondeados (rounded-2xl) para que parezca una tarjeta */}
            <div className="relative flex justify-center md:justify-end">
              <img 
                src="/cta-schedule.png" 
                alt="Doctor feliz señalando calendario" 
                className="w-full max-w-md h-auto object-contain rounded-2xl shadow-lg hover:rotate-2 transition-transform duration-500"
              />
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-3 mb-6">
                 {/* CORRECCIÓN 2: Eliminado el filtro 'brightness-0 invert' para que se vea el logo original */}
                 <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Comprometidos con la excelencia médica y el trato humano.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6">Accesos Rápidos</h3>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">Portal de Pacientes</Link></li>
                <li><Link to="/register" className="hover:text-white transition-colors">Crear Cuenta</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">Contacto</h3>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li>Av. Principal 123, Quito</li>
                <li>(02) 123-4567</li>
                <li>info@clinicasanmiguel.com</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6">Horarios</h3>
              <ul className="space-y-3 text-gray-400 text-sm">
                <li className="flex justify-between w-32"><span>Lun - Vie:</span> <span>24h</span></li>
                <li className="flex justify-between w-32"><span>Sáb - Dom:</span> <span>Urgencias</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>© {new Date().getFullYear()} Clínica San Miguel. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}