import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import '../../styles/layout.css';

const Navbar = ({ title }) => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="navbar">
      <h1 className="navbar-title">{title}</h1>
      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => setDark(d => !d)}
          title={dark ? 'Light mode' : 'Dark mode'}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)',
            background: 'var(--bg)', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text)', transition: 'all 0.2s',
          }}
        >
          {dark ? '☀️' : '🌙'}
        </button>
        <span className="navbar-badge">{admin?.name || 'Admin'}</span>
        <button className="btn-ghost" style={{ padding: '5px 12px', fontSize: 13 }} onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;