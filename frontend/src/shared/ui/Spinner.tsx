import { cn } from '@/shared/lib/cn';

export type SpinnerSize = 'sm' | 'md' | 'lg';

const sizes: Record<SpinnerSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

interface SpinnerProps {
  size?: SpinnerSize;
  label?: string;
  className?: string;
}

export function Spinner({ size = 'md', label = 'Загрузка', className }: SpinnerProps) {
  return (
    <span role="status" className="inline-flex">
      <svg
        className={cn('animate-spin', sizes[size], className)}
        viewBox="0 0 24 24"
        fill="none"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" opacity="0.25" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}
