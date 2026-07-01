import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import submissionService from '../../services/submissionService';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import { toast } from 'react-toastify';

const priorityColor = { high: '#EF4444', medium: '#F59E0B', low: '#22C55E' };

const ALLOWED_MIME = [
  'application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain', 'text/csv', 'application/zip',
];
const MAX_SIZE = 10 * 1024 * 1024;

const statusBadgeStyle = {
  submitted: { background: '#DBEAFE', color: '#1D4ED8' },
  approved: { background: '#DCFCE7', color: '#16A34A' },
  rejected: { background: '#FEE2E2', color: '#DC2626' },
  revision_requested: { background: '#FEF9C3', color: '#CA8A04' },
};

const InternTasks = () => {
  const { intern, logout } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [submissionsByTask, setSubmissionsByTask] = useState({});
  const [submitTask, setSubmitTask] = useState(null);
  const [notes, setNotes] = useState('');
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchTasks = () => {
    api.get('/intern/me')
      .then(res => setTasks(res.data.data.tasks))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  const fetchSubmissions = () => {
    submissionService.getAll({})
      .then(res => {
        const grouped = {};
        (res.data.data || []).forEach(s => {
          grouped[s.task_id] = grouped[s.task_id] || [];
          grouped[s.task_id].push(s);
        });
        setSubmissionsByTask(grouped);
      })
      .catch(() => {});
  };

  useEffect(() => { fetchTasks(); fetchSubmissions(); }, []);

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

  const openSubmit = (task) => {
    setSubmitTask(task);
    setNotes('');
    setFiles([]);
  };

  const addFiles = (incoming) => {
    const valid = Array.from(incoming).filter(f => {
      if (!ALLOWED_MIME.includes(f.type)) { toast.error(`"${f.name}" is not an allowed file type.`); return false; }
      if (f.size > MAX_SIZE) { toast.error(`"${f.name}" exceeds the 10 MB limit.`); return false; }
      return true;
    });
    setFiles(prev => [...prev, ...valid]);
  };

  const handleSubmitWork = async () => {
    if (!files.length) { toast.error('Attach at least one file'); return; }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('task_id', submitTask.id);
      if (notes.trim()) fd.append('notes', notes.trim());
      files.forEach(f => fd.append('files', f));
      await submissionService.create(fd);
      toast.success('Work submitted — supervisor notified');
      setSubmitTask(null);
      fetchSubmissions();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
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

                    {/* Submissions */}
                    {(submissionsByTask[task.id] || []).length > 0 && (
                      <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                        <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 600, marginBottom: 6 }}>
                          Your submissions ({submissionsByTask[task.id].length})
                        </div>
                        {submissionsByTask[task.id].map(s => (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 500,
                              ...(statusBadgeStyle[s.status] || statusBadgeStyle.submitted),
                            }}>
                              {s.status.replace('_', ' ')}
                            </span>
                            <span style={{ fontSize: 11, color: 'var(--muted)' }}>
                              {new Date(s.created_at).toLocaleDateString()}
                              {s.score != null ? ` · Score: ${s.score}` : ''}
                            </span>
                            {s.feedback && (
                              <span style={{ fontSize: 11, color: 'var(--text)' }}>— {s.feedback}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

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
                    <button onClick={() => openSubmit(task)} className="btn-ghost" style={{ padding: '6px 12px', fontSize: 12 }}>
                      Submit Work
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {submitTask && (
        <Modal title={`Submit Work — ${submitTask.title}`} onClose={() => !submitting && setSubmitTask(null)}>
          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
              Notes <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              rows={3}
              className="form-input"
              style={{ width: '100%', resize: 'vertical' }}
              placeholder="Describe your work, approach, or anything the reviewer should know…"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div className="field" style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text)' }}>
              Files *
            </label>
            <input
              type="file"
              multiple
              accept={ALLOWED_MIME.join(',')}
              onChange={e => addFiles(e.target.files)}
            />
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 4 }}>
              PDF, Word, Excel, images, CSV, ZIP — max 10 MB each
            </div>
            {files.length > 0 && (
              <ul style={{ marginTop: 8, paddingLeft: 18, fontSize: 12, color: 'var(--text)' }}>
                {files.map((f, i) => (
                  <li key={i}>
                    {f.name}
                    <button
                      onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                      style={{ marginLeft: 8, border: 'none', background: 'none', color: '#EF4444', cursor: 'pointer' }}
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="form-actions">
            <button className="btn-ghost" onClick={() => setSubmitTask(null)} disabled={submitting}>Cancel</button>
            <button className="btn-primary" onClick={handleSubmitWork} disabled={submitting}>
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};



export default InternTasks;
