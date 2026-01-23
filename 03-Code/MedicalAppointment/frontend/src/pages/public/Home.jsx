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
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="bg-white/95 backdrop-blur-sm shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-2 rounded-xl shadow-lg">
                <img 
                  src="/logo.png" 
                  alt="Clínica San Miguel" 
                  className="h-8 w-auto object-contain brightness-0 invert"
                />
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">
                  Clínica San Miguel
                </span>
                <p className="text-xs text-blue-600 font-medium">Tu salud, nuestra prioridad</p>
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

      {/* --- HERO SECTION MODIFICADO (Imagen: hero-welcome.png) --- */}
      <header className="relative overflow-hidden bg-gradient-to-b from-blue-50/50 to-white pt-10 pb-20 lg:pt-20 lg:pb-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Columna Izquierda: Texto y Valor */}
            <div className="text-center lg:text-left space-y-8 z-10">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold mb-4">
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
                Agenda citas con especialistas pediátricos y generales, revisa resultados y gestiona tu historial médico sin filas ni esperas.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link 
                  to="/register" 
                  className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-xl shadow-blue-200 hover:shadow-2xl hover:bg-blue-700 hover:-translate-y-1 transition-all text-center"
                >
                  Agendar Cita Ahora
                </Link>
                <Link 
                  to="/login" 
                  className="w-full sm:w-auto px-8 py-4 bg-white border-2 border-gray-100 text-gray-700 rounded-xl font-bold text-lg hover:border-blue-600 hover:text-blue-600 transition-all text-center"
                >
                  Ya tengo cuenta
                </Link>
              </div>

              <div className="pt-4 flex items-center justify-center lg:justify-start gap-4 text-sm text-gray-500">
                <div className="flex -space-x-2">
                   {/* Avatares fake para prueba social */}
                   <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
                   <div className="w-8 h-8 rounded-full bg-gray-400 border-2 border-white"></div>
                   <div className="w-8 h-8 rounded-full bg-gray-500 border-2 border-white"></div>
                </div>
                <p>+2,000 Pacientes confían en nosotros</p>
              </div>
            </div>

            {/* Columna Derecha: ILUSTRACIÓN HERO */}
            <div className="relative mx-auto lg:ml-auto w-full max-w-lg lg:max-w-full">
               {/* Círculo decorativo detrás de la imagen */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-blue-100/50 rounded-full blur-3xl -z-10"></div>
               
               <img 
                 src="/hero-welcome.png" 
                 alt="Doctor pediatra atendiendo a una madre y su hijo en consultorio amigable" 
                 className="w-full h-auto drop-shadow-xl hover:scale-105 transition-transform duration-700"
               />
            </div>
          </div>
        </div>
      </header>

      {/* Features Cards - Flotando un poco sobre el header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 mb-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-100 border border-gray-50 hover:-translate-y-1 transition-all">
            <div className="bg-blue-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <CalendarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Agenda Fácil</h3>
            <p className="text-gray-500 text-sm">Reserva 100% online</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-100 border border-gray-50 hover:-translate-y-1 transition-all">
            <div className="bg-green-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <DocumentTextIcon className="h-6 w-6 text-green-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Historial Digital</h3>
            <p className="text-gray-500 text-sm">Tus datos seguros</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-100 border border-gray-50 hover:-translate-y-1 transition-all">
            <div className="bg-purple-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <BeakerIcon className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Resultados</h3>
            <p className="text-gray-500 text-sm">Consulta online</p>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-xl shadow-gray-100 border border-gray-50 hover:-translate-y-1 transition-all">
            <div className="bg-red-50 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
              <ShieldCheckIcon className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-1">Privacidad</h3>
            <p className="text-gray-500 text-sm">Protección total</p>
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
            {/* Cards de instalaciones (igual que antes pero con diseño limpio) */}
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
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-4 text-gray-900">Especialidades Médicas</h2>
              <p className="text-gray-600 max-w-xl">Atención integral cubriendo todas tus necesidades de salud en un solo lugar.</p>
            </div>
            <button className="text-blue-600 font-semibold hover:text-blue-700 flex items-center gap-2">
              Ver todos los servicios <span>→</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: HeartIcon, title: "Cardiología", color: "blue" },
              { icon: UserGroupIcon, title: "Pediatría", color: "green" },
              { icon: BeakerIcon, title: "Laboratorio", color: "purple" },
              { icon: ClockIcon, title: "Urgencias", color: "red" }
            ].map((service, idx) => (
              <div key={idx} className={`p-8 rounded-2xl bg-${service.color}-50 hover:bg-white hover:shadow-xl transition-all duration-300 border border-transparent hover:border-${service.color}-100 group`}>
                <service.icon className={`h-10 w-10 text-${service.color}-600 mb-6 group-hover:scale-110 transition-transform`} />
                <h3 className="font-bold text-xl mb-3 text-gray-900">{service.title}</h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Atención especializada con los mejores profesionales y tecnología de diagnóstico.
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* --- CTA SECTION MODIFICADO (Imagen: cta-schedule.png) --- */}
        <section className="relative overflow-hidden bg-blue-600 rounded-3xl shadow-2xl my-20">
          {/* Fondo decorativo */}
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 items-center relative z-10">
            {/* Texto CTA */}
            <div className="p-12 md:p-16 text-center md:text-left">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
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
            <div className="flex justify-center md:justify-end px-8 md:px-0 pt-0 md:pt-8 pb-8 md:pb-0">
              <img 
                src="/cta-schedule.png" 
                alt="Doctor feliz señalando un calendario y reloj gigante" 
                className="w-3/4 md:w-full max-w-md h-auto object-contain transform md:translate-y-4 hover:rotate-2 transition-transform duration-500 drop-shadow-2xl"
              />
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white pt-16 pb-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-1 md:col-span-1">
              <div className="bg-white p-2 rounded-lg w-fit mb-6">
                <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Comprometidos con la excelencia médica y el trato humano. Tu salud en buenas manos.
              </p>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6">Pacientes</h3>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><Link to="/login" className="hover:text-white transition-colors">Portal de Pacientes</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Agendar Cita</Link></li>
                <li><Link to="#" className="hover:text-white transition-colors">Preguntas Frecuentes</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-lg mb-6">Contacto</h3>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li>Av. Principal 123, Quito</li>
                <li>(02) 123-4567</li>
                <li>info@clinicasanmiguel.com</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-bold text-lg mb-6">Horarios</h3>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li className="flex justify-between"><span>Lun - Vie</span> <span>24 Horas</span></li>
                <li className="flex justify-between"><span>Sábados</span> <span>24 Horas</span></li>
                <li className="flex justify-between"><span>Domingos</span> <span>Urgencias</span></li>
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