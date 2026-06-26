import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import EmptyState from '../common/EmptyState';

const COLORS = { pending: '#F59E0B', completed: '#22C55E' };

const TaskStatusChart = ({ data }) => {
  if (!data || data.length === 0) return <EmptyState message="No task data yet" />;

  const formatted = data.map(d => ({
    name: d.status.charAt(0).toUpperCase() + d.status.slice(1),
    value: parseInt(d.count),
    color: COLORS[d.status] || '#64748B',
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={formatted} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
          {formatted.map((entry, i) => <Cell key={i} fill={entry.color} />)}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default TaskStatusChart;