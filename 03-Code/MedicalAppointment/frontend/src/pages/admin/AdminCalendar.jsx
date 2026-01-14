import React, { useEffect, useState } from 'react';

function getMonthDays(year, month) {
  const date = new Date(year, month, 1);
  const days = [];
  const firstDayIndex = date.getDay();
  date.setDate(date.getDate() - firstDayIndex);
  for (let i = 0; i < 42; i++) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

export default function AdminCalendar() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [specialties, setSpecialties] = useState([]);
  const [filters, setFilters] = useState({ doctor_id: '', specialty_id: '', status: '' });
  const [current, setCurrent] = useState(new Date());

  useEffect(() => {
    fetchDoctors();
    fetchSpecialties();
    loadAppointments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchDoctors = async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('/api/doctors', { headers: { Authorization: token ? `Bearer ${token}` : undefined } });
      if (!resp.ok) return;
      const data = await resp.json();
      setDoctors(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSpecialties = async () => {
    try {
      const token = localStorage.getItem('token');
      const resp = await fetch('/api/specialty/active', { headers: { Authorization: token ? `Bearer ${token}` : undefined } });
      if (!resp.ok) return;
      const data = await resp.json();
      setSpecialties(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadAppointments = async (extraParams = {}) => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ ...extraParams });
      const resp = await fetch(`/api/appointments?${params.toString()}`, { headers: { Authorization: token ? `Bearer ${token}` : undefined } });
      if (!resp.ok) throw new Error('Error al cargar citas');
      const data = await resp.json();
      setAppointments(data || []);
    } catch (err) {
      setError(err.message || 'Error cargando citas');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    const q = {};
    if (filters.doctor_id) q.doctorId = filters.doctor_id;
    if (filters.specialty_id) q.specialtyId = filters.specialty_id;
    if (filters.status) q.status = filters.status;
    loadAppointments(q);
  };

  const days = getMonthDays(current.getFullYear(), current.getMonth());
  const countsByDay = {};
  appointments.forEach((a) => {
    const d = new Date(a.date || a.start_time || a.scheduled_at);
    const key = d.toISOString().split('T')[0];
    countsByDay[key] = (countsByDay[key] || 0) + 1;
  });

  const summary = appointments.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold">Calendario de Citas (Admin)</h2>
        <div className="flex gap-2">
          <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1))} className="px-3 py-1 border rounded">Prev</button>
          <button onClick={() => setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1))} className="px-3 py-1 border rounded">Next</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Confirmadas</div>
          <div className="text-2xl font-bold">{summary.confirmed || 0}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Pendientes</div>
          <div className="text-2xl font-bold">{summary.pending || 0}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Canceladas</div>
          <div className="text-2xl font-bold">{summary.cancelled || summary.canceled || 0}</div>
        </div>
        <div className="p-4 bg-white rounded shadow">
          <div className="text-sm text-gray-500">Total</div>
          <div className="text-2xl font-bold">{appointments.length}</div>
        </div>
      </div>

      <div className="bg-white p-4 rounded shadow mb-6">
        <div className="flex gap-3 items-center">
          <select value={filters.doctor_id} onChange={(e) => setFilters((s) => ({ ...s, doctor_id: e.target.value }))} className="border p-2 rounded">
            <option value="">Todos los doctores</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
            ))}
          </select>

          <select value={filters.specialty_id} onChange={(e) => setFilters((s) => ({ ...s, specialty_id: e.target.value }))} className="border p-2 rounded">
            <option value="">Todas las especialidades</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <select value={filters.status} onChange={(e) => setFilters((s) => ({ ...s, status: e.target.value }))} className="border p-2 rounded">
            <option value="">Todos los estados</option>
            <option value="confirmed">Confirmada</option>
            <option value="pending">Pendiente</option>
            <option value="cancelled">Cancelada</option>
          </select>

          <button onClick={applyFilters} className="bg-blue-600 text-white px-3 py-2 rounded">Aplicar</button>
        </div>
      </div>

      {loading && <div>Cargando citas...</div>}
      {error && <div className="text-red-600">{error}</div>}

      <div className="grid grid-cols-7 gap-2">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((d) => (
          <div key={d} className="text-center font-semibold">{d}</div>
        ))}

        {days.map((day) => {
          const key = day.toISOString().split('T')[0];
          const count = countsByDay[key] || 0;
          const isCurrentMonth = day.getMonth() === current.getMonth();
          return (
            <div key={key} className={`p-2 h-24 border rounded ${isCurrentMonth ? '' : 'opacity-50'}`}>
              <div className="text-sm text-gray-500">{day.getDate()}</div>
              {count > 0 && <div className="mt-2 bg-blue-100 text-blue-700 text-xs inline-block px-2 py-1 rounded">{count} citas</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}