import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  CalendarIcon,
  DocumentTextIcon,
  BeakerIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  EnvelopeIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { useState } from 'react';

export default function PatientLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    if (window.confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      await logout();
      navigate('/login');
    }
  };

  const menuItems = [
    { 
      path: '/patient/dashboard', 
      icon: HomeIcon, 
      label: 'Inicio' 
    },
    { 
      path: '/patient/appointments', 
      icon: CalendarIcon, 
      label: 'Mis Citas' 
    },
    { 
      path: '/patient/history', 
      icon: ClipboardDocumentListIcon, 
      label: 'Historial Médico' 
    },
    { 
      path: '/patient/lab', 
      icon: BeakerIcon, 
      label: 'Resultados de Lab' 
    },
    { 
      path: '/patient/prescriptions', 
      icon: DocumentTextIcon, 
      label: 'Recetas Médicas' 
    },
    { 
      path: '/patient/messages', 
      icon: EnvelopeIcon, 
      label: 'Mensajes' 
    },
    { 
      path: '/patient/profile', 
      icon: UserCircleIcon, 
      label: 'Mi Perfil' 
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar para Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-gradient-to-b from-blue-600 to-blue-700 pt-5 pb-4 overflow-y-auto">
          {/* Logo con Imagen - MÁS GRANDE */}
          <div className="flex items-center justify-center flex-shrink-0 px-4 mb-8">
            <div className="bg-white p-5 rounded-2xl shadow-lg w-full">
              <img 
                src="/logo.png" 
                alt="Clínica San Miguel" 
                className="h-20 w-full object-contain"
              />
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center px-4 mb-6">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 w-full border border-white/30">
              <div className="flex items-center gap-3">
                <div className="bg-white text-blue-600 rounded-full p-2 w-12 h-12 flex items-center justify-center font-bold text-lg">
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-blue-100 truncate">Paciente</p>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path || 
                             location.pathname.startsWith(item.path + '/');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-lg'
                      : 'text-blue-100 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-3 flex-shrink-0 h-6 w-6 ${
                      isActive ? 'text-blue-600' : 'text-blue-200'
                    }`}
                    aria-hidden="true"
                  />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="flex-shrink-0 px-2 pb-4">
            <button
              onClick={handleLogout}
              className="group flex w-full items-center px-3 py-3 text-sm font-medium text-blue-100 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-200"
            >
              <ArrowRightOnRectangleIcon
                className="mr-3 flex-shrink-0 h-6 w-6"
                aria-hidden="true"
              />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <img 
              src="/logo.png" 
              alt="Clínica San Miguel" 
              className="h-10 object-contain"
            />
          </div>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
          >
            {sidebarOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 flex w-64 flex-col z-50 lg:hidden">
            <div className="flex flex-col flex-grow bg-gradient-to-b from-blue-600 to-blue-700 pt-20 pb-4 overflow-y-auto">
              {/* Logo con Imagen en Mobile - MÁS GRANDE */}
              <div className="flex items-center justify-center flex-shrink-0 px-4 mb-6">
                <div className="bg-white p-4 rounded-2xl shadow-lg w-full">
                  <img 
                    src="/logo.png" 
                    alt="Clínica San Miguel" 
                    className="h-16 w-full object-contain"
                  />
                </div>
              </div>

              {/* User Info */}
              <div className="flex items-center px-4 mb-6">
                <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 w-full border border-white/30">
                  <div className="flex items-center gap-3">
                    <div className="bg-white text-blue-600 rounded-full p-2 w-12 h-12 flex items-center justify-center font-bold text-lg">
                      {user?.first_name?.[0]}{user?.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-blue-100 truncate">Paciente</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 px-2 space-y-1">
                {menuItems.map((item) => {
                  const isActive = location.pathname === item.path ||
                                 location.pathname.startsWith(item.path + '/');
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setSidebarOpen(false)}
                      className={`group flex items-center px-3 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-white text-blue-600 shadow-lg'
                          : 'text-blue-100 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-6 w-6 ${
                          isActive ? 'text-blue-600' : 'text-blue-200'
                        }`}
                        aria-hidden="true"
                      />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              {/* Logout Button */}
              <div className="flex-shrink-0 px-2 pb-4">
                <button
                  onClick={handleLogout}
                  className="group flex w-full items-center px-3 py-3 text-sm font-medium text-blue-100 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-200"
                >
                  <ArrowRightOnRectangleIcon
                    className="mr-3 flex-shrink-0 h-6 w-6"
                    aria-hidden="true"
                  />
                  Cerrar Sesión
                </button>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <div className="lg:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6 px-4 sm:px-6 lg:px-8 pt-20 lg:pt-6">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600">
            <p>
              © {new Date().getFullYear()} MediCare - Sistema de Gestión de Citas Médicas
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
