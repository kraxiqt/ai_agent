import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const fieldClasses =
  'w-full rounded-lg border bg-white px-3 text-sm text-ink-900 placeholder:text-ink-400 transition-colors ' +
  'dark:bg-ink-900 dark:text-ink-100 dark:placeholder:text-ink-500 ' +
  'disabled:cursor-not-allowed disabled:opacity-60';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, id, className, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink-800 dark:text-ink-200">
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          fieldClasses,
          'h-10',
          error
            ? 'border-red-600 dark:border-red-500'
            : 'border-ink-300 dark:border-ink-700',
          className,
        )}
        {...props}
      />
      {error ? (
        <p id={`${inputId}-error`} className="text-sm text-red-700 dark:text-red-400">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-sm text-ink-500">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
