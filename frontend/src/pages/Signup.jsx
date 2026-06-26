import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { toast } from 'react-toastify';
import '../styles/auth.css';

const Signup = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', signup_key: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!form.signup_key.trim()) e.signup_key = 'Signup key is required';
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.email.trim()) e.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Invalid email';
    if (!form.password) e.password = 'Password is required';
    else if (form.password.length < 6) e.password = 'Minimum 6 characters';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }
    setLoading(true);
    try {
      const res = await authService.signup({
        name: form.name,
        email: form.email,
        password: form.password,
        signup_key: form.signup_key,
      });
      login(res.data.data);
      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.message);
      setShake(true);
      setTimeout(() => setShake(false), 400);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className={`auth-card slide-up ${shake ? 'shake' : ''}`}>
        <div className="auth-brand">
          <div className="auth-logo">IP</div>
          <h1 className="auth-title">Intern Portal</h1>
        </div>
        <h2 className="auth-heading">Create account</h2>
        <p className="auth-sub">One admin account only</p>

        <form onSubmit={handleSubmit} className="form">

          <div className="form-group">
            <label className="form-label">Signup Key</label>
            <input
              className={`form-input ${errors.signup_key ? 'input-error' : ''}`}
              type="password"
              name="signup_key"
              value={form.signup_key}
              onChange={handleChange}
              placeholder="Enter admin signup key"
            />
            {errors.signup_key && <span className="form-error">{errors.signup_key}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your name"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className={`form-input ${errors.email ? 'input-error' : ''}`}
              name="email"
              value={form.email}
              onChange={handleChange}
              placeholder="admin@example.com"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className={`form-input ${errors.password ? 'input-error' : ''}`}
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              className={`form-input ${errors.confirm ? 'input-error' : ''}`}
              type="password"
              name="confirm"
              value={form.confirm}
              onChange={handleChange}
              placeholder="••••••••"
            />
            {errors.confirm && <span className="form-error">{errors.confirm}</span>}
          </div>

          <button type="submit" className="btn-primary auth-btn" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Create Account'}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default Signup;