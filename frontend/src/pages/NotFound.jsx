import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '16px' }}>
      <h1 style={{ fontSize: '48px', fontWeight: '700', color: '#0F172A' }}>404</h1>
      <p style={{ color: '#64748B', fontSize: '16px' }}>Page not found</p>
      <button className="btn-primary" onClick={() => navigate('/dashboard')}>Go to Dashboard</button>
    </div>
  );
};

export default NotFound;