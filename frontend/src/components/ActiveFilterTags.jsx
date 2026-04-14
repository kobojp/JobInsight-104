/**
 * ActiveFilterTags — 顯示目前已啟用的篩選條件，逐一刪除
 */
export default function ActiveFilterTags({ filters, onChange }) {
  const tags = []

  ;(filters.areas || []).forEach(a =>
    tags.push({ label: `縣市：${a}`, clear: () => onChange({ areas: filters.areas.filter(x => x !== a) }) })
  )
  ;(filters.districts || []).forEach(d =>
    tags.push({ label: `區：${d}`, clear: () => onChange({ districts: filters.districts.filter(x => x !== d) }) })
  )
  if (filters.salary_min !== '')
    tags.push({ label: `薪資 ≥ ${Number(filters.salary_min).toLocaleString()}`, clear: () => onChange({ salary_min: '' }) })
  if (filters.job_name)
    tags.push({ label: `職缺：${filters.job_name}`, clear: () => onChange({ job_name: '' }) })
  if (filters.company)
    tags.push({ label: `公司：${filters.company}`, clear: () => onChange({ company: '' }) })
  if (filters.date_from)
    tags.push({ label: `從 ${filters.date_from}`, clear: () => onChange({ date_from: '' }) })
  if (filters.date_to)
    tags.push({ label: `到 ${filters.date_to}`, clear: () => onChange({ date_to: '' }) })
  if (filters.apply_min !== '')
    tags.push({ label: `應徵 ≥ ${filters.apply_min}人`, clear: () => onChange({ apply_min: '' }) })
  if (filters.apply_max !== '')
    tags.push({ label: `應徵 ≤ ${filters.apply_max}人`, clear: () => onChange({ apply_max: '' }) })
  ;(filters.tags || []).forEach(t =>
    tags.push({ label: `tag：${t}`, clear: () => onChange({ tags: filters.tags.filter(x => x !== t) }) })
  )

  if (tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <span className="text-xs text-gray-400">篩選中：</span>
      {tags.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full"
        >
          {tag.label}
          <button
            onClick={tag.clear}
            className="ml-0.5 hover:text-blue-900 font-bold leading-none"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  )
}
