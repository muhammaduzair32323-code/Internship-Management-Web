import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import Loader from '../../components/common/Loader';
import { toast } from 'react-toastify';

const priorityColor = { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' };

const InternTasks = () => {
  const { intern, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');

  const fetchTasks = () => {
    api.get('/intern/me')
      .then(res => setTasks(res.data.data.tasks))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const handleComplete = async (id) => {
    try {
      await api.patch(`/intern/tasks/${id}/complete`);
      toast.success('Task marked complete');
      fetchTasks();
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="intern-page">
      {/* Navbar */}
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
          <button onClick={toggleDark} style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid var(--border)', background: 'var(--bg)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {dark ? '☀️' : '🌙'}
          </button>
          <span style={{ color: 'var(--muted)', fontSize: 14 }}>{intern?.name}</span>
          <button onClick={() => { logout(); navigate('/intern/login'); }} className="btn-ghost" style={{ padding: '5px 12px', fontSize: 13 }}>Logout</button>
        </div>
      </div>

      <div className="intern-content" style={{ maxWidth: 900 }}>
        <h2 style={{ color: 'var(--text)', marginBottom: 24 }}>My Tasks</h2>
        {loading ? <Loader /> : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: 48 }}>No tasks assigned yet</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {tasks.map(task => (
              <div key={task.id} className="intern-task-card" style={{
                borderLeft: `4px solid ${priorityColor[task.priority] || 'var(--border)'}`,
                opacity: task.status === 'completed' ? 0.7 : 1,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', fontSize: 15, textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                      {task.title}
                    </div>
                    {task.description && <div style={{ color: 'var(--muted)', fontSize: 13, marginTop: 4 }}>{task.description}</div>}
                    <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                      {task.due_date && (
                        <span style={{ fontSize: 12, color: new Date(task.due_date) < new Date() && task.status === 'pending' ? '#EF4444' : 'var(--muted)' }}>
                          Due: {new Date(task.due_date).toLocaleDateString()}
                          {new Date(task.due_date) < new Date() && task.status === 'pending' && ' ⚠'}
                        </span>
                      )}
                      <span style={{ fontSize: 12, color: priorityColor[task.priority], fontWeight: 500, textTransform: 'capitalize' }}>
                        {task.priority} priority
                      </span>
                    </div>

                    {/* Comments */}
                    {task.comments && task.comments.length > 0 && (
                      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 6 }}>
                          Notes from supervisor ({task.comments.length})
                        </div>
                        {task.comments.map(c => (
                          <div key={c.id} style={{ background: 'var(--bg)', borderRadius: 6, padding: '8px 12px', marginBottom: 6, borderLeft: '3px solid var(--primary)' }}>
                            <p style={{ margin: 0, color: 'var(--text)', fontSize: 12 }}>{c.comment}</p>
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(c.created_at).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 12 }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500,
                      background: task.status === 'completed' ? '#DCFCE7' : '#FEF9C3',
                      color: task.status === 'completed' ? '#16A34A' : '#CA8A04'
                    }}>
                      {task.status}
                    </span>
                    {task.status === 'pending' && (
                      <button onClick={() => handleComplete(task.id)} className="btn-primary" style={{ padding: '6px 12px', fontSize: 12 }}>
                        Mark Done
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};



export default InternTasks;