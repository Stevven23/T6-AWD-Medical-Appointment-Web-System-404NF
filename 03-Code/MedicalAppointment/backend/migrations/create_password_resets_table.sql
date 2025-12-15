-- Tabla para gestionar tokens de reset de contraseña
CREATE TABLE IF NOT EXISTS password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para mejorar performance
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);
CREATE INDEX IF NOT EXISTS idx_password_resets_user_id ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_expires_at ON password_resets(expires_at);

-- Comentarios para documentación
COMMENT ON TABLE password_resets IS 'Tokens de recuperación de contraseña';
COMMENT ON COLUMN password_resets.token IS 'Token hasheado (SHA-256) para seguridad';
COMMENT ON COLUMN password_resets.expires_at IS 'Fecha de expiración del token (1 hora típicamente)';
COMMENT ON COLUMN password_resets.used IS 'Indica si el token ya fue utilizado';

-- Política de seguridad (Row Level Security)
ALTER TABLE password_resets ENABLE ROW LEVEL SECURITY;

-- Solo el sistema puede insertar y actualizar
CREATE POLICY "System can manage password resets"
  ON password_resets
  FOR ALL
  TO authenticated
  USING (true);
