const jwt = require('jsonwebtoken');
const supabase = require('../database');

const authMiddleware = async (req, res, next) => {

  // 🔥 NO BLOQUEAR PREFLIGHT
  if (req.method === 'OPTIONS') {
    return next();
  }

  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'tu_secreto_temporal'
    );

    const userId = decoded.id || decoded.userId;

    const { data: user, error } = await supabase
      .from('users')
      .select(`
        id,
        email,
        first_name,
        last_name,
        is_active,
        roles:role_id (
          name,
          code
        )
      `)
      .eq('id', userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.roles.name,
      roleCode: user.roles.code
    };

    next();

  } catch (error) {
    console.error('Auth error:', error.message);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {

    if (req.method === 'OPTIONS') {
      return next();
    }

    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (!allowedRoles.includes(req.user.roleCode)) {
      return res.status(403).json({
        error: 'No tienes permisos para realizar esta acción'
      });
    }

    next();
  };
};

module.exports = { authMiddleware, requireRole };
