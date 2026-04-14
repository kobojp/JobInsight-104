export default function ProgressBar({ progress, onCancel, cancelling }) {
  const { current_page = 0, total_pages = 0, collected = 0, total = 0 } = progress || {}
  const pct = total_pages > 0 ? Math.round((current_page / total_pages) * 100) : 0

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">爬取進度</span>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {total_pages > 0
              ? `第 ${current_page} / ${total_pages} 頁　已收集 ${collected} 筆（共約 ${total} 筆）`
              : '連線中...'}
          </span>
          <button
            onClick={onCancel}
            disabled={cancelling}
            className="px-3 py-1 text-sm rounded border border-red-400 text-red-500 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {cancelling ? '停止中...' : '停止爬取'}
          </button>
        </div>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-500 ${cancelling ? 'bg-red-400' : 'bg-blue-600'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-gray-400 mt-2">
        {cancelling
          ? '正在等待當前頁面完成後停止...'
          : '每頁之間有 3–6 秒的速率限制延遲，請耐心等待。'}
      </p>
    </div>
  )
}
