import React, { useEffect, useState } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { appointmentAPI, patientAPI } from '../../services/api';

export default function PatientDashboard(){
  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState([]);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const [apptResp, profileResp] = await Promise.allSettled([
          appointmentAPI.getPatientAppointments(),
          patientAPI.getProfile()
        ]);

        if (apptResp.status === 'fulfilled') {
          setAppointments(apptResp.value.data || []);
        }

        if (profileResp.status === 'fulfilled') {
          setProfile(profileResp.value.data || profileResp.value);
        }

      } catch (err) {
        console.error('Error cargando dashboard paciente:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <PatientLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Bienvenido{profile?.first_name ? `, ${profile.first_name}` : ''}</h1>
        <p className="text-gray-600">Revisa tus próximas citas y tu historial médico.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-semibold text-lg mb-2">Próximas citas</h3>
          {loading ? (
            <div className="text-sm text-gray-500">Cargando...</div>
          ) : (
            <ul className="space-y-3">
              {appointments.length === 0 && <li className="text-sm text-gray-500">No hay citas próximas.</li>}
              {appointments.slice(0,3).map((a) => (
                <li key={a.id} className="border p-3 rounded">
                  <div className="font-medium">{a.doctor?.first_name} {a.doctor?.last_name} - {a.doctor?.specialty?.name}</div>
                  <div className="text-sm text-gray-600">{new Date(a.start_time || a.date).toLocaleString()}</div>
                  <div className="text-sm text-gray-500">Estado: {a.status}</div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white p-4 rounded shadow md:col-span-2">
          <h3 className="font-semibold text-lg mb-2">Resumen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Citas totales</div>
              <div className="text-2xl font-bold">{appointments.length}</div>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <div className="text-sm text-gray-600">Última visita</div>
              <div className="text-2xl font-bold">{appointments[0] ? new Date(appointments[0].start_time || appointments[0].date).toLocaleDateString() : '—'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-lg mb-2">Accesos rápidos</h3>
        <div className="flex gap-4 flex-wrap">
          <a href="/patient/appointments" className="px-4 py-3 bg-primary-600 text-white rounded">Ver mis citas</a>
          <a href="/patient/medical-record" className="px-4 py-3 border border-gray-200 rounded">Historial Médico</a>
          <a href="/patient/profile" className="px-4 py-3 border border-gray-200 rounded">Editar Perfil</a>
        </div>
      </div>
    </PatientLayout>
  );
}
