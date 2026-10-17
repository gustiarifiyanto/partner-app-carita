import { useCallback, useMemo, useState } from 'react'
import ToastViewport from '../components/ToastViewport'
import ToastContext from './toast-context'

let idCounter = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (message, variant, duration) => {
      const id = ++idCounter
      setToasts((prev) => [...prev, { id, message, variant }])
      if (duration !== 0) {
        setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      success: (message, duration = 4000) => push(message, 'success', duration),
      error: (message, duration = 5000) => push(message, 'error', duration),
      info: (message, duration = 4000) => push(message, 'info', duration),
      welcome: (title, description, duration = 5000) => push({ title, description }, 'welcome', duration),
      dismiss,
    }),
    [push, dismiss],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}
