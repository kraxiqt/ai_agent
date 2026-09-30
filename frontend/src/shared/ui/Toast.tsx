import { cn } from '@/shared/lib/cn';

export type ToastVariant = 'success' | 'error' | 'info';

export interface ToastData {
  id: string;
  variant: ToastVariant;
  title: string;
  description?: string;
}

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-l-brand-600',
  error: 'border-l-red-600',
  info: 'border-l-ink-500',
};

interface ToastProps {
  toast: ToastData;
  onClose: (id: string) => void;
}

export function Toast({ toast, onClose }: ToastProps) {
  return (
    <div
      role={toast.variant === 'error' ? 'alert' : 'status'}
      className={cn(
        'pointer-events-auto flex w-full max-w-sm animate-toast-in items-start gap-3 rounded-lg border border-l-4 p-3 shadow-lg',
        'border-ink-200 bg-white text-ink-900 dark:border-ink-700 dark:bg-ink-900 dark:text-ink-100',
        variantStyles[toast.variant],
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-sm text-ink-600 dark:text-ink-400">{toast.description}</p>
        )}
      </div>
      <button
        type="button"
        aria-label="Закрыть уведомление"
        onClick={() => onClose(toast.id)}
        className="rounded p-1 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-800"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M5 5l10 10M15 5L5 15" />
        </svg>
      </button>
    </div>
  );
}
