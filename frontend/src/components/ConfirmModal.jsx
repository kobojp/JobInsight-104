import { useEffect } from 'react'

/**
 * ConfirmModal — 通用確認彈窗
 * Props:
 *   open: boolean
 *   title: string
 *   message: ReactNode
 *   confirmText: string (default '確認刪除')
 *   cancelText: string  (default '取消')
 *   danger: boolean     (確認按鈕是否顯示紅色)
 *   onConfirm: () => void
 *   onCancel: () => void
 */
export default function ConfirmModal({
  open,
  title = '確認操作',
  message,
  confirmText = '確認刪除',
  cancelText = '取消',
  danger = true,
  onConfirm,
  onCancel,
}) {
  // ESC 關閉
  useEffect(() => {
    if (!open) return
    const handler = (e) => { if (e.key === 'Escape') onCancel() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onCancel])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6 animate-fade-in">
        {/* Title */}
        <div className="flex items-center gap-3 mb-3">
          <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center ${danger ? 'bg-red-100' : 'bg-blue-100'}`}>
            {danger ? (
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
              </svg>
            )}
          </div>
          <h3 className="text-base font-semibold text-gray-800">{title}</h3>
        </div>

        {/* Message */}
        <div className="text-sm text-gray-600 mb-5 pl-12">
          {message}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm rounded-lg text-white font-medium transition-colors ${
              danger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
