import React, { useEffect, useState } from 'react';
import PatientLayout from '../../layouts/PatientLayout';
import { appointmentAPI } from '../../services/api';

export default function PatientAppointments(){
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await appointmentAPI.getPatientAppointments();
        setAppointments(res.data || res.data?.appointments || []);
      } catch (err) {
        console.error('Error cargando citas:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <PatientLayout>
      <div>
        <h1 className="text-2xl font-bold mb-4">Mis Citas</h1>
        {loading ? (
          <div>Cargando citas...</div>
        ) : (
          <div className="space-y-4">
            {appointments.length === 0 && <div className="text-sm text-gray-500">No hay citas programadas.</div>}
            {appointments.map(a => (
              <div key={a.id} className="bg-white p-4 rounded shadow">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{a.doctor?.first_name} {a.doctor?.last_name}</div>
                    <div className="text-sm text-gray-600">{a.doctor?.specialty?.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">{new Date(a.start_time || a.date).toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Estado: {a.status}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PatientLayout>
  );
}