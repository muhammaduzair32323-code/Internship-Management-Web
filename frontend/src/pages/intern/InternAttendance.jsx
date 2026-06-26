import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';
import InternNavbar from './InternDashboard';

const InternAttendance = () => {
  const { intern, logout } = useAuth();
  const navigate = useNavigate();
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/intern/me')
      .then(res => setAttendance(res.data.data.attendance))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
}, []);

  const formatTime = (t) => {
    if (!t) return '—';
    const [h, m] = t.split(':');
    const hr = parseInt(h);
    return `${hr % 12 || 12}:${m} ${hr >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <div className="intern-page">
      <div className="intern-navbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <span style={{ fontWeight: 700, color: 'var(--primary)', fontSize: 18 }}>IP</span>
          <nav style={{ display: 'flex', gap: 4 }}>
            {[['Dashboard', '/intern/dashboard'], ['Tasks', '/intern/tasks'], ['Attendance', '/intern/attendance']].map(([label, path]) => (
              <button key={path} onClick={() => navigate(path)}
                className={`intern-nav-btn ${window.location.pathname === path ? 'active' : ''}`}>
                {label}
              </button>
            ))}
          </nav>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>{intern?.name}</span>
          <button onClick={() => { logout(); navigate('/intern/login'); }} className="btn-ghost" style={{ padding: '5px 12px', fontSize: 13 }}>Logout</button>
        </div>
      </div>

      <div className="intern-content" style={{ maxWidth: 900 }}>
        <h2 style={{ color: 'var(--text)', marginBottom: 24 }}>My Attendance</h2>
        {loading ? <Loader /> : attendance.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 48 }}>No attendance records yet</div>
        ) : (
          <div className="intern-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table className="intern-table">
              <thead>
                <tr>
                  {['Date', 'Status', 'Check In', 'Check Out', 'Hours'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {attendance.map(rec => (
                  <tr key={rec.id}>
                    <td>{new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</td>
                    <td>
                      <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                        background: rec.status === 'present' ? '#DCFCE7' : '#FEE2E2',
                        color: rec.status === 'present' ? '#16A34A' : '#DC2626' }}>
                        {rec.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--muted)' }}>{formatTime(rec.check_in)}</td>
                    <td style={{ color: 'var(--muted)' }}>{formatTime(rec.check_out)}</td>
                    <td style={{ color: 'var(--muted)' }}>{rec.total_hours ? `${rec.total_hours}h` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};



export default InternAttendance;