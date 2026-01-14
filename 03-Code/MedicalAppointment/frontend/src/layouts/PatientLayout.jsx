import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function PatientLayout({ children }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Clínica San Miguel" className="h-10 w-auto" />
            <span className="font-semibold">Clínica San Miguel</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.first_name} {user?.last_name}</span>
            <button onClick={logout} className="text-sm text-red-600 hover:underline">Cerrar sesión</button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-6 gap-6">
        <aside className="md:col-span-1 bg-white p-4 rounded shadow">
          <nav className="space-y-2">
            <Link to="/patient/dashboard" className="block font-medium text-gray-700 hover:text-primary-600">Inicio</Link>
            <Link to="/patient/appointments" className="block font-medium text-gray-700 hover:text-primary-600">Mis citas</Link>
            <Link to="/patient/medical-record" className="block font-medium text-gray-700 hover:text-primary-600">Historial Médico</Link>
            <Link to="/patient/profile" className="block font-medium text-gray-700 hover:text-primary-600">Mi perfil</Link>
            <Link to="/" className="block text-sm text-gray-500 mt-4">Volver a Inicio</Link>
          </nav>
        </aside>

        <main className="md:col-span-5">
          {children}
        </main>
      </div>

      <footer className="bg-white border-t py-6 mt-8">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} Clínica San Miguel
        </div>
      </footer>
    </div>
  );
}
