import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Clínica San Miguel" className="h-12 w-auto" />
            <span className="text-lg font-semibold">Clínica San Miguel</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-medium text-primary-600 hover:underline">Iniciar sesión</Link>
          </div>
        </div>
      </nav>

      <header className="bg-gradient-to-r from-blue-100 to-white py-20">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">Bienvenido a Clínica San Miguel</h1>
          <p className="text-lg text-gray-700 mb-8">Tu salud es nuestra prioridad. Agenda citas con especialistas, revisa tus resultados y gestiona tu historial médico.</p>
          <div className="flex items-center justify-center gap-4">
            <Link to="/login" className="px-6 py-3 border border-green-500 text-green-600 rounded-lg font-semibold">Iniciar sesión</Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12">
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Nuestras Instalaciones</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded shadow p-4">
              <img src="/fachadaclinicasanmiguel.jpg" alt="fachada" className="w-full h-40 object-cover rounded-md mb-3" />
              <p className="text-gray-700">Clínica de especialidades</p>
            </div>
            <div className="bg-white rounded shadow p-4">
              <img src="/personal.jpg" alt="personal" className="w-full h-40 object-cover rounded-md mb-3" />
              <p className="text-gray-700">Personal Calificado</p>
            </div>
            <div className="bg-white rounded shadow p-4">
              <img src="/instalaciones.jpg" alt="instalaciones" className="w-full h-40 object-cover rounded-md mb-3" />
              <p className="text-gray-700">Instalaciones Modernas</p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Conoce Nuestro Centro</h2>
          <div className="aspect-w-16 aspect-h-9 bg-black rounded">
            <iframe className="w-full h-full rounded" src="https://www.youtube.com/embed/-KId984cnzk?si=2WbrgKUzH22fMds4" title="YouTube video" frameBorder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen></iframe>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-4">Nuestros Servicios</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-semibold mb-2">Consulta General</h3>
              <p className="text-gray-600">Atención médica integral para toda la familia.</p>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-semibold mb-2">Especialidades</h3>
              <p className="text-gray-600">Cardiología, pediatría, ginecología y más.</p>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-semibold mb-2">Laboratorio</h3>
              <p className="text-gray-600">Análisis clínicos con resultados rápidos.</p>
            </div>
            <div className="bg-white p-6 rounded shadow">
              <h3 className="font-semibold mb-2">Urgencias 24/7</h3>
              <p className="text-gray-600">Atención permanente para emergencias.</p>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-white border-t py-6">
        <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-600">
          © {new Date().getFullYear()} Clínica San Miguel — Sucursales: Quito, Guayaquil, Cuenca
        </div>
      </footer>
    </div>
  );
}
