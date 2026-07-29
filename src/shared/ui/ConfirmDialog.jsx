import { useEffect, useRef } from 'react'

export function ConfirmDialog({
  title,
  description,
  children,
  confirmLabel = '확인',
  cancelLabel = '취소',
  confirmDisabled = false,
  onConfirm,
  onCancel,
  danger = false,
}) {
  const dialogRef = useRef(null)

  // 열린 dialog 안에서 Tab을 순환시키고 닫힐 때 원래 focus를 복원한다.
  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    const focusable = () => [
      ...dialog.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [href]'),
    ]
    focusable()[0]?.focus()
    const handleKeyDown = (event) => {
      if (event.key !== 'Tab') return
      const items = focusable()
      if (!items.length) return
      const first = items[0]
      const last = items.at(-1)
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      }
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    dialog.addEventListener('keydown', handleKeyDown)
    return () => {
      dialog.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus?.()
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    const handleEscape = (event) => {
      if (event.key === 'Escape') onCancel?.()
    }
    dialog.addEventListener('keydown', handleEscape)
    return () => dialog.removeEventListener('keydown', handleEscape)
  }, [onCancel])

  return (
    <div className="modal" role="presentation">
      <button className="modal-overlay" type="button" aria-label="대화상자 닫기" onClick={onCancel} />
      <section className="modal-content" role="dialog" aria-modal="true" aria-labelledby="dialog-title" ref={dialogRef}>
        <h2 className="modal-text" id="dialog-title">
          {title}
        </h2>
        {description && <p className="modal-desc">{description}</p>}
        {children}
        <div className="modal-buttons">
          <button className="modal-btn cancel" type="button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`modal-btn confirm ${danger ? 'danger' : ''}`}
            type="button"
            disabled={confirmDisabled}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  )
}
