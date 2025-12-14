const supabase = require('../database');

const consultationRoomController = {
  // Get all available consultation rooms
  getAvailableRooms: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('consultation_rooms')
        .select('*')
        .eq('is_available', true)
        .order('name', { ascending: true });

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get all consultation rooms (admin)
  getAllRooms: async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('consultation_rooms')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error('Error fetching rooms:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Get room by ID
  getRoomById: async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('consultation_rooms')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Sala no encontrada' });
      }

      res.json(data);
    } catch (error) {
      console.error('Error fetching room:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Create new room (admin)
  createRoom: async (req, res) => {
    try {
      const { name, room_number, capacity = 2, floor, equipment, notes } = req.body;

      if (!name || !room_number) {
        return res.status(400).json({ 
          error: 'El nombre y número de sala son requeridos' 
        });
      }

      const { data, error } = await supabase
        .from('consultation_rooms')
        .insert([{
          name,
          room_number,
          capacity,
          floor,
          equipment: equipment || [],
          notes,
          is_available: true
        }])
        .select()
        .single();

      if (error) throw error;

      res.status(201).json({
        message: 'Sala creada exitosamente',
        room: data
      });
    } catch (error) {
      console.error('Error creating room:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Update room (admin)
  updateRoom: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, room_number, capacity, floor, equipment, notes, is_available } = req.body;

      const { data, error } = await supabase
        .from('consultation_rooms')
        .update({
          name,
          room_number,
          capacity,
          floor,
          equipment,
          notes,
          is_available,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      res.json({
        message: 'Sala actualizada exitosamente',
        room: data
      });
    } catch (error) {
      console.error('Error updating room:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // Delete room (admin)
  deleteRoom: async (req, res) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('consultation_rooms')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({ message: 'Sala eliminada exitosamente' });
    } catch (error) {
      console.error('Error deleting room:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = consultationRoomController;
