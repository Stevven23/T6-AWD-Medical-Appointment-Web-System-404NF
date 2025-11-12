const jwt = require('jsonwebtoken');
const supabase = require('../database');

// Middleware principal de autenticación
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // Verificar JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_secreto_temporal');
    
    // Obtener usuario completo desde Supabase
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
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    // Adjuntar usuario al request
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

// Middleware para verificar roles específicos
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userRoleCode = req.user.roleCode;
    
    if (!allowedRoles.includes(userRoleCode)) {
      return res.status(403).json({ 
        error: 'No tienes permisos para realizar esta acción' 
      });
    }

    next();
  };
};

module.exports = { authMiddleware, requireRole };
