const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const supabase = require('../database');
const bcrypt = require('bcrypt');

// Configurar Google OAuth solo si existen las credenciales
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_CALLBACK_URL) {
  passport.use(new GoogleStrategy({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google profile received:', profile.id);

      // Buscar si el usuario ya existe por google_id
      let { data: existingUser } = await supabase
        .from('users')
        .select('*, roles(name)')
        .eq('google_id', profile.id)
        .single();

      if (existingUser) {
        console.log('Usuario existente encontrado por google_id:', existingUser.id);
        return done(null, existingUser);
      }

      // Si no existe por google_id, buscar por email
      const email = profile.emails[0].value;
      let { data: existingEmailUser } = await supabase
        .from('users')
        .select('*, roles(name)')
        .eq('email', email)
        .single();

      if (existingEmailUser) {
        // Usuario existe con el mismo email pero sin google_id, actualizar
        console.log('Usuario existente por email, vinculando Google ID');
        const { data: updatedUser } = await supabase
          .from('users')
          .update({ google_id: profile.id })
          .eq('id', existingEmailUser.id)
          .select('*, roles(name)')
          .single();

        return done(null, updatedUser);
      }

      // Usuario no existe, crear uno nuevo
      console.log('Creando nuevo usuario desde Google');

      // Obtener role_id para 'patient'
      const { data: roleData } = await supabase
        .from('roles')
        .select('id, name')
        .eq('name', 'patient')
        .single();

      if (!roleData) {
        throw new Error('No se encontró el rol de paciente');
      }

      // Crear usuario nuevo
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert([{
          email: email,
          first_name: profile.name.givenName || '',
          last_name: profile.name.familyName || '',
          google_id: profile.id,
          role_id: roleData.id,
          // Contraseña random ya que no la usarán (login con Google)
          password_hash: await bcrypt.hash(Math.random().toString(36), 10)
        }])
        .select('*, roles(name)')
        .single();

      if (userError) {
        console.error('Error creando usuario:', userError);
        throw userError;
      }

      console.log('Nuevo usuario creado:', newUser.id);

      // Crear registro de paciente básico
      const { error: patientError } = await supabase
        .from('patients')
        .insert([{
          user_id: newUser.id,
          // Datos básicos, el resto se completará después
          date_of_birth: null
        }]);

      if (patientError) {
        console.error('Error creando paciente:', patientError);
        // Rollback: eliminar usuario
        await supabase.from('users').delete().eq('id', newUser.id);
        throw patientError;
      }

      return done(null, newUser);
    } catch (error) {
      console.error('Error en Google Strategy:', error);
      return done(error, null);
    }
  }
  ));
} else {
  console.warn('⚠️  Google OAuth no configurado (variables GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_CALLBACK_URL no encontradas)');
}

// Sin serializeUser/deserializeUser - OAuth stateless con JWT

module.exports = passport;
