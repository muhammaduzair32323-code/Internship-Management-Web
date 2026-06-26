import './common.css';

const EmptyState = ({ message = 'No data found' }) => (
  <div className="empty-state">
    <div className="empty-icon">○</div>
    <p className="empty-text">{message}</p>
  </div>
);

export default EmptyState;