import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import StatCard from '../components/common/StatCard';
import TaskStatusChart from '../components/charts/TaskStatusChart';
import DepartmentChart from '../components/charts/DepartmentChart';
import dashboardService from '../services/dashboardService';
import Loader from '../components/common/Loader';
import '../styles/dashboard.css';

const activityIcon = (type) => {
  if (type === 'task_assigned') return { icon: '✓', bg: '#EEF2FF', color: '#4F46E5' };
  if (type === 'intern_added') return { icon: '◉', bg: '#DCFCE7', color: '#16A34A' };
  return { icon: '▤', bg: '#FEF9C3', color: '#CA8A04' };
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    dashboardService.getStats()
      .then(res => setData(res.data.data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <MainLayout title="Dashboard"><Loader /></MainLayout>;
  if (error) return <MainLayout title="Dashboard"><p className="error-text">{error}</p></MainLayout>;

  const { stats, departmentDistribution, taskStatusDistribution, recentActivity, internPerformance } = data;

  return (
    <MainLayout title="Dashboard">
      <div className="page-enter">

        {/* STAT CARDS */}
        <div className="stat-grid">
          <div className="stagger-1"><StatCard label="Total Interns" value={stats.total_interns} color="primary" /></div>
          <div className="stagger-2"><StatCard label="Total Tasks" value={stats.total_tasks} color="muted" /></div>
          <div className="stagger-3"><StatCard label="Completed Tasks" value={stats.completed_tasks} color="success" /></div>
          <div className="stagger-4"><StatCard label="Pending Tasks" value={stats.pending_tasks} color="warning" /></div>
        </div>

        {/* CHARTS */}
        <div className="charts-grid">
          <div className="card">
            <h3 className="chart-title">Tasks by Status</h3>
            <TaskStatusChart data={taskStatusDistribution} />
          </div>
          <div className="card">
            <h3 className="chart-title">Department Distribution</h3>
            <DepartmentChart data={departmentDistribution} />
          </div>
        </div>

        {/* BOTTOM GRID */}
        <div className="dashboard-bottom">

          {/* RECENT ACTIVITY */}
          <div className="card">
            <h3 className="chart-title">Recent Activity</h3>
            {recentActivity.length === 0 ? (
              <p className="empty-text" style={{ padding: '20px 0' }}>No activity yet</p>
            ) : (
              <div className="activity-list">
                {recentActivity.map((item, i) => {
                  const { icon, bg, color } = activityIcon(item.type);
                  return (
                    <div key={i} className="activity-item">
                      <div className="activity-icon" style={{ background: bg, color }}>
                        {icon}
                      </div>
                      <div className="activity-content">
                        <p className="activity-message">
                          <strong>{item.intern_name}</strong> — {item.message}
                        </p>
                        <span className="activity-time">
                          {new Date(item.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* INTERN PERFORMANCE */}
          <div className="card">
            <h3 className="chart-title">Intern Performance</h3>
            {internPerformance.length === 0 ? (
              <p className="empty-text" style={{ padding: '20px 0' }}>No data yet</p>
            ) : (
              <div className="performance-list">
                {internPerformance.map(intern => {
                  const taskPct = intern.total_tasks > 0
                    ? Math.round((intern.completed_tasks / intern.total_tasks) * 100)
                    : 0;
                  const attPct = intern.total_days > 0
                    ? Math.round((intern.present_days / intern.total_days) * 100)
                    : 0;
                  return (
                    <div
                      key={intern.id}
                      className="performance-item"
                      onClick={() => navigate(`/interns/${intern.id}/profile`)}
                    >
                      <div className="perf-avatar">{intern.name.charAt(0)}</div>
                      <div className="perf-info">
                        <div className="perf-header">
                          <span className="perf-name">{intern.name}</span>
                          <span className="badge badge-muted">{intern.department}</span>
                        </div>
                        <div className="perf-bars">
                          <div className="perf-bar-row">
                            <span className="perf-bar-label">Tasks</span>
                            <div className="progress-bar" style={{ flex: 1 }}>
                              <div className="progress-fill" style={{ width: `${taskPct}%`, background: '#22C55E' }} />
                            </div>
                            <span className="perf-pct">{taskPct}%</span>
                          </div>
                          <div className="perf-bar-row">
                            <span className="perf-bar-label">Attend.</span>
                            <div className="progress-bar" style={{ flex: 1 }}>
                              <div className="progress-fill" style={{ width: `${attPct}%`, background: '#F59E0B' }} />
                            </div>
                            <span className="perf-pct">{attPct}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;