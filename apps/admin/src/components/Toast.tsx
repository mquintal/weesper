import { Cross2Icon } from '@radix-ui/react-icons'
import * as ToastPrimitive from '@radix-ui/react-toast'
import classNames from 'classnames'
import * as React from 'react'

type ToastType = 'success' | 'error' | 'info'

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

export const useToast = () => {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

interface ToastItem {
  id: string
  message: string
  type: ToastType
}

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([])

  const toast = React.useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, message, type }])
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastPrimitive.Provider>
        {children}
        {toasts.map(({ id, message, type }) => (
          <ToastPrimitive.Root
            key={id}
            className={classNames(
              'toast-root alert alert-soft shadow-lg flex flex-row items-center justify-between gap-4',
              {
                'alert-error': type === 'error',
                'alert-success': type === 'success',
                'alert-info': type === 'info',
              },
            )}
            onOpenChange={(open) => {
              if (!open) removeToast(id)
            }}
          >
            <ToastPrimitive.Title className="text-sm font-bold flex-1">{message}</ToastPrimitive.Title>
            <ToastPrimitive.Close className="btn btn-ghost btn-xs btn-circle shrink-0">
              <Cross2Icon />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        ))}
        <ToastPrimitive.Viewport className="toast toast-end toast-top z-[100] p-4 flex flex-col gap-2 max-w-sm w-full outline-none" />
      </ToastPrimitive.Provider>

      <style>{`
        .toast-root[data-state='open'] {
          animation: slideIn 150ms cubic-bezier(0.16, 1, 0.3, 1);
        }
        .toast-root[data-state='closed'] {
          animation: hide 100ms ease-in;
        }
        .toast-root[data-swipe='move'] {
          transform: translateX(var(--radix-toast-swipe-move-x));
        }
        .toast-root[data-swipe='cancel'] {
          transform: translateX(0);
          transition: transform 200ms ease-out;
        }
        .toast-root[data-swipe='end'] {
          animation: swipeOut 100ms ease-out;
        }

        @keyframes hide {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes slideIn {
          from { transform: translateX(calc(100% + 1rem)); }
          to { transform: translateX(0); }
        }

        @keyframes swipeOut {
          from { transform: translateX(var(--radix-toast-swipe-end-x)); }
          to { transform: translateX(calc(100% + 1rem)); }
        }
      `}</style>
    </ToastContext.Provider>
  )
}
