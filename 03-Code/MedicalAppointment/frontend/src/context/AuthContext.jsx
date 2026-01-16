import React, { createContext, useContext, useState, useEffect } from "react";
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    console.log('🔍 Verificando sesión almacenada...');
    console.log('Token:', storedToken ? 'Existe' : 'No existe');
    console.log('User:', storedUser ? 'Existe' : 'No existe');

    const tryRestore = async () => {
      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          const parsedUser = JSON.parse(storedUser);
          console.log('✅ Usuario parseado correctamente:', parsedUser);
          
          // Validar estructura mínima del usuario
          if (parsedUser && parsedUser.id && parsedUser.role) {
            setUser(parsedUser);
            console.log('✅ Sesión restaurada exitosamente');
          } else {
            console.error('❌ Usuario con estructura inválida, limpiando sesión');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setToken(null);
          }
        } catch (error) {
          console.error('❌ Error parsing stored user:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
        }
      } else if (storedToken && !storedUser) {
        console.log('⚠️ Token existe pero no hay user, intentando obtener desde API...');
        // If we have token but no user in storage, try to fetch it
        try {
          const resp = await authAPI.me();
          const userData = resp.data?.user || resp.data?.user || resp.data;
          if (userData && userData.id && userData.role) {
            setToken(storedToken);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('✅ Usuario obtenido desde API y guardado');
          } else {
            // If cannot get user, clear token
            console.error('❌ No se pudo obtener usuario válido desde API');
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (err) {
          console.error('❌ Error fetching current user:', err);
          localStorage.removeItem('token');
          setToken(null);
        }
      }

      setLoading(false);
    };

    tryRestore();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      console.log('Login response:', response);

      const data = response.data || response;
      const newToken = data.token || data.accessToken || data.data?.token;
      const userData = data.user || data.data?.user;

      if (!newToken || !userData) {
        console.error('Login response missing token or user:', data);
        return { success: false, error: 'Respuesta inválida del servidor' };
      }

      setToken(newToken);
      setUser(userData);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));

      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      // Manejar diferentes formas de error
      if (error.response && error.response.data) {
        return { success: false, error: error.response.data.error || JSON.stringify(error.response.data) };
      }
      return { success: false, error: error.message || 'Error al iniciar sesión' };
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  };

  const updateUser = (userData) => {
    console.log('🔄 Actualizando usuario en AuthContext:', userData);
    
    // Validar que userData tiene las propiedades básicas necesarias
    if (!userData || !userData.id || !userData.role) {
      console.error('❌ userData inválido, no se actualizará:', userData);
      return;
    }
    
    try {
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      console.log('✅ Usuario actualizado correctamente en localStorage');
    } catch (error) {
      console.error('❌ Error al guardar usuario en localStorage:', error);
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    updateUser,
    isAuthenticated: !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};