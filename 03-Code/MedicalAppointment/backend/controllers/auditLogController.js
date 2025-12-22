// controllers/auditLogController.js
const supabase = require('../database');

const auditLogController = {
  // GET /api/audit-logs - Obtener logs con filtros
  getAuditLogs: async (req, res) => {
    try {
      const { 
        userId, 
        action, 
        tableName, 
        startDate, 
        endDate,
        limit = 100,
        offset = 0
      } = req.query;

      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(id, first_name, last_name, email)
        `, { count: 'exact' })
        .order('timestamp', { ascending: false });

      // Aplicar filtros
      if (userId) {
        query = query.eq('user_id', userId);
      }

      if (action) {
        query = query.eq('action', action);
      }

      if (tableName) {
        query = query.eq('table_name', tableName);
      }

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }

      if (endDate) {
        query = query.lte('timestamp', endDate + 'T23:59:59');
      }

      // Paginación
      query = query.range(offset, parseInt(offset) + parseInt(limit) - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      res.json({
        logs: data || [],
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
    } catch (error) {
      console.error('Error obteniendo logs de auditoría:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/audit-logs/:id - Obtener log por ID
  getAuditLogById: async (req, res) => {
    try {
      const { id } = req.params;

      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(id, first_name, last_name, email, role_id)
        `)
        .eq('id', id)
        .single();

      if (error || !data) {
        return res.status(404).json({ error: 'Log de auditoría no encontrado' });
      }

      res.json(data);
    } catch (error) {
      console.error('Error obteniendo log de auditoría:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // POST /api/audit-logs - Crear entrada de auditoría manual
  createAuditLog: async (req, res) => {
    try {
      const {
        action,
        table_name,
        record_id,
        old_values,
        new_values,
        description,
        ip_address,
        user_agent
      } = req.body;

      const userId = req.user.id;

      if (!action) {
        return res.status(400).json({ error: 'La acción es requerida' });
      }

      const { data, error } = await supabase
        .from('audit_logs')
        .insert([{
          user_id: userId,
          action,
          table_name,
          record_id,
          old_values,
          new_values,
          description,
          ip_address: ip_address || req.ip,
          user_agent: user_agent || req.get('user-agent')
        }])
        .select(`
          *,
          user:users(id, first_name, last_name, email)
        `)
        .single();

      if (error) throw error;

      res.status(201).json({
        message: 'Log de auditoría creado exitosamente',
        log: data
      });
    } catch (error) {
      console.error('Error creando log de auditoría:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/audit-logs/stats - Obtener estadísticas de auditoría
  getAuditStats: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;

      let query = supabase.from('audit_logs').select('action, user_id');

      if (startDate) {
        query = query.gte('timestamp', startDate);
      }

      if (endDate) {
        query = query.lte('timestamp', endDate + 'T23:59:59');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Calcular estadísticas
      const actionCounts = {};
      const userCounts = {};

      data.forEach(log => {
        actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
        userCounts[log.user_id] = (userCounts[log.user_id] || 0) + 1;
      });

      const topActions = Object.entries(actionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([action, count]) => ({ action, count }));

      const topUsers = Object.entries(userCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([userId, count]) => ({ userId, count }));

      res.json({
        total: data.length,
        topActions,
        topUsers,
        period: { startDate, endDate }
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas de auditoría:', error);
      res.status(500).json({ error: error.message });
    }
  },

  // GET /api/audit-logs/user/:userId - Obtener logs de un usuario específico
  getUserAuditLogs: async (req, res) => {
    try {
      const { userId } = req.params;
      const { limit = 50 } = req.query;

      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user:users(id, first_name, last_name, email)
        `)
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(limit);

      if (error) throw error;

      res.json(data || []);
    } catch (error) {
      console.error('Error obteniendo logs del usuario:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = auditLogController;
