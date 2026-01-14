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

    const tryRestore = async () => {
      if (storedToken && storedUser) {
        setToken(storedToken);
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error('Error parsing stored user:', error);
          localStorage.removeItem('user');
        }
      } else if (storedToken && !storedUser) {
        // If we have token but no user in storage, try to fetch it
        try {
          const resp = await authAPI.me();
          const userData = resp.data?.user || resp.data?.user || resp.data;
          if (userData) {
            setToken(storedToken);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          } else {
            // If cannot get user, clear token
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (err) {
          console.error('Error fetching current user:', err);
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
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
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