'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

type Toast = {
  id: string
  message: string
  variant: ToastVariant
}

type ToastOptions = {
  variant?: ToastVariant
  duration?: number
}

type ToastContextValue = {
  showToast: (message: string, options?: ToastOptions) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const DEFAULT_DURATION = 4000

const variantStyles: Record<ToastVariant, { container: string; iconClass: string }> = {
  success: {
    container:
      'border-emerald-200/70 bg-white text-emerald-900 shadow-[0_10px_30px_rgba(16,112,95,0.22)]',
    iconClass: 'text-emerald-600',
  },
  error: {
    container:
      'border-rose-200/70 bg-white text-rose-900 shadow-[0_10px_30px_rgba(190,49,68,0.22)]',
    iconClass: 'text-rose-600',
  },
  info: {
    container:
      'border-sky-200/70 bg-white text-slate-900 shadow-[0_10px_30px_rgba(29,78,137,0.18)]',
    iconClass: 'text-sky-600',
  },
}

const variantIcon: Record<ToastVariant, ReactElement> = {
  success: <CheckCircle2 className="h-5 w-5" aria-hidden="true" />,
  error: <XCircle className="h-5 w-5" aria-hidden="true" />,
  info: <Info className="h-5 w-5" aria-hidden="true" />,
}

function generateId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return Math.random().toString(36).slice(2, 10)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timers = useRef<Map<string, number>>(new Map())

  const dismissToast = useCallback((id: string) => {
    setToasts(current => current.filter(toast => toast.id !== id))

    const timerId = timers.current.get(id)
    if (timerId) {
      window.clearTimeout(timerId)
      timers.current.delete(id)
    }
  }, [])

  const showToast = useCallback(
    (message: string, options?: ToastOptions) => {
      const id = generateId()
      const variant = options?.variant ?? 'info'
      const duration = options?.duration ?? DEFAULT_DURATION

      setToasts(current => [...current, { id, message, variant }])

      if (duration > 0) {
        const timerId = window.setTimeout(() => {
          dismissToast(id)
        }, duration)
        timers.current.set(id, timerId)
      }
    },
    [dismissToast],
  )

  useEffect(() => {
    const timersMap = timers.current

    return () => {
      timersMap.forEach(timerId => window.clearTimeout(timerId))
      timersMap.clear()
    }
  }, [])

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      dismissToast,
    }),
    [showToast, dismissToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  )
}

function ToastViewport({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed top-3 left-3 right-3 z-[70] flex flex-col items-center gap-3 md:left-auto md:right-6 md:w-[360px] md:items-end">
      {toasts.map(toast => {
        const styles = variantStyles[toast.variant]
        const icon = variantIcon[toast.variant]

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 text-sm backdrop-blur ${styles.container}`}
            role="status"
            aria-live="polite"
          >
            <span className={`mt-0.5 ${styles.iconClass}`}>{icon}</span>
            <p className="flex-1 font-medium leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/60 text-slate-600 transition hover:bg-white"
              aria-label="Fechar notificação"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export function useToast() {
  const context = useContext(ToastContext)

  if (!context) {
    throw new Error('useToast deve ser utilizado dentro de um ToastProvider')
  }

  return context
}
