import { useState, useEffect } from 'react'
import AreaSelector from './AreaSelector'
import { buildAreaParam, parseAreaParam } from '../data/areas'

const ORDER_OPTIONS = [
  { value: 'relevance', label: '相關性' },
  { value: 'date', label: '最新刊登' },
  { value: 'salary', label: '薪資高低' },
]

export default function SearchForm({ onSearch, loading, initialValues }) {
  const [keyword, setKeyword] = useState('')
  const [selectedCities, setSelectedCities] = useState(['taipei'])
  const [districtSelections, setDistrictSelections] = useState({})
  const [order, setOrder] = useState('relevance')
  const [maxPages, setMaxPages] = useState('')
  const [salaryFrom, setSalaryFrom] = useState('')
  const [salaryTo, setSalaryTo] = useState('')
  const [jobType, setJobType] = useState('')
  const [weekend, setWeekend] = useState('')

  // When initialValues changes (from re-search), reset form fields
  useEffect(() => {
    if (!initialValues) return
    setKeyword(initialValues.keyword || '')
    setOrder(initialValues.order || 'relevance')
    setMaxPages(initialValues.max_pages != null ? String(initialValues.max_pages) : '')
    setSalaryFrom(initialValues.salary_from != null ? String(initialValues.salary_from) : '')
    setSalaryTo(initialValues.salary_to != null ? String(initialValues.salary_to) : '')
    setJobType(initialValues.ro || '')
    setWeekend(initialValues.s5 || '')
    const { selectedCities: cities, districtSelections: districts } = parseAreaParam(initialValues.area)
    setSelectedCities(cities)
    setDistrictSelections(districts)
  }, [initialValues])

  const handleDistrictChange = (city, keys) => {
    setDistrictSelections(prev => ({ ...prev, [city]: keys }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (selectedCities.length === 0) return alert('請至少選擇一個地區')
    onSearch({
      keyword,
      area: buildAreaParam(selectedCities, districtSelections),
      order,
      max_pages: maxPages ? parseInt(maxPages) : null,
      pagesize: 20,
      ro: jobType || null,
      s5: weekend || null,
      salary_from: salaryFrom ? parseInt(salaryFrom) : null,
      salary_to: salaryTo ? parseInt(salaryTo) : null,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">搜尋條件</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Keyword */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-medium text-gray-600 mb-1">關鍵字</label>
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            placeholder="例：Python、數據分析"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Order */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">排序方式</label>
          <select
            value={order}
            onChange={e => setOrder(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {ORDER_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        {/* Max Pages */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">最多爬取頁數</label>
          <input
            type="number"
            value={maxPages}
            onChange={e => setMaxPages(e.target.value)}
            placeholder="留空 = 全部"
            min="1"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Salary From */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">薪資下限（元）</label>
          <input
            type="number"
            value={salaryFrom}
            onChange={e => setSalaryFrom(e.target.value)}
            placeholder="例：40000"
            step="1000"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Salary To */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">薪資上限（元）</label>
          <input
            type="number"
            value={salaryTo}
            onChange={e => setSalaryTo(e.target.value)}
            placeholder="例：80000"
            step="1000"
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Weekend */}
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">周休條件</label>
          <select
            value={weekend}
            onChange={e => setWeekend(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">不限</option>
            <option value="1">周休二日</option>
          </select>
        </div>
      </div>

      {/* Area selector (two-step: city → district) */}
      <div className="mt-4">
        <AreaSelector
          selectedCities={selectedCities}
          districtSelections={districtSelections}
          onCitiesChange={setSelectedCities}
          onDistrictsChange={handleDistrictChange}
        />
      </div>

      <div className="mt-5">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-8 py-2.5 rounded-lg transition-colors"
        >
          {loading ? '查詢中...' : '開始查詢'}
        </button>
      </div>
    </form>
  )
}
