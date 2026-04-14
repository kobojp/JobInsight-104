function Card({ title, value, sub, color = 'blue' }) {
  const colors = {
    blue:  'bg-blue-50 border-blue-200 text-blue-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    purple:'bg-purple-50 border-purple-200 text-purple-700',
    orange:'bg-orange-50 border-orange-200 text-orange-700',
  }
  return (
    <div className={`border rounded-lg p-5 ${colors[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-70">{title}</p>
      <p className="text-3xl font-bold mt-1">{value ?? '—'}</p>
      {sub && <p className="text-xs mt-1 opacity-60">{sub}</p>}
    </div>
  )
}

export default function KPICards({ kpi }) {
  const {
    total_jobs = 0,
    avg_salary_low,
    top_area,
    disclosed_salary_pct = 0,
  } = kpi || {}

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card
        title="職缺總數"
        value={total_jobs.toLocaleString()}
        color="blue"
      />
      <Card
        title="平均薪資下限"
        value={avg_salary_low ? `${(avg_salary_low / 1000).toFixed(1)}K` : '未揭露'}
        sub={avg_salary_low ? `每月 ${avg_salary_low.toLocaleString()} 元` : ''}
        color="green"
      />
      <Card
        title="最多職缺地區"
        value={top_area || '—'}
        color="purple"
      />
      <Card
        title="薪資揭露率"
        value={`${disclosed_salary_pct}%`}
        sub="填寫薪資的職缺比例"
        color="orange"
      />
    </div>
  )
}
