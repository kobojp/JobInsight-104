import { useState, useEffect } from 'react'
import { getHistory, deleteTasks } from '../api/client'
import ConfirmModal from './ConfirmModal'

const STATUS_LABEL = {
  done:      { text: '完成',   cls: 'bg-green-100 text-green-700' },
  cancelled: { text: '已停止', cls: 'bg-yellow-100 text-yellow-700' },
  failed:    { text: '失敗',   cls: 'bg-red-100 text-red-600' },
  running:   { text: '執行中', cls: 'bg-blue-100 text-blue-600' },
  pending:   { text: '等待中', cls: 'bg-gray-100 text-gray-500' },
}

export default function HistoryTab({ onViewResult, onReSearch }) {
  const [history, setHistory] = useState([])
  const [limit, setLimit] = useState(20)
  const [limitInput, setLimitInput] = useState('20')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(new Set())
  const [modalOpen, setModalOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function fetchHistory(l) {
    setLoading(true)
    setSelected(new Set())
    try {
      const data = await getHistory(l)
      setHistory(data.history || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchHistory(limit) }, [limit])

  function handleLimitApply() {
    const val = parseInt(limitInput, 10)
    if (isNaN(val) || val < 0) return
    setLimit(val === 0 ? 0 : val)
    fetchHistory(val === 0 ? 0 : val)
  }

  // Checkbox logic
  const allChecked = history.length > 0 && selected.size === history.length
  const someChecked = selected.size > 0 && selected.size < history.length

  function toggleAll() {
    if (allChecked) {
      setSelected(new Set())
    } else {
      setSelected(new Set(history.map(t => t.task_id)))
    }
  }

  function toggleOne(taskId) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(taskId) ? next.delete(taskId) : next.add(taskId)
      return next
    })
  }

  // Delete flow
  async function handleConfirmDelete() {
    setDeleting(true)
    try {
      await deleteTasks([...selected])
      setModalOpen(false)
      setSelected(new Set())
      fetchHistory(limit)
    } catch (e) {
      console.error(e)
    } finally {
      setDeleting(false)
    }
  }

  // Build modal message
  const selectedItems = history.filter(t => selected.has(t.task_id))
  const modalMessage = (
    <div className="space-y-2">
      <p>確認要刪除以下 <span className="font-semibold text-red-600">{selected.size}</span> 筆紀錄？</p>
      <p className="text-xs text-gray-400">相關職缺資料也會一併刪除，此操作無法復原。</p>
      {selectedItems.length <= 5 && (
        <ul className="mt-2 space-y-1">
          {selectedItems.map(t => (
            <li key={t.task_id} className="text-xs bg-gray-50 rounded px-2 py-1 text-gray-600">
              {(t.params?.keyword || '（無關鍵字）')} — {t.total_jobs ?? 0} 筆 —
              <span className="ml-1 text-gray-400">{t.created_at?.slice(0, 16).replace('T', ' ')}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow px-5 py-3 flex items-center justify-between flex-wrap gap-3">
        <span className="font-semibold text-gray-700">
          爬取歷史紀錄
          <span className="ml-2 text-sm font-normal text-gray-400">共 {history.length} 筆</span>
        </span>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Delete selected button */}
          {selected.size > 0 && (
            <button
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              刪除選取（{selected.size}）
            </button>
          )}

          <span className="text-sm text-gray-500">顯示筆數：</span>
          <input
            type="number"
            min="0"
            value={limitInput}
            onChange={e => setLimitInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLimitApply()}
            className="w-20 text-sm border border-gray-300 rounded px-2 py-1"
            placeholder="0=全部"
          />
          <button
            onClick={handleLimitApply}
            className="text-sm px-3 py-1 rounded border border-blue-400 text-blue-600 hover:bg-blue-50"
          >
            套用
          </button>
          <button
            onClick={() => { setLimitInput('0'); setLimit(0); fetchHistory(0) }}
            className="text-sm px-3 py-1 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
          >
            全部顯示
          </button>
          <button
            onClick={() => fetchHistory(limit)}
            className="text-sm px-3 py-1 rounded border border-gray-300 text-gray-500 hover:bg-gray-50"
            title="重新整理"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        {loading ? (
          <div className="py-12 text-center text-gray-400 text-sm">載入中...</div>
        ) : history.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-sm">尚無爬取紀錄</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 w-8">
                  <input
                    type="checkbox"
                    checked={allChecked}
                    ref={el => { if (el) el.indeterminate = someChecked }}
                    onChange={toggleAll}
                    className="cursor-pointer"
                  />
                </th>
                <th className="px-4 py-3 text-left">建立時間</th>
                <th className="px-4 py-3 text-left">關鍵字</th>
                <th className="px-4 py-3 text-left">地區</th>
                <th className="px-4 py-3 text-left">排序</th>
                <th className="px-4 py-3 text-left">最大頁數</th>
                <th className="px-4 py-3 text-left">筆數</th>
                <th className="px-4 py-3 text-left">狀態</th>
                <th className="px-4 py-3 text-left">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {history.map(task => {
                const params = task.params || {}
                const status = STATUS_LABEL[task.status] || { text: task.status, cls: 'bg-gray-100 text-gray-500' }
                const canView = task.status === 'done' || task.status === 'cancelled'
                const isSelected = selected.has(task.task_id)
                return (
                  <tr
                    key={task.task_id}
                    className={`transition-colors ${isSelected ? 'bg-red-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOne(task.task_id)}
                        className="cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                      {task.created_at ? task.created_at.replace('T', ' ').slice(0, 16) : '-'}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {params.keyword || <span className="text-gray-400">（未設定）</span>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{params.area || '-'}</td>
                    <td className="px-4 py-3 text-gray-500">{params.order || '-'}</td>
                    <td className="px-4 py-3 text-gray-500 text-center">{params.max_pages ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-700 font-medium">{task.total_jobs ?? '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.cls}`}>
                        {status.text}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => onViewResult(task.task_id)}
                          disabled={!canView}
                          className="px-2 py-1 text-xs rounded border border-blue-400 text-blue-600 hover:bg-blue-50 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          查看結果
                        </button>
                        <button
                          onClick={() => onReSearch(params)}
                          className="px-2 py-1 text-xs rounded border border-green-500 text-green-700 hover:bg-green-50"
                        >
                          重新爬取
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm Modal */}
      <ConfirmModal
        open={modalOpen}
        title="確認刪除紀錄"
        message={modalMessage}
        confirmText={deleting ? '刪除中...' : '確認刪除'}
        onConfirm={handleConfirmDelete}
        onCancel={() => !deleting && setModalOpen(false)}
      />
    </div>
  )
}
