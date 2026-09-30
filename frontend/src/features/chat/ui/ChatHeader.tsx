import { useTheme } from '@/app/providers';
import { UserAvatar } from '@/entities/user';
import { LogoutButton, useAuth } from '@/features/auth';
import { env } from '@/shared/config/env';
import { Button, IconButton } from '@/shared/ui';

const SunIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </svg>
);

const MoonIcon = (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </svg>
);

interface ChatHeaderProps {
  title: string;
  disabled?: boolean;
  onNewConversation: () => void;
}

export function ChatHeader({ title, disabled = false, onNewConversation }: ChatHeaderProps) {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="flex shrink-0 items-center border-b border-ink-200 px-4 py-3 dark:border-ink-800 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="shrink-0 font-semibold tracking-tight">{env.APP_NAME}</span>
          <span className="hidden truncate text-sm text-ink-400 dark:text-ink-500 sm:inline">{title}</span>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onNewConversation}
            disabled={disabled}
            title={disabled ? 'Дождитесь ответа или остановите генерацию' : undefined}
          >
            Новый диалог
          </Button>
          <IconButton
            size="sm"
            label={resolvedTheme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
            icon={resolvedTheme === 'dark' ? SunIcon : MoonIcon}
            onClick={toggleTheme}
          />
          {user && (
            <span className="hidden sm:inline-flex">
              <UserAvatar name={user.name} email={user.email} size="sm" />
            </span>
          )}
          <LogoutButton />
        </div>
      </div>
    </div>
  );
}
