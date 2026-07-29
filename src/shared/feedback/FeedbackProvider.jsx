import { useCallback, useMemo, useRef, useState } from 'react'

import { ConfirmDialog } from '../ui/ConfirmDialog'

import { FeedbackContext } from './FeedbackContext'

import './feedback.css'

let nextToastId = 1

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [dialog, setDialog] = useState(null)
  const toastKeys = useRef(new Set())

  // 같은 요청의 같은 메시지는 표시 중인 동안 한 번만 쌓인다.
  const showToast = useCallback(({ message, type = 'info', duration = 3500, action, key = message }) => {
    if (!message || toastKeys.current.has(key)) return
    const id = nextToastId++
    toastKeys.current.add(key)
    setToasts((current) => [...current, { id, message, type, action, key }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id))
      toastKeys.current.delete(key)
    }, duration)
  }, [])

  const dismissToast = useCallback((id) => {
    setToasts((current) => {
      const target = current.find((toast) => toast.id === id)
      if (target) toastKeys.current.delete(target.key)
      return current.filter((toast) => toast.id !== id)
    })
  }, [])

  const showErrorDialog = useCallback((options) => setDialog(options), [])
  const closeErrorDialog = useCallback(() => setDialog(null), [])

  const value = useMemo(
    () => ({ showToast, showErrorDialog, closeErrorDialog }),
    [closeErrorDialog, showErrorDialog, showToast],
  )

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div className={`app-toast app-toast--${toast.type}`} key={toast.id} role="status">
            <span>{toast.message}</span>
            {toast.action && (
              <button
                type="button"
                onClick={() => {
                  dismissToast(toast.id)
                  toast.action.onClick()
                }}
              >
                {toast.action.label}
              </button>
            )}
            <button className="toast-close" type="button" aria-label="알림 닫기" onClick={() => dismissToast(toast.id)}>
              ×
            </button>
          </div>
        ))}
      </div>
      {dialog && (
        <ConfirmDialog
          title={dialog.title || '문제가 발생했습니다'}
          description={dialog.message}
          confirmLabel={dialog.confirmLabel || '다시 시도'}
          cancelLabel={dialog.cancelLabel || '닫기'}
          onConfirm={() => {
            closeErrorDialog()
            dialog.onRetry?.()
          }}
          onCancel={() => {
            closeErrorDialog()
            dialog.onCancel?.()
          }}
        />
      )}
    </FeedbackContext.Provider>
  )
}
