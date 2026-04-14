import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

export default function JobTypeChart({ data = [] }) {
  if (!data.length) {
    return <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">無資料</div>
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="45%"
          outerRadius={70}
          label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v) => [`${v} 筆`, '職缺數']} />
      </PieChart>
    </ResponsiveContainer>
  )
}
