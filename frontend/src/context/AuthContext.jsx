import { createContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await authAPI.getProfile();
          setUser(response);
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Error fetching user profile:', err);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authAPI.login(username, password);
      localStorage.setItem('token', response.token);
      setUser(response);
      return true; // indicate success
    } catch (err) {
      setError('Không thể đăng nhập');
      throw err; // <-- Quan trọng: ném lỗi để AuthPage.jsx bắt được
    }
  };

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData);
      localStorage.setItem('token', response.token);
      setUser(response);
    } catch (err) {
      // Pass error message to caller
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Không thể đăng ký';
      setError(msg);
      throw new Error(msg); // <-- Throw error so AuthPage can catch and display
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
};
