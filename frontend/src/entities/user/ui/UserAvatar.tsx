import { cn } from '@/shared/lib/cn';

export type UserAvatarSize = 'sm' | 'md';

const sizes: Record<UserAvatarSize, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
};

interface UserAvatarProps {
  name?: string;
  email: string;
  size?: UserAvatarSize;
  className?: string;
}

function getInitials(name: string | undefined, email: string): string {
  const source = name?.trim() || email;
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  return source.slice(0, 2).toUpperCase();
}

export function UserAvatar({ name, email, size = 'md', className }: UserAvatarProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-brand-700 font-medium text-white dark:bg-brand-500 dark:text-ink-950',
        sizes[size],
        className,
      )}
    >
      {getInitials(name, email)}
    </span>
  );
}
