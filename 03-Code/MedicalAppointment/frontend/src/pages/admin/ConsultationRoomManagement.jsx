import React, { useState, useEffect } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import {
  BuildingOffice2Icon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';
import { crudApi } from '../../services/httpClient';

export default function ConsultationRoomManagement() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [notification, setNotification] = useState(null);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    room_number: '',
    floor: '',
    building: '',
    capacity: 1,
    equipment: '',
    is_available: true,
    notes: '',
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const response = await crudApi.get('/consultation-rooms');
      setRooms(response.data.data || response.data || []);
    } catch (error) {
      console.error('Error loading rooms:', error);
      showNotification('Error al cargar las salas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalMode === 'create') {
        await crudApi.post('/consultation-rooms', formData);
        showNotification('Sala creada exitosamente', 'success');
      } else {
        await crudApi.put(`/consultation-rooms/${selectedRoom.id}`, formData);
        showNotification('Sala actualizada exitosamente', 'success');
      }
      setShowModal(false);
      resetForm();
      loadRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      showNotification('Error al guardar la sala', 'error');
    }
  };

  const handleEdit = (room) => {
    setSelectedRoom(room);
    setFormData({
      name: room.name || '',
      room_number: room.room_number || '',
      floor: room.floor || '',
      building: room.building || '',
      capacity: room.capacity || 1,
      equipment: room.equipment || '',
      is_available: room.is_available !== false,
      notes: room.notes || '',
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleDelete = async (roomId) => {
    if (!confirm('¿Está seguro de eliminar esta sala?')) return;
    
    try {
      await crudApi.delete(`/consultation-rooms/${roomId}`);
      showNotification('Sala eliminada', 'success');
      loadRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      showNotification('Error al eliminar la sala', 'error');
    }
  };

  const toggleAvailability = async (room) => {
    try {
      await crudApi.put(`/consultation-rooms/${room.id}`, {
        is_available: !room.is_available
      });
      loadRooms();
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      room_number: '',
      floor: '',
      building: '',
      capacity: 1,
      equipment: '',
      is_available: true,
      notes: '',
    });
    setSelectedRoom(null);
    setModalMode('create');
  };

  const showNotification = (message, type = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const filteredRooms = rooms.filter(room =>
    room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    room.building?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    total: rooms.length,
    available: rooms.filter(r => r.is_available).length,
    unavailable: rooms.filter(r => !r.is_available).length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Notification */}
        {notification && (
          <div className={`p-4 rounded-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Salas de Consulta</h2>
            <p className="text-gray-600">Gestiona las salas disponibles para consultas</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <PlusIcon className="w-5 h-5" />
            Nueva Sala
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-full">
                <BuildingOffice2Icon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Salas</p>
                <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-full">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Disponibles</p>
                <p className="text-2xl font-bold text-green-600">{stats.available}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full">
                <XCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">No Disponibles</p>
                <p className="text-2xl font-bold text-red-600">{stats.unavailable}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar salas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Rooms Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredRooms.map((room) => (
              <div key={room.id} className="bg-white rounded-lg shadow-md p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${room.is_available ? 'bg-green-100' : 'bg-red-100'}`}>
                      <BuildingOffice2Icon className={`w-6 h-6 ${room.is_available ? 'text-green-600' : 'text-red-600'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">{room.name}</h3>
                      <p className="text-sm text-gray-500">Sala {room.room_number}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    room.is_available 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {room.is_available ? 'Disponible' : 'No Disponible'}
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  {room.floor && <p><span className="font-medium">Piso:</span> {room.floor}</p>}
                  {room.building && <p><span className="font-medium">Edificio:</span> {room.building}</p>}
                  {room.capacity && <p><span className="font-medium">Capacidad:</span> {room.capacity} personas</p>}
                  {room.equipment && (
                    <p><span className="font-medium">Equipamiento:</span> {room.equipment}</p>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t">
                  <button
                    onClick={() => toggleAvailability(room)}
                    className={`flex-1 px-3 py-2 text-sm rounded-lg transition ${
                      room.is_available 
                        ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                        : 'bg-green-50 text-green-600 hover:bg-green-100'
                    }`}
                  >
                    {room.is_available ? 'Marcar No Disponible' : 'Marcar Disponible'}
                  </button>
                  <button
                    onClick={() => handleEdit(room)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}

            {filteredRooms.length === 0 && (
              <div className="col-span-full text-center py-12 text-gray-500">
                <BuildingOffice2Icon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No se encontraron salas</p>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full m-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  {modalMode === 'create' ? 'Nueva Sala' : 'Editar Sala'}
                </h3>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Número de Sala
                      </label>
                      <input
                        type="text"
                        value={formData.room_number}
                        onChange={(e) => setFormData({...formData, room_number: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Piso
                      </label>
                      <input
                        type="text"
                        value={formData.floor}
                        onChange={(e) => setFormData({...formData, floor: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Edificio
                      </label>
                      <input
                        type="text"
                        value={formData.building}
                        onChange={(e) => setFormData({...formData, building: e.target.value})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Capacidad
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData({...formData, capacity: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Equipamiento
                    </label>
                    <textarea
                      value={formData.equipment}
                      onChange={(e) => setFormData({...formData, equipment: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                      placeholder="Ej: Camilla, Esfigmomanómetro, Estetoscopio..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notas
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({...formData, notes: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="is_available"
                      checked={formData.is_available}
                      onChange={(e) => setFormData({...formData, is_available: e.target.checked})}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <label htmlFor="is_available" className="text-sm text-gray-700">
                      Sala disponible para consultas
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      {modalMode === 'create' ? 'Crear' : 'Guardar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
