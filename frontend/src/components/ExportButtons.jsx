import { useState } from 'react'
import html2canvas from 'html2canvas'

const BASE = '/api'

function buildFilterParams(filters) {
  const p = new URLSearchParams()
  if (filters.areas?.length)     p.set('areas', filters.areas.join(','))
  if (filters.districts?.length) p.set('districts', filters.districts.join(','))
  if (filters.salary_min !== '' && filters.salary_min != null) p.set('salary_min', filters.salary_min)
  if (filters.job_name)  p.set('job_name', filters.job_name)
  if (filters.company)   p.set('company', filters.company)
  if (filters.date_from) p.set('date_from', filters.date_from)
  if (filters.date_to)   p.set('date_to', filters.date_to)
  if (filters.apply_min !== '' && filters.apply_min != null) p.set('apply_min', filters.apply_min)
  if (filters.apply_max !== '' && filters.apply_max != null) p.set('apply_max', filters.apply_max)
  if (filters.tags?.length) p.set('tags', filters.tags.join(','))
  if (filters.sort_by)  p.set('sort_by', filters.sort_by)
  if (filters.sort_dir) p.set('sort_dir', filters.sort_dir)
  return p
}

function hasActiveFilter(filters) {
  return !!(
    filters.areas?.length || filters.districts?.length ||
    (filters.salary_min !== '' && filters.salary_min != null) ||
    filters.job_name || filters.company ||
    filters.date_from || filters.date_to ||
    (filters.apply_min !== '' && filters.apply_min != null) ||
    (filters.apply_max !== '' && filters.apply_max != null) ||
    filters.tags?.length
  )
}

// Trigger browser download from a URL
function downloadUrl(url, filename) {
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

export default function ExportButtons({ taskId, filters, stats, chartsRef }) {
  const [pdfLoading, setPdfLoading] = useState(null) // 'all' | 'filtered' | null

  const isFiltered = hasActiveFilter(filters)

  // --- CSV ---
  function handleCsv(filtered) {
    const p = new URLSearchParams()
    if (filtered) {
      p.set('filtered', 'true')
      buildFilterParams(filters).forEach((v, k) => p.set(k, v))
    }
    const url = `${BASE}/tasks/${taskId}/export/csv?${p}`
    downloadUrl(url, `jobinsight_${filtered ? 'filtered' : 'all'}.csv`)
  }

  // --- PDF (server-side via Playwright) ---
  async function handlePdf(filtered) {
    setPdfLoading(filtered ? 'filtered' : 'all')
    try {
      // 1. Capture charts as base64 image
      let charts_b64 = ''
      if (chartsRef?.current) {
        const canvas = await html2canvas(chartsRef.current, { scale: 1.5, useCORS: true })
        charts_b64 = canvas.toDataURL('image/png')
      }

      // 2. Build request body
      const body = { filtered, charts_b64 }
      if (filtered) {
        const f = filters
        if (f.areas?.length)     body.areas     = f.areas.join(',')
        if (f.districts?.length) body.districts = f.districts.join(',')
        if (f.salary_min !== '' && f.salary_min != null) body.salary_min = parseInt(f.salary_min)
        if (f.job_name)  body.job_name  = f.job_name
        if (f.company)   body.company   = f.company
        if (f.date_from) body.date_from = f.date_from
        if (f.date_to)   body.date_to   = f.date_to
        if (f.apply_min !== '' && f.apply_min != null) body.apply_min = parseInt(f.apply_min)
        if (f.apply_max !== '' && f.apply_max != null) body.apply_max = parseInt(f.apply_max)
        if (f.tags?.length) body.tags   = f.tags.join(',')
        if (f.sort_by)   body.sort_by   = f.sort_by
        if (f.sort_dir)  body.sort_dir  = f.sort_dir
      }

      // 3. POST to backend → receive PDF bytes
      const res = await fetch(`${BASE}/tasks/${taskId}/export/pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) throw new Error(`Server error: ${res.status}`)

      // 4. Download
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      downloadUrl(url, `jobinsight_${filtered ? 'filtered' : 'all'}.pdf`)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error('PDF export failed:', e)
      alert('PDF 匯出失敗，請稍後再試。')
    } finally {
      setPdfLoading(null)
    }
  }

  return (
    <>
    {/* PDF 產生中遮罩 */}
    {pdfLoading !== null && (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl px-10 py-8 flex flex-col items-center gap-4 min-w-[260px]">
          {/* Spinner */}
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          {/* 主訊息 */}
          <p className="text-base font-semibold text-gray-800">正在產生 PDF</p>
          {/* 副訊息 */}
          <p className="text-sm text-gray-500 text-center">
            Chromium 渲染中，請稍候⋯<br />
            <span className="text-xs text-gray-400">資料量較多時需要數秒</span>
          </p>
          {/* 跑馬燈進度條 */}
          <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full animate-[progress_1.5s_ease-in-out_infinite]"
                 style={{animation: 'indeterminate 1.5s ease-in-out infinite'}} />
          </div>
        </div>
      </div>
    )}
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-gray-400 mr-1">匯出：</span>

      {/* CSV buttons */}
      <button
        onClick={() => handleCsv(false)}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-green-500 text-green-700 hover:bg-green-50 transition-colors"
        title="匯出全部資料為 CSV"
      >
        <CsvIcon /> 全部 CSV
      </button>
      <button
        onClick={() => handleCsv(true)}
        disabled={!isFiltered}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-green-500 text-green-700 hover:bg-green-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title={isFiltered ? '匯出篩選結果為 CSV' : '請先設定篩選條件'}
      >
        <CsvIcon /> 篩選 CSV
      </button>

      {/* PDF buttons */}
      <button
        onClick={() => handlePdf(false)}
        disabled={pdfLoading !== null}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-red-400 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title="匯出全部資料為 PDF"
      >
        <PdfIcon /> {pdfLoading === 'all' ? '產生中...' : '全部 PDF'}
      </button>
      <button
        onClick={() => handlePdf(true)}
        disabled={!isFiltered || pdfLoading !== null}
        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-red-400 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        title={isFiltered ? '匯出篩選結果為 PDF' : '請先設定篩選條件'}
      >
        <PdfIcon /> {pdfLoading === 'filtered' ? '產生中...' : '篩選 PDF'}
      </button>
    </div>
    <style>{`
      @keyframes indeterminate {
        0%   { transform: translateX(-100%) scaleX(0.4); }
        50%  { transform: translateX(0%)    scaleX(0.6); }
        100% { transform: translateX(100%)  scaleX(0.4); }
      }
    `}</style>
    </>
  )
}

function CsvIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
    </svg>
  )
}

function PdfIcon() {
  return (
    <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
    </svg>
  )
}
