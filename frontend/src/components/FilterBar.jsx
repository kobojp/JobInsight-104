import { useState } from 'react'

/**
 * FilterBar — 上方快速篩選列
 * Props:
 *   filterOptions: { cities, salary_range, apply_range, date_range, tags }
 *   filters: current filter state
 *   onChange: (partialFilters) => void
 *   onReset: () => void
 */
export default function FilterBar({ filterOptions, filters, onChange, onReset }) {
  const [cityOpen, setCityOpen] = useState(false)
  const [districtOpen, setDistrictOpen] = useState(false)

  if (!filterOptions) return null

  const { cities = {}, salary_range = {}, apply_range = {}, date_range = {}, tags: allTags = [] } = filterOptions
  const cityList = Object.keys(cities)

  const hasActiveFilter =
    filters.areas?.length ||
    filters.districts?.length ||
    filters.salary_min !== '' ||
    filters.job_name ||
    filters.company ||
    filters.date_from ||
    filters.date_to ||
    filters.apply_min !== '' ||
    filters.apply_max !== '' ||
    filters.tags?.length

  function toggleCity(city) {
    const current = filters.areas || []
    const next = current.includes(city)
      ? current.filter(c => c !== city)
      : [...current, city]
    // Remove districts that belong to removed cities
    const validDistricts = (filters.districts || []).filter(d =>
      next.some(c => cities[c]?.includes(d))
    )
    onChange({ areas: next, districts: validDistricts })
  }

  function toggleDistrict(district) {
    const current = filters.districts || []
    const next = current.includes(district)
      ? current.filter(d => d !== district)
      : [...current, district]
    onChange({ districts: next })
  }

  // Districts available = union of selected cities' districts
  const availableDistricts = (filters.areas || []).flatMap(c => cities[c] || [])

  return (
    <div className="bg-white rounded-lg shadow px-4 py-3 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-700">篩選條件</span>
        {hasActiveFilter && (
          <button
            onClick={onReset}
            className="text-xs text-red-500 hover:text-red-700 underline"
          >
            清除全部
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        {/* 縣市 */}
        <div className="relative">
          <label className="text-xs text-gray-500 block mb-1">縣市</label>
          <button
            onClick={() => { setCityOpen(v => !v); setDistrictOpen(false) }}
            className={`text-sm border rounded px-3 py-1.5 min-w-[100px] text-left ${
              filters.areas?.length ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-gray-300'
            }`}
          >
            {filters.areas?.length ? filters.areas.join(', ') : '全部縣市'}
            <span className="ml-1 text-gray-400">▾</span>
          </button>
          {cityOpen && (
            <div className="absolute z-20 top-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto w-40">
              {cityList.map(city => (
                <label key={city} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={(filters.areas || []).includes(city)}
                    onChange={() => toggleCity(city)}
                  />
                  {city}
                </label>
              ))}
            </div>
          )}
        </div>

        {/* 區（只在有選縣市時顯示） */}
        {availableDistricts.length > 0 && (
          <div className="relative">
            <label className="text-xs text-gray-500 block mb-1">區</label>
            <button
              onClick={() => { setDistrictOpen(v => !v); setCityOpen(false) }}
              className={`text-sm border rounded px-3 py-1.5 min-w-[100px] text-left ${
                filters.districts?.length ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-gray-300'
              }`}
            >
              {filters.districts?.length ? `已選 ${filters.districts.length} 區` : '全部區'}
              <span className="ml-1 text-gray-400">▾</span>
            </button>
            {districtOpen && (
              <div className="absolute z-20 top-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto w-44">
                {availableDistricts.map(d => (
                  <label key={d} className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={(filters.districts || []).includes(d)}
                      onChange={() => toggleDistrict(d)}
                    />
                    {d}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 薪資下限 */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">月薪下限</label>
          <input
            type="number"
            placeholder={salary_range.min ? `最低 ${(salary_range.min/1000).toFixed(0)}K` : '輸入金額'}
            value={filters.salary_min}
            onChange={e => onChange({ salary_min: e.target.value })}
            className="text-sm border border-gray-300 rounded px-3 py-1.5 w-28"
          />
        </div>

        {/* 職缺名稱 */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">職缺名稱</label>
          <input
            type="text"
            placeholder="關鍵字"
            value={filters.job_name}
            onChange={e => onChange({ job_name: e.target.value })}
            className="text-sm border border-gray-300 rounded px-3 py-1.5 w-28"
          />
        </div>

        {/* 公司名稱 */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">公司名稱</label>
          <input
            type="text"
            placeholder="關鍵字"
            value={filters.company}
            onChange={e => onChange({ company: e.target.value })}
            className="text-sm border border-gray-300 rounded px-3 py-1.5 w-28"
          />
        </div>

        {/* 刊登日範圍 */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">刊登日</label>
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={filters.date_from}
              min={date_range.min}
              max={date_range.max}
              onChange={e => onChange({ date_from: e.target.value })}
              className="text-sm border border-gray-300 rounded px-2 py-1.5 w-34"
            />
            <span className="text-gray-400 text-xs">~</span>
            <input
              type="date"
              value={filters.date_to}
              min={date_range.min}
              max={date_range.max}
              onChange={e => onChange({ date_to: e.target.value })}
              className="text-sm border border-gray-300 rounded px-2 py-1.5 w-34"
            />
          </div>
        </div>

        {/* 應徵人數 */}
        <div>
          <label className="text-xs text-gray-500 block mb-1">應徵人數</label>
          <div className="flex items-center gap-1">
            <input
              type="number"
              placeholder="最少"
              value={filters.apply_min}
              onChange={e => onChange({ apply_min: e.target.value })}
              className="text-sm border border-gray-300 rounded px-2 py-1.5 w-16"
            />
            <span className="text-gray-400 text-xs">~</span>
            <input
              type="number"
              placeholder="最多"
              value={filters.apply_max}
              onChange={e => onChange({ apply_max: e.target.value })}
              className="text-sm border border-gray-300 rounded px-2 py-1.5 w-16"
            />
          </div>
        </div>
      </div>

      {/* 關閉下拉時點擊空白處 */}
      {(cityOpen || districtOpen) && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => { setCityOpen(false); setDistrictOpen(false) }}
        />
      )}
    </div>
  )
}
