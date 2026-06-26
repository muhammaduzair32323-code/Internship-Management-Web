import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import EmptyState from '../common/EmptyState';

const DepartmentChart = ({ data }) => {
  if (!data || data.length === 0) return <EmptyState message="No department data yet" />;

  const formatted = data.map(d => ({
    name: d.department,
    count: parseInt(d.count),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={formatted} barSize={32}>
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip cursor={{ fill: '#F1F5F9' }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]} fill="#4F46E5" />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default DepartmentChart;