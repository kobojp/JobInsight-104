import { useState, useRef, useEffect } from 'react'

/**
 * ColumnFilter — 欄位標題的 Excel 式篩選 Dropdown
 */
function ColumnFilter({ column, filterOptions, filters, onChange, onSort, sortBy, sortDir }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const isActive = isColumnFiltered(column, filters)
  const isSorted = sortBy === column.sortKey

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`ml-1 px-1 py-0.5 rounded text-xs ${
          isActive ? 'text-blue-600 bg-blue-100' : 'text-gray-400 hover:text-gray-600'
        }`}
        title="篩選 / 排序"
      >
        {isActive ? '▼' : '⬇'}
      </button>

      {open && (
        <div className={`absolute z-30 top-full mt-1 bg-white border rounded shadow-xl w-56 text-sm ${column.alignRight ? 'right-0' : 'left-0'}`}>
          {/* Sort */}
          {column.sortKey && (
            <div className="border-b px-3 py-2 space-y-1">
              <button
                onClick={() => { onSort(column.sortKey, 'asc'); setOpen(false) }}
                className={`block w-full text-left px-1 py-0.5 rounded hover:bg-gray-100 ${isSorted && sortDir === 'asc' ? 'text-blue-600 font-semibold' : ''}`}
              >
                升冪排序 (A → Z)
              </button>
              <button
                onClick={() => { onSort(column.sortKey, 'desc'); setOpen(false) }}
                className={`block w-full text-left px-1 py-0.5 rounded hover:bg-gray-100 ${isSorted && sortDir === 'desc' ? 'text-blue-600 font-semibold' : ''}`}
              >
                降冪排序 (Z → A)
              </button>
            </div>
          )}

          {/* Filter UI per column type */}
          <div className="px-3 py-2">
            {column.key === 'job_name' && (
              <TextFilter label="職缺名稱" value={filters.job_name} onChange={v => onChange({ job_name: v })} />
            )}
            {column.key === 'company_name' && (
              <TextFilter label="公司名稱" value={filters.company} onChange={v => onChange({ company: v })} />
            )}
            {column.key === 'job_addr_no_desc' && (
              <AreaFilter
                cities={filterOptions?.cities || {}}
                areas={filters.areas || []}
                districts={filters.districts || []}
                onChange={onChange}
              />
            )}
            {column.key === 'salary' && (
              <SalaryFilter
                value={filters.salary_min}
                onChange={v => onChange({ salary_min: v })}
              />
            )}
            {column.key === 'appear_date' && (
              <DateFilter
                from={filters.date_from}
                to={filters.date_to}
                min={filterOptions?.date_range?.min}
                max={filterOptions?.date_range?.max}
                onChange={onChange}
              />
            )}
            {column.key === 'apply_cnt' && (
              <RangeFilter
                label="應徵人數"
                minVal={filters.apply_min}
                maxVal={filters.apply_max}
                onChange={(min, max) => onChange({ apply_min: min, apply_max: max })}
              />
            )}
            {column.key === 'tags' && (
              <TagsFilter
                allTags={filterOptions?.tags || []}
                selected={filters.tags || []}
                onChange={tags => onChange({ tags })}
              />
            )}
          </div>

          <div className="border-t px-3 py-2">
            <button
              onClick={() => { clearColumnFilter(column, onChange); setOpen(false) }}
              className="text-xs text-red-500 hover:text-red-700"
            >
              清除此欄篩選
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TextFilter({ label, value, onChange }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="關鍵字"
        className="w-full border rounded px-2 py-1 text-sm"
        autoFocus
      />
    </div>
  )
}

function SalaryFilter({ value, onChange }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">月薪下限</label>
      <input
        type="number"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="例：40000"
        className="w-full border rounded px-2 py-1 text-sm"
        autoFocus
      />
    </div>
  )
}

function DateFilter({ from, to, min, max, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-500 block">刊登日範圍</label>
      <input type="date" value={from || ''} min={min} max={max}
        onChange={e => onChange({ date_from: e.target.value })}
        className="w-full border rounded px-2 py-1 text-sm" />
      <input type="date" value={to || ''} min={min} max={max}
        onChange={e => onChange({ date_to: e.target.value })}
        className="w-full border rounded px-2 py-1 text-sm" />
    </div>
  )
}

function RangeFilter({ label, minVal, maxVal, onChange }) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-gray-500 block">{label}</label>
      <div className="flex items-center gap-1">
        <input type="number" value={minVal || ''} placeholder="最少"
          onChange={e => onChange(e.target.value, maxVal)}
          className="w-full border rounded px-2 py-1 text-sm" />
        <span className="text-gray-400">~</span>
        <input type="number" value={maxVal || ''} placeholder="最多"
          onChange={e => onChange(minVal, e.target.value)}
          className="w-full border rounded px-2 py-1 text-sm" />
      </div>
    </div>
  )
}

function AreaFilter({ cities, areas, districts, onChange }) {
  const cityList = Object.keys(cities)
  const availableDistricts = areas.flatMap(c => cities[c] || [])

  function toggleCity(city) {
    const next = areas.includes(city) ? areas.filter(c => c !== city) : [...areas, city]
    const validDistricts = districts.filter(d => next.some(c => cities[c]?.includes(d)))
    onChange({ areas: next, districts: validDistricts })
  }
  function toggleDistrict(d) {
    const next = districts.includes(d) ? districts.filter(x => x !== d) : [...districts, d]
    onChange({ districts: next })
  }

  return (
    <div className="space-y-2 max-h-48 overflow-y-auto">
      <label className="text-xs text-gray-500 block">縣市</label>
      {cityList.map(city => (
        <label key={city} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-gray-50">
          <input type="checkbox" checked={areas.includes(city)} onChange={() => toggleCity(city)} />
          {city}
        </label>
      ))}
      {availableDistricts.length > 0 && (
        <>
          <label className="text-xs text-gray-500 block pt-1 border-t">區</label>
          {availableDistricts.map(d => (
            <label key={d} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-gray-50">
              <input type="checkbox" checked={districts.includes(d)} onChange={() => toggleDistrict(d)} />
              {d}
            </label>
          ))}
        </>
      )}
    </div>
  )
}

function TagsFilter({ allTags, selected, onChange }) {
  return (
    <div className="space-y-1 max-h-48 overflow-y-auto">
      <label className="text-xs text-gray-500 block">Tags</label>
      {allTags.map(tag => (
        <label key={tag} className="flex items-center gap-2 cursor-pointer text-sm hover:bg-gray-50">
          <input
            type="checkbox"
            checked={selected.includes(tag)}
            onChange={() => {
              const next = selected.includes(tag) ? selected.filter(t => t !== tag) : [...selected, tag]
              onChange(next)
            }}
          />
          {tag}
        </label>
      ))}
    </div>
  )
}

function isColumnFiltered(column, filters) {
  switch (column.key) {
    case 'job_name': return !!filters.job_name
    case 'company_name': return !!filters.company
    case 'job_addr_no_desc': return (filters.areas?.length || filters.districts?.length)
    case 'salary': return filters.salary_min !== ''
    case 'appear_date': return !!(filters.date_from || filters.date_to)
    case 'apply_cnt': return filters.apply_min !== '' || filters.apply_max !== ''
    case 'tags': return filters.tags?.length
    default: return false
  }
}

function clearColumnFilter(column, onChange) {
  switch (column.key) {
    case 'job_name': return onChange({ job_name: '' })
    case 'company_name': return onChange({ company: '' })
    case 'job_addr_no_desc': return onChange({ areas: [], districts: [] })
    case 'salary': return onChange({ salary_min: '' })
    case 'appear_date': return onChange({ date_from: '', date_to: '' })
    case 'apply_cnt': return onChange({ apply_min: '', apply_max: '' })
    case 'tags': return onChange({ tags: [] })
  }
}

// Column definitions
const COLUMNS = [
  { label: '職缺名稱', key: 'job_name',         sortKey: null },
  { label: '公司',     key: 'company_name',     sortKey: null },
  { label: '地區',     key: 'job_addr_no_desc', sortKey: null },
  { label: '薪資',     key: 'salary',           sortKey: 'salary_low' },
  { label: '刊登日',   key: 'appear_date',      sortKey: 'appear_date',  alignRight: true },
  { label: '應徵',     key: 'apply_cnt',        sortKey: 'apply_cnt',    alignRight: true },
  { label: 'Tags',     key: 'tags',             sortKey: null,           alignRight: true },
]

export default function JobTable({
  jobs = [], total, page, pageSize,
  onPageChange, filters, filterOptions, onFilterChange, sortBy, sortDir,
}) {
  const totalPages = Math.ceil(total / pageSize)

  function handleSort(key, dir) {
    onFilterChange({ sort_by: key, sort_dir: dir })
  }

  // Page buttons: show max 7, centered around current page
  const pageButtons = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = new Set([1, totalPages, page])
    for (let i = page - 2; i <= page + 2; i++) {
      if (i > 0 && i <= totalPages) pages.add(i)
    }
    return [...pages].sort((a, b) => a - b)
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h2 className="font-semibold text-gray-700">
          職缺列表{' '}
          <span className="text-gray-400 font-normal text-sm ml-1">共 {total} 筆</span>
        </h2>
        <span className="text-sm text-gray-400">第 {page} / {totalPages || 1} 頁</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              {COLUMNS.map(col => (
                <th key={col.key} className="px-4 py-3 text-left whitespace-nowrap">
                  <span className={sortBy === col.sortKey && col.sortKey ? 'text-blue-600' : ''}>
                    {col.label}
                  </span>
                  {sortBy === col.sortKey && col.sortKey && (
                    <span className="ml-0.5">{sortDir === 'asc' ? '↑' : '↓'}</span>
                  )}
                  <ColumnFilter
                    column={col}
                    filterOptions={filterOptions}
                    filters={filters}
                    onChange={onFilterChange}
                    onSort={handleSort}
                    sortBy={sortBy}
                    sortDir={sortDir}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {jobs.map((job, idx) => (
              <tr key={job.job_id || idx} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3">
                  <a href={job.job_url} target="_blank" rel="noopener noreferrer"
                    className="text-blue-600 hover:underline font-medium">
                    {job.job_name}
                  </a>
                </td>
                <td className="px-4 py-3">
                  <a href={job.company_url} target="_blank" rel="noopener noreferrer"
                    className="hover:underline text-gray-700">
                    {job.company_name}
                  </a>
                </td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                  {job.job_addr_no_desc}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {job.salary_low && job.salary_high ? (
                    <span className="text-green-700 font-medium">
                      {(job.salary_low / 1000).toFixed(0)}K–{(job.salary_high / 1000).toFixed(0)}K
                    </span>
                  ) : job.salary_low ? (
                    <span className="text-green-700">{(job.salary_low / 1000).toFixed(0)}K+</span>
                  ) : (
                    <span className="text-gray-400">未填寫</span>
                  )}
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{job.appear_date}</td>
                <td className="px-4 py-3 text-gray-500">{job.apply_cnt}人</td>
                <td className="px-4 py-3">
                  {job.tags && (
                    <div className="flex flex-wrap gap-1">
                      {job.tags.split('|').filter(Boolean).slice(0, 3).map((tag, i) => (
                        <span key={i} className="bg-blue-50 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="px-6 py-4 border-t flex items-center justify-center gap-2 flex-wrap">
          <button onClick={() => onPageChange(page - 1)} disabled={page <= 1}
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 hover:bg-gray-50">
            上一頁
          </button>
          {pageButtons().reduce((acc, p, i, arr) => {
            if (i > 0 && p - arr[i - 1] > 1) acc.push(<span key={`ellipsis-${p}`} className="px-1 text-gray-400">…</span>)
            acc.push(
              <button key={p} onClick={() => onPageChange(p)}
                className={`px-3 py-1.5 rounded border text-sm ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'hover:bg-gray-50'}`}>
                {p}
              </button>
            )
            return acc
          }, [])}
          <button onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}
            className="px-3 py-1.5 rounded border text-sm disabled:opacity-40 hover:bg-gray-50">
            下一頁
          </button>
        </div>
      )}
    </div>
  )
}
