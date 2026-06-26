import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [intern, setIntern] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedAdmin = localStorage.getItem('admin');
    const storedIntern = localStorage.getItem('intern');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      if (storedAdmin) setAdmin(JSON.parse(storedAdmin));
      if (storedIntern) setIntern(JSON.parse(storedIntern));
    }
    setLoading(false);
  }, []);

  const login = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('admin', JSON.stringify(data.admin));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setAdmin(data.admin);
  };

  const internLogin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('intern', JSON.stringify(data.intern));
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setIntern(data.intern);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    localStorage.removeItem('intern');
    delete api.defaults.headers.common['Authorization'];
    setAdmin(null);
    setIntern(null);
  };

  return (
    <AuthContext.Provider value={{ admin, intern, login, internLogin, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);