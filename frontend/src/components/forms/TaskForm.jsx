import { useState } from 'react';
import Groq from 'groq-sdk';
import '../../styles/forms.css';

const groq = new Groq({
  apiKey: process.env.REACT_APP_GROQ_API_KEY,
  dangerouslyAllowBrowser: true,
});

const TaskForm = ({ interns, onSubmit, submitting, onCancel, initialData }) => {
  const [form, setForm] = useState({
    intern_id: initialData?.intern_id || '',
    title: initialData?.title || '',
    description: initialData?.description || '',
    priority: initialData?.priority || 'medium',
    due_date: initialData?.due_date?.slice(0, 10) || '',
  });
  const [selectedInterns, setSelectedInterns] = useState(
    initialData?.intern_id ? [String(initialData.intern_id)] : []
  );
  const [errors, setErrors] = useState({});
  const [enhancing, setEnhancing] = useState(false);
  const [enhanced, setEnhanced] = useState(false);

  const isEditMode = !!initialData;

  const toggleIntern = (id) => {
    setSelectedInterns(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
    setErrors(p => ({ ...p, intern_id: '' }));
  };

  const validate = () => {
    const e = {};
    if (!isEditMode && selectedInterns.length === 0) e.intern_id = 'Select at least one intern';
    if (isEditMode && !form.intern_id) e.intern_id = 'Please select an intern';
    if (!form.title.trim()) e.title = 'Title is required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
    if (e.target.name === 'description') setEnhanced(false);
  };

  const handleEnhance = async () => {
    if (!form.title.trim()) {
      setErrors(p => ({ ...p, title: 'Enter a title first to enhance' }));
      return;
    }
    setEnhancing(true);
    try {
      const context = form.description.trim()
        ? `Task title: "${form.title}". Admin's notes: "${form.description}".`
        : `Task title: "${form.title}".`;
      const chat = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: 'You are a task manager assistant. Generate a clear, professional, and detailed task description for an intern. Keep it 3 to 5 sentences. No bullet points. Plain paragraph only.' },
          { role: 'user', content: `${context} Generate a detailed description for this task.` },
        ],
        max_tokens: 200,
      });
      setForm(p => ({ ...p, description: chat.choices[0]?.message?.content?.trim() }));
      setEnhanced(true);
    } catch (err) {
      setErrors(p => ({ ...p, title: err.message }));
    } finally {
      setEnhancing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    if (isEditMode) {
      onSubmit(form);
    } else {
      onSubmit({ ...form, intern_ids: selectedInterns.map(Number) });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form">

      {/* Assign To */}
      <div className="form-group">
        <label className="form-label">
          {isEditMode ? 'Assigned To' : `Assign To ${!isEditMode && selectedInterns.length > 0 ? `(${selectedInterns.length} selected)` : ''}`}
        </label>

        {isEditMode ? (
          <select
            className={`form-input ${errors.intern_id ? 'input-error' : ''}`}
            name="intern_id"
            value={form.intern_id}
            onChange={handleChange}
          >
            <option value="">Select intern</option>
            {interns.map(i => <option key={i.id} value={i.id}>{i.name} — {i.department}</option>)}
          </select>
        ) : (
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', maxHeight: 160, overflowY: 'auto', padding: '6px 0' }}
            className={errors.intern_id ? 'input-error' : ''}>
            {interns.map(i => (
              <label key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', cursor: 'pointer',
                background: selectedInterns.includes(String(i.id)) ? 'var(--primary-light)' : 'transparent' }}>
                <input
                  type="checkbox"
                  checked={selectedInterns.includes(String(i.id))}
                  onChange={() => toggleIntern(String(i.id))}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span style={{ fontSize: 13, color: 'var(--text)' }}>{i.name}</span>
                <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 'auto' }}>{i.department}</span>
              </label>
            ))}
          </div>
        )}
        {errors.intern_id && <span className="form-error">{errors.intern_id}</span>}
      </div>

      {/* Title */}
      <div className="form-group">
        <div className="label-row">
          <label className="form-label">Task Title</label>
          <button type="button" className="btn-enhance" onClick={handleEnhance} disabled={enhancing}>
            {enhancing ? <><span className="btn-spinner-dark" /> Enhancing...</> : '✦ Enhance with AI'}
          </button>
        </div>
        <input
          className={`form-input ${errors.title ? 'input-error' : ''}`}
          name="title"
          value={form.title}
          onChange={handleChange}
          placeholder="e.g. Build login page"
        />
        {errors.title && <span className="form-error">{errors.title}</span>}
      </div>

      {/* Description */}
      <div className="form-group">
        <div className="label-row">
          <label className="form-label">
            Description
            {enhanced && <span className="ai-badge">✦ AI Enhanced</span>}
          </label>
          {enhanced && (
            <button type="button" className="btn-regenerate" onClick={handleEnhance} disabled={enhancing}>
              Regenerate
            </button>
          )}
        </div>
        <textarea
          className={`form-input ${enhanced ? 'enhanced-input' : ''}`}
          name="description"
          value={form.description}
          onChange={handleChange}
          placeholder="Task details or click Enhance with AI..."
          rows={4}
          style={{ resize: 'vertical' }}
        />
      </div>

      {/* Priority */}
      <div className="form-group">
        <label className="form-label">Priority</label>
        <select className="form-input" name="priority" value={form.priority} onChange={handleChange}>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
          <option value="high">High</option>
        </select>
      </div>

      {/* Due Date */}
      <div className="form-group">
        <label className="form-label">Due Date <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span></label>
        <input type="date" className="form-input" name="due_date" value={form.due_date} onChange={handleChange} />
      </div>

      <div className="form-actions">
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? <span className="btn-spinner" /> : initialData ? 'Save Changes' : `Assign Task${selectedInterns.length > 1 ? ` to ${selectedInterns.length} Interns` : ''}`}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;