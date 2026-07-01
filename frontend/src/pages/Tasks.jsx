import { useState, useEffect, useCallback } from 'react';
import MainLayout from '../components/layout/MainLayout';
import TaskForm from '../components/forms/TaskForm';
import Modal from '../components/common/Modal';
import Loader from '../components/common/Loader';
import EmptyState from '../components/common/EmptyState';
import taskService from '../services/taskService';
import internService from '../services/internService';
import submissionService from '../services/submissionService';
import { toast } from 'react-toastify';
import '../styles/tasks.css';

const statusBadgeClass = {
  submitted: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
  revision_requested: 'badge-warning',
};

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState('');
  const [editTask, setEditTask] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [commentTask, setCommentTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [submissionTask, setSubmissionTask] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewScore, setReviewScore] = useState('');
  const [reviewFeedback, setReviewFeedback] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    taskService.getAll({ status: statusFilter, priority: priorityFilter })
      .then(res => setTasks(res.data.data))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [statusFilter, priorityFilter]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  useEffect(() => {
    internService.getAll({})
      .then(res => setInterns(res.data.data))
      .catch(() => { });
  }, []);

  const handleSubmit = async (data) => {
    setSubmitting(true);
    try {
      await taskService.create(data);
      toast.success('Task assigned');
      setShowModal(false);
      fetchTasks();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusToggle = async (task) => {
    const newStatus = task.status === 'pending' ? 'completed' : 'pending';
    try {
      await taskService.updateStatus(task.id, newStatus);
      toast.success(`Task marked ${newStatus}`);
      fetchTasks();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleEdit = async (data) => {
    setSubmitting(true);
    try {
      await taskService.update(editTask.id, data);
      toast.success('Task updated');
      setEditTask(null);
      fetchTasks();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await taskService.delete(id);
      toast.success('Task deleted');
      setDeleteConfirm(null);
      fetchTasks();
    } catch (err) { toast.error(err.message); }
  };

  const isOverdue = (task) =>
    task.due_date && task.status === 'pending' && new Date(task.due_date) < new Date();

  const priorityBadge = (p) => {
    const map = { high: 'badge-danger', medium: 'badge-warning', low: 'badge-success' };
    return <span className={`badge ${map[p] || 'badge-warning'}`}>{p}</span>;
  };

  const openComments = async (task) => {
    setCommentTask(task);
    setCommentText('');
    try {
      const res = await taskService.getComments(task.id);
      setComments(res.data.data);
    } catch (err) { toast.error(err.message); }
  };

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setCommentLoading(true);
    try {
      await taskService.addComment(commentTask.id, commentText);
      toast.success('Comment added — intern notified');
      setCommentText('');
      const res = await taskService.getComments(commentTask.id);
      setComments(res.data.data);
    } catch (err) { toast.error(err.message); }
    finally { setCommentLoading(false); }
  };

  const openSubmissions = async (task) => {
    setSubmissionTask(task);
    setReviewingId(null);
    try {
      const res = await submissionService.getAll({ task_id: task.id });
      setSubmissions(res.data.data);
    } catch (err) { toast.error(err.message); }
  };

  const startReview = (submission) => {
    setReviewingId(submission.id);
    setReviewScore(submission.score ?? '');
    setReviewFeedback(submission.feedback ?? '');
  };

  const handleReview = async (status) => {
    setReviewBusy(true);
    try {
      await submissionService.review(reviewingId, {
        status,
        score: reviewScore === '' ? undefined : Number(reviewScore),
        feedback: reviewFeedback.trim() || undefined,
      });
      toast.success('Submission reviewed — intern notified in Slack');
      setReviewingId(null);
      const res = await submissionService.getAll({ task_id: submissionTask.id });
      setSubmissions(res.data.data);
    } catch (err) { toast.error(err.message); }
    finally { setReviewBusy(false); }
  };

  const handleDownload = (submission, file) => {
    submissionService.download(submission.id, file.id, file.file_name).catch(err => toast.error(err.message));
  };

  return (
    <MainLayout title="Tasks">
      <div className="page-header">
        <div className="filters-row">
          <select className="filter-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <select className="filter-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>+ Assign Task</button>
      </div>

      {loading ? <Loader /> : tasks.length === 0 ? (
        <EmptyState message="No tasks found" />
      ) : (
        <div className="card table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Assigned To</th>
                <th>Description</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Created</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id} style={isOverdue(task) ? { background: '#FEF2F2' } : {}}>
                  <td><span className="intern-name">{task.title}</span></td>
                  <td><span className="text-muted">{task.intern_name}</span></td>
                  <td><span className="text-muted task-desc">{task.description || '—'}</span></td>
                  <td>{priorityBadge(task.priority)}</td>
                  <td>
                    <span className={`badge ${task.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                      {task.status}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: isOverdue(task) ? '#EF4444' : 'var(--muted)' }}>
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '—'}
                      {isOverdue(task) && ' ⚠'}
                    </span>
                  </td>
                  <td><span className="text-muted">{new Date(task.created_at).toLocaleDateString()}</span></td>
                  <td>
                    <div className="action-btns">
                      <button
                        className={task.status === 'pending' ? 'btn-edit' : 'btn-delete'}
                        onClick={() => handleStatusToggle(task)}
                      >
                        {task.status === 'pending' ? 'Mark Done' : 'Reopen'}
                      </button>
                      <button className="btn-edit" onClick={() => setEditTask(task)}>Edit</button>
                      <button className="btn-delete" onClick={() => setDeleteConfirm(task.id)}>Delete</button>
                      <button className="btn-view" onClick={() => openComments(task)}>Notes</button>
                      <button className="btn-view" onClick={() => openSubmissions(task)}>Submissions</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <Modal title="Assign Task" onClose={() => setShowModal(false)}>
          <TaskForm
            interns={interns}
            onSubmit={handleSubmit}
            submitting={submitting}
            onCancel={() => setShowModal(false)}
          />
        </Modal>
      )}

      {editTask && (
        <Modal title="Edit Task" onClose={() => setEditTask(null)}>
          <TaskForm
            interns={interns}
            initialData={editTask}
            onSubmit={handleEdit}
            submitting={submitting}
            onCancel={() => setEditTask(null)}
          />
        </Modal>
      )}

      {deleteConfirm && (
        <Modal title="Delete Task" onClose={() => setDeleteConfirm(null)}>
          <p style={{ color: 'var(--muted)', marginBottom: 24 }}>
            Are you sure you want to delete this task? This cannot be undone.
          </p>
          <div className="form-actions">
            <button className="btn-ghost" onClick={() => setDeleteConfirm(null)}>Cancel</button>
            <button className="btn-delete" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
          </div>
        </Modal>
      )}

      {commentTask && (
        <Modal title={`Notes — ${commentTask.title}`} onClose={() => setCommentTask(null)}>
          <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16 }}>
            {comments.length === 0 ? (
              <p style={{ color: 'var(--muted)', fontSize: 13 }}>No notes yet</p>
            ) : comments.map(c => (
              <div key={c.id} style={{ background: '#F8FAFC', borderRadius: 8, padding: '10px 14px', marginBottom: 8, borderLeft: '3px solid #4F46E5' }}>
                <p style={{ margin: 0, color: '#0F172A', fontSize: 13 }}>{c.comment}</p>
                <span style={{ fontSize: 11, color: 'var(--muted)' }}>{new Date(c.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              className="form-input"
              placeholder="Add a note..."
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddComment()}
              style={{ flex: 1 }}
            />
            <button className="btn-primary" onClick={handleAddComment} disabled={commentLoading}>
              {commentLoading ? '...' : 'Add'}
            </button>
          </div>
        </Modal>
      )}

      {submissionTask && (
        <Modal title={`Submissions — ${submissionTask.title}`} onClose={() => setSubmissionTask(null)}>
          {submissions.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 13 }}>No submissions yet.</p>
          ) : (
            <div style={{ maxHeight: 420, overflowY: 'auto' }}>
              {submissions.map(s => (
                <div key={s.id} style={{ background: '#F8FAFC', borderRadius: 8, padding: '12px 14px', marginBottom: 10, borderLeft: '3px solid #4F46E5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{s.intern_name}</span>
                    <span className={`badge ${statusBadgeClass[s.status] || 'badge-warning'}`}>{s.status.replace('_', ' ')}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0' }}>
                    {new Date(s.created_at).toLocaleString()}
                  </div>
                  {s.notes && <p style={{ margin: '6px 0', fontSize: 13 }}>{s.notes}</p>}
                  {(s.files || []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '6px 0' }}>
                      {s.files.map(f => (
                        <button key={f.id} className="btn-ghost" style={{ fontSize: 12, padding: '4px 10px' }}
                          onClick={() => handleDownload(s, f)}>
                          📎 {f.file_name}
                        </button>
                      ))}
                    </div>
                  )}
                  {s.score != null && <div style={{ fontSize: 12 }}>Score: {s.score}</div>}
                  {s.feedback && <div style={{ fontSize: 12, color: 'var(--muted)' }}>Feedback: {s.feedback}</div>}

                  {reviewingId === s.id ? (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <input
                        className="form-input" type="number" min="0" max="100" placeholder="Score (0-100, optional)"
                        value={reviewScore} onChange={e => setReviewScore(e.target.value)}
                      />
                      <textarea
                        className="form-input" rows={2} placeholder="Feedback (optional)"
                        value={reviewFeedback} onChange={e => setReviewFeedback(e.target.value)}
                      />
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-primary" disabled={reviewBusy} onClick={() => handleReview('approved')}>Approve</button>
                        <button className="btn-delete" disabled={reviewBusy} onClick={() => handleReview('rejected')}>Reject</button>
                        <button className="btn-edit" disabled={reviewBusy} onClick={() => handleReview('revision_requested')}>Request Revision</button>
                        <button className="btn-ghost" disabled={reviewBusy} onClick={() => setReviewingId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    ['submitted', 'revision_requested'].includes(s.status) && (
                      <button className="btn-edit" style={{ marginTop: 8, fontSize: 12 }} onClick={() => startReview(s)}>
                        Review
                      </button>
                    )
                  )}
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </MainLayout>
  );
};

export default Tasks;
