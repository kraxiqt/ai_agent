import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  type FormEvent,
  type TextareaHTMLAttributes,
} from 'react';
import { cn } from '@/shared/lib/cn';
import { fieldClasses } from './Input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string;
  autoResize?: boolean;
  maxHeight?: number;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { error, autoResize = false, maxHeight = 200, className, onInput, value, rows = 2, ...props },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => innerRef.current as HTMLTextAreaElement);

  const resize = () => {
    const el = innerRef.current;
    if (!autoResize || !el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  };

  // controlled: пересчёт при программном изменении значения (например, очистка после отправки)
  useEffect(resize, [value, autoResize, maxHeight]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleInput = (event: FormEvent<HTMLTextAreaElement>) => {
    resize();
    onInput?.(event);
  };

  return (
    <textarea
      ref={innerRef}
      value={value}
      rows={rows}
      aria-invalid={error ? true : undefined}
      onInput={handleInput}
      className={cn(
        fieldClasses,
        'py-2 leading-6',
        autoResize ? 'resize-none overflow-y-auto' : 'resize-y',
        error ? 'border-red-600 dark:border-red-500' : 'border-ink-300 dark:border-ink-700',
        className,
      )}
      {...props}
    />
  );
});
