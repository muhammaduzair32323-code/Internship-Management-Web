import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import Loader from '../components/common/Loader';
import internService from '../services/internService';
import { toast } from 'react-toastify';
import '../styles/profile.css';

const THRESHOLD = 40;

const InternProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        internService.getProfile(id)
            .then(res => setData(res.data.data))
            .catch(err => { toast.error(err.message); navigate('/interns'); })
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <MainLayout title="Profile"><Loader /></MainLayout>;
    if (!data) return null;

    const { intern, tasks, stats, recentAttendance } = data;

    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const pendingTasks = tasks.filter(t => t.status === 'pending').length;
    const taskCompletionPct = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const hoursPct = Math.min((parseFloat(stats.total_hours) / THRESHOLD) * 100, 100).toFixed(0);
    const hoursmet = parseFloat(stats.total_hours) >= THRESHOLD;
    const attendancePct = stats.total_days > 0
        ? Math.round((stats.present_days / stats.total_days) * 100)
        : 0;

    return (
        <MainLayout title="Intern Profile">
            <div className="profile-page page-enter">

                {/* HEADER */}
                <div className="profile-header card">
                    <button className="btn-back" onClick={() => navigate('/interns')}>← Back</button>
                    <div className="profile-avatar">
                        {intern.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-info">
                        <h2 className="profile-name">{intern.name}</h2>
                        <p className="profile-email">{intern.email}</p>
                        <div className="profile-meta">
                            <span className="badge badge-muted">{intern.department}</span>
                            <span className="profile-date">Joined {new Date(intern.joining_date).toLocaleDateString()}</span>
                            <span className={`badge ${intern.status === 'active' ? 'badge-success' : 'badge-danger'}`}>
                                {intern.status || 'active'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* STAT CARDS */}
                <div className="profile-stats">
                    <div className="card profile-stat-card stagger-1">
                        <div className="pstat-value">{tasks.length}</div>
                        <div className="pstat-label">Total Tasks</div>
                    </div>
                    <div className="card profile-stat-card stagger-2">
                        <div className="pstat-value" style={{ color: '#16A34A' }}>{completedTasks}</div>
                        <div className="pstat-label">Completed</div>
                    </div>
                    <div className="card profile-stat-card stagger-3">
                        <div className="pstat-value" style={{ color: '#CA8A04' }}>{pendingTasks}</div>
                        <div className="pstat-label">Pending</div>
                    </div>
                    <div className="card profile-stat-card stagger-4">
                        <div className="pstat-value" style={{ color: '#4F46E5' }}>{attendancePct}%</div>
                        <div className="pstat-label">Attendance Rate</div>
                    </div>
                </div>

                <div className="profile-grid">

                    {/* PROGRESS */}
                    <div className="card">
                        <h3 className="section-title">Progress</h3>

                        <div className="progress-section">
                            <div className="progress-header">
                                <span className="progress-name">Task Completion</span>
                                <span className="progress-pct">{taskCompletionPct}%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${taskCompletionPct}%`, background: '#22C55E' }} />
                            </div>
                        </div>

                        <div className="progress-section">
                            <div className="progress-header">
                                <span className="progress-name">Weekly Hours ({parseFloat(stats.total_hours).toFixed(1)}h / {THRESHOLD}h)</span>
                                <span className="progress-pct" style={{ color: hoursmet ? '#16A34A' : '#4F46E5' }}>
                                    {hoursPct}% {hoursmet ? '✓' : ''}
                                </span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${hoursPct}%`, background: hoursmet ? '#22C55E' : '#4F46E5' }} />
                            </div>
                        </div>

                        <div className="progress-section">
                            <div className="progress-header">
                                <span className="progress-name">Attendance Rate</span>
                                <span className="progress-pct">{attendancePct}%</span>
                            </div>
                            <div className="progress-bar">
                                <div className="progress-fill" style={{ width: `${attendancePct}%`, background: '#F59E0B' }} />
                            </div>
                        </div>
                    </div>

                    {/* RECENT ATTENDANCE */}
                    <div className="card">
                        <h3 className="section-title">Recent Attendance</h3>
                        {recentAttendance.length === 0 ? (
                            <p className="empty-text" style={{ padding: '20px 0' }}>No attendance records yet</p>
                        ) : (
                            <div className="attendance-list">
                                {recentAttendance.map(rec => (
                                    <div key={rec.id} className="attendance-item">
                                        <span className="attendance-date">
                                            {new Date(rec.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </span>
                                        <div className="attendance-right">
                                            {rec.check_in && <span className="time-chip">In: {rec.check_in?.slice(0, 5)}</span>}
                                            {rec.check_out && <span className="time-chip">Out: {rec.check_out?.slice(0, 5)}</span>}
                                            {rec.total_hours && <span className="hours-chip">{rec.total_hours}h</span>}
                                            <span className={`badge ${rec.status === 'present' ? 'badge-success' : 'badge-danger'}`}>
                                                {rec.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* TASKS */}
                <div className="card" style={{ marginTop: '16px' }}>
                    <h3 className="section-title">Assigned Tasks</h3>
                    {tasks.length === 0 ? (
                        <p className="empty-text" style={{ padding: '20px 0' }}>No tasks assigned yet</p>
                    ) : (
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Title</th>
                                    <th>Description</th>
                                    <th>Status</th>
                                    <th>Assigned</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tasks.map(task => (
                                    <tr key={task.id}>
                                        <td><span className="intern-name">{task.title}</span></td>
                                        <td><span className="text-muted">{task.description || '—'}</span></td>
                                        <td>
                                            <span className={`badge ${task.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td><span className="text-muted">{new Date(task.created_at).toLocaleDateString()}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </div>
        </MainLayout>
    );
};

export default InternProfile;