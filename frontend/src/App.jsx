import { useState, useEffect, useRef, useCallback } from 'react'
import SearchForm from './components/SearchForm'
import KPICards from './components/KPICards'
import JobTable from './components/JobTable'
import ProgressBar from './components/ProgressBar'
import FilterBar from './components/FilterBar'
import ActiveFilterTags from './components/ActiveFilterTags'
import ExportButtons from './components/ExportButtons'
import HistoryTab from './components/HistoryTab'
import SalaryChart from './components/charts/SalaryChart'
import AreaChart from './components/charts/AreaChart'
import JobTypeChart from './components/charts/JobTypeChart'
import { startSearch, getTaskStatus, getTaskResults, cancelTask } from './api/client'

const DEFAULT_FILTERS = {
  areas: [],
  districts: [],
  salary_min: '',
  job_name: '',
  company: '',
  date_from: '',
  date_to: '',
  apply_min: '',
  apply_max: '',
  tags: [],
  sort_by: 'appear_date',
  sort_dir: 'desc',
}

export default function App() {
  const [tab, setTab] = useState('search')          // 'search' | 'history'
  const [phase, setPhase] = useState('idle')        // idle | loading | done | error
  const [taskId, setTaskId] = useState(null)
  const [progress, setProgress] = useState(null)
  const [results, setResults] = useState(null)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [filterOptions, setFilterOptions] = useState(null)
  const [cancelling, setCancelling] = useState(false)
  const [reSearchParams, setReSearchParams] = useState(null)
  const intervalRef = useRef(null)
  const chartsRef = useRef(null)

  // ----- Search (new task) -----
  const handleSearch = async (formData) => {
    setPhase('loading')
    setResults(null)
    setError(null)
    setProgress(null)
    setCurrentPage(1)
    setFilters(DEFAULT_FILTERS)
    setFilterOptions(null)
    setCancelling(false)
    setTab('search')
    try {
      const { task_id } = await startSearch(formData)
      setTaskId(task_id)
    } catch (e) {
      setError(e.message)
      setPhase('error')
    }
  }

  // ----- Poll while loading -----
  useEffect(() => {
    if (!taskId || phase !== 'loading') return

    const poll = async () => {
      try {
        const status = await getTaskStatus(taskId)
        setProgress(status.progress)

        if (status.status === 'done' || status.status === 'cancelled') {
          clearInterval(intervalRef.current)
          const data = await getTaskResults(taskId, 1, 50, DEFAULT_FILTERS)
          setResults(data)
          if (data?.filter_options) setFilterOptions(data.filter_options)
          setCancelling(false)
          setPhase('done')
        } else if (status.status === 'failed') {
          clearInterval(intervalRef.current)
          setError(status.error || '爬取失敗')
          setCancelling(false)
          setPhase('error')
        }
      } catch (e) {
        clearInterval(intervalRef.current)
        setError(e.message)
        setPhase('error')
      }
    }

    poll()
    intervalRef.current = setInterval(poll, 2000)
    return () => clearInterval(intervalRef.current)
  }, [taskId, phase])

  // ----- Filter / page changes -----
  const fetchResults = useCallback(async (page, activeFilters) => {
    if (!taskId) return
    try {
      const data = await getTaskResults(taskId, page, 50, activeFilters)
      if (!data) return
      setResults(prev => ({ ...prev, jobs: data.jobs, total: data.total, page: data.page }))
    } catch (e) {
      setError(e.message)
    }
  }, [taskId])

  const handleFilterChange = useCallback((partial) => {
    setFilters(prev => {
      const next = { ...prev, ...partial }
      setCurrentPage(1)
      fetchResults(1, next)
      return next
    })
  }, [fetchResults])

  const handlePageChange = useCallback((newPage) => {
    setCurrentPage(newPage)
    fetchResults(newPage, filters)
  }, [fetchResults, filters])

  const handleReset = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    setCurrentPage(1)
    fetchResults(1, DEFAULT_FILTERS)
  }, [fetchResults])

  const handleCancel = useCallback(async () => {
    if (!taskId || cancelling) return
    setCancelling(true)
    try {
      await cancelTask(taskId)
    } catch (e) {
      setCancelling(false)
    }
  }, [taskId, cancelling])

  // ----- History: view result (load existing task) -----
  const handleViewResult = useCallback(async (histTaskId) => {
    setPhase('loading')
    setResults(null)
    setError(null)
    setProgress(null)
    setCurrentPage(1)
    setFilters(DEFAULT_FILTERS)
    setFilterOptions(null)
    setCancelling(false)
    setTaskId(histTaskId)
    setTab('search')
    try {
      const data = await getTaskResults(histTaskId, 1, 50, DEFAULT_FILTERS)
      setResults(data)
      if (data?.filter_options) setFilterOptions(data.filter_options)
      setPhase('done')
    } catch (e) {
      setError(e.message)
      setPhase('error')
    }
  }, [])

  // ----- History: re-search (start new task with same params) -----
  const handleReSearch = useCallback((params) => {
    setReSearchParams({ ...params, _ts: Date.now() }) // _ts forces useEffect re-trigger if same params
    setTab('search')
    handleSearch(params)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-700 text-white py-4 px-6 shadow">
        <h1 className="text-2xl font-bold tracking-wide">JobInsight 104</h1>
        <p className="text-blue-200 text-sm mt-0.5">104人力銀行職缺查詢與分析平台</p>
      </header>

      {/* Tab Bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 flex gap-0">
          <button
            onClick={() => setTab('search')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'search'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            查詢
          </button>
          <button
            onClick={() => setTab('history')}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            歷史紀錄
          </button>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">

        {/* ── 查詢 Tab ── */}
        {tab === 'search' && (
          <>
            <SearchForm onSearch={handleSearch} loading={phase === 'loading'} initialValues={reSearchParams} />

            {phase === 'loading' && (
              <ProgressBar progress={progress} onCancel={handleCancel} cancelling={cancelling} />
            )}

            {phase === 'error' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
                <p className="font-semibold">查詢失敗</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}

            {phase === 'done' && results && (
              <>
                <KPICards kpi={results.stats.kpi} />

                <div ref={chartsRef} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <div className="lg:col-span-1 bg-white rounded-lg shadow p-4">
                    <h2 className="font-semibold text-gray-700 mb-3">薪資分布</h2>
                    <SalaryChart data={results.stats.salary_distribution} />
                  </div>
                  <div className="lg:col-span-1 bg-white rounded-lg shadow p-4">
                    <h2 className="font-semibold text-gray-700 mb-3">各地區職缺數</h2>
                    <AreaChart data={results.stats.area_distribution} />
                  </div>
                  <div className="lg:col-span-1 bg-white rounded-lg shadow p-4">
                    <h2 className="font-semibold text-gray-700 mb-3">工作型態</h2>
                    <JobTypeChart data={results.stats.job_type_distribution} />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                  <div className="flex-1">
                    <FilterBar
                      filterOptions={filterOptions}
                      filters={filters}
                      onChange={handleFilterChange}
                      onReset={handleReset}
                    />
                  </div>
                  <div className="bg-white rounded-lg shadow px-4 py-3 flex items-center">
                    <ExportButtons
                      taskId={taskId}
                      filters={filters}
                      stats={results.stats}
                      chartsRef={chartsRef}
                    />
                  </div>
                </div>

                <ActiveFilterTags filters={filters} onChange={handleFilterChange} />

                <JobTable
                  jobs={results.jobs}
                  total={results.total}
                  page={currentPage}
                  pageSize={50}
                  onPageChange={handlePageChange}
                  filters={filters}
                  filterOptions={filterOptions}
                  onFilterChange={handleFilterChange}
                  sortBy={filters.sort_by}
                  sortDir={filters.sort_dir}
                />
              </>
            )}
          </>
        )}

        {/* ── 歷史紀錄 Tab ── */}
        {tab === 'history' && (
          <HistoryTab
            onViewResult={handleViewResult}
            onReSearch={handleReSearch}
          />
        )}
      </main>
    </div>
  )
}
