import './common.css';

const colorMap = {
  primary: { bg: '#EEF2FF', color: '#4F46E5' },
  success: { bg: '#DCFCE7', color: '#16A34A' },
  warning: { bg: '#FEF9C3', color: '#CA8A04' },
  muted:   { bg: '#F1F5F9', color: '#64748B' },
};

const StatCard = ({ label, value, color }) => {
  const { bg, color: textColor } = colorMap[color] || colorMap.muted;
  return (
    <div className="stat-card">
      <div className="stat-value" style={{ color: textColor }}>{value}</div>
      <div className="stat-label">{label}</div>
      <div className="stat-bar" style={{ background: bg }}>
        <div className="stat-bar-fill" style={{ background: textColor, width: '60%' }} />
      </div>
    </div>
  );
};

export default StatCard;