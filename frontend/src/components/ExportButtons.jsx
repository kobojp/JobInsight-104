import { useState } from 'react'
import jsPDF from 'jspdf'
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

  // --- PDF ---
  async function handlePdf(filtered) {
    setPdfLoading(filtered ? 'filtered' : 'all')
    try {
      // 1. Fetch all jobs for this export
      const p = new URLSearchParams()
      if (filtered) {
        p.set('filtered', 'true')
        buildFilterParams(filters).forEach((v, k) => p.set(k, v))
      }
      const res = await fetch(`${BASE}/tasks/${taskId}/export/jobs?${p}`)
      const { jobs, total } = await res.json()

      // 2. Capture charts
      let chartsImgData = null
      if (chartsRef?.current) {
        const canvas = await html2canvas(chartsRef.current, { scale: 1.5, useCORS: true })
        chartsImgData = canvas.toDataURL('image/png')
        var chartsWidth = canvas.width
        var chartsHeight = canvas.height
      }

      // 3. Build PDF
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = pdf.internal.pageSize.getWidth()
      const pageH = pdf.internal.pageSize.getHeight()
      const margin = 12
      let y = margin

      // Title
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text('JobInsight-104 Report', margin, y)
      y += 8

      // Subtitle
      pdf.setFontSize(9)
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(120)
      const now = new Date().toLocaleString('zh-TW')
      const label = filtered ? 'Filtered' : 'All'
      pdf.text(`${label} | Total: ${total} jobs | Generated: ${now}`, margin, y)
      y += 6

      // KPI row
      if (stats?.kpi) {
        pdf.setTextColor(60)
        pdf.setFontSize(9)
        const { total_jobs, avg_salary_low, top_area, disclosed_salary_pct } = stats.kpi
        const kpiText = [
          `Jobs: ${total_jobs}`,
          avg_salary_low ? `Avg Salary: ${(avg_salary_low / 1000).toFixed(0)}K` : 'Avg Salary: N/A',
          top_area ? `Top Area: ${top_area}` : '',
          `Disclosed: ${disclosed_salary_pct}%`,
        ].filter(Boolean).join('   |   ')
        pdf.text(kpiText, margin, y)
        y += 7
      }

      // Charts image
      if (chartsImgData) {
        const maxW = pageW - margin * 2
        const scale = maxW / (chartsWidth / 1.5)
        const imgH = (chartsHeight / 1.5) * scale
        if (y + imgH > pageH - margin) { pdf.addPage(); y = margin }
        pdf.addImage(chartsImgData, 'PNG', margin, y, maxW, imgH)
        y += imgH + 6
      }

      // Table header
      const cols = [
        { label: 'Job Title',    key: 'job_name',         w: 60 },
        { label: 'Company',      key: 'company_name',     w: 40 },
        { label: 'Area',         key: 'job_addr_no_desc', w: 28 },
        { label: 'Salary',       key: '_salary',          w: 22 },
        { label: 'Date',         key: 'appear_date',      w: 22 },
        { label: 'Applicants',   key: 'apply_cnt',        w: 20 },
      ]
      const rowH = 6
      const fontSize = 7.5

      function drawTableHeader(yPos) {
        pdf.setFillColor(59, 130, 246)
        pdf.setTextColor(255)
        pdf.setFontSize(fontSize)
        pdf.setFont('helvetica', 'bold')
        let x = margin
        cols.forEach(col => {
          pdf.rect(x, yPos, col.w, rowH, 'F')
          pdf.text(col.label, x + 1.5, yPos + 4)
          x += col.w
        })
        return yPos + rowH
      }

      function drawRow(job, yPos, shade) {
        pdf.setFont('helvetica', 'normal')
        pdf.setTextColor(40)
        if (shade) { pdf.setFillColor(245, 247, 250); }
        else       { pdf.setFillColor(255, 255, 255); }
        let x = margin
        cols.forEach(col => {
          pdf.rect(x, yPos, col.w, rowH, 'F')
          let val = ''
          if (col.key === '_salary') {
            if (job.salary_low && job.salary_high) {
              val = `${(job.salary_low/1000).toFixed(0)}K-${(job.salary_high/1000).toFixed(0)}K`
            } else if (job.salary_low) {
              val = `${(job.salary_low/1000).toFixed(0)}K+`
            } else {
              val = 'N/A'
            }
          } else {
            val = String(job[col.key] ?? '')
          }
          // Truncate to fit
          const maxChars = Math.floor(col.w / 2.2)
          if (val.length > maxChars) val = val.slice(0, maxChars - 1) + '…'
          pdf.text(val, x + 1.5, yPos + 4)
          x += col.w
        })
        return yPos + rowH
      }

      if (y + rowH > pageH - margin) { pdf.addPage(); y = margin }
      y = drawTableHeader(y)

      jobs.forEach((job, idx) => {
        if (y + rowH > pageH - margin) {
          pdf.addPage()
          y = margin
          y = drawTableHeader(y)
        }
        pdf.setFontSize(fontSize)
        y = drawRow(job, y, idx % 2 === 0)
      })

      pdf.save(`jobinsight_${filtered ? 'filtered' : 'all'}.pdf`)
    } catch (e) {
      console.error('PDF export failed:', e)
      alert('PDF 匯出失敗，請稍後再試。')
    } finally {
      setPdfLoading(null)
    }
  }

  return (
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
