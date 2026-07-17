'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  isLoading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onCancel()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, isLoading, onCancel])

  // Force-clear any inherited pointer-events:none while the dialog is open.
  // Some component libraries (Radix, Headless UI, etc.) toggle pointer-events
  // on <body> or on other portaled siblings for a11y/scroll-lock purposes,
  // and if this custom portal isn't registered with them it can get stuck
  // uninteractive. This guarantees the dialog itself always stays clickable.
  useEffect(() => {
    if (!open) return
    const prevBodyPointerEvents = document.body.style.pointerEvents
    document.body.style.pointerEvents = ''
    return () => {
      document.body.style.pointerEvents = prevBodyPointerEvents
    }
  }, [open])

  if (!open || !mounted) return null

  const confirmClasses =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
      : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'

  const dialog = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
      style={{ pointerEvents: 'auto' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 z-0 bg-gray-900/50"
        style={{ pointerEvents: 'auto' }}
        onMouseDown={(e) => {
          // only close if the mousedown AND mouseup both happen on the backdrop
          // (prevents drag-from-panel-out-to-backdrop from closing it)
          if (e.target === e.currentTarget && !isLoading) onCancel()
        }}
      />

      {/* Panel */}
      <div
        className="relative z-10 bg-white rounded-lg shadow-xl w-full max-w-sm p-6"
        style={{ pointerEvents: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {variant === 'danger' && (
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-100 flex items-center justify-center">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-base font-semibold text-gray-900">
              {title}
            </h3>
            <p className="mt-1.5 text-sm text-gray-600">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            autoFocus
            className={`px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 flex items-center gap-2 ${confirmClasses}`}
          >
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {isLoading ? 'Working...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )

  return createPortal(dialog, document.body)
}