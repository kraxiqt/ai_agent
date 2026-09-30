import { useTheme } from '@/app/providers';
import { LogoutButton, useAuth } from '@/features/auth';
import { UserAvatar } from '@/entities/user';
import { env } from '@/shared/config/env';
import { IconButton } from '@/shared/ui';

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

//Шапка авторизованной зоны: лого, переключатель темы, пользователь, выход.
export function Header() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-ink-200 bg-white px-4 dark:border-ink-800 dark:bg-ink-900">
      <span className="font-semibold tracking-tight">{env.APP_NAME}</span>

      <div className="flex items-center gap-3">
        <IconButton
          size="sm"
          label={resolvedTheme === 'dark' ? 'Светлая тема' : 'Тёмная тема'}
          icon={resolvedTheme === 'dark' ? SunIcon : MoonIcon}
          onClick={toggleTheme}
        />

        {user && (
          <div className="flex items-center gap-2">
            <UserAvatar name={user.name} email={user.email} size="sm" />
            <span className="hidden max-w-[10rem] truncate text-sm text-ink-700 dark:text-ink-300 sm:inline">
              {user.name || user.email}
            </span>
          </div>
        )}

        <LogoutButton />
      </div>
    </header>
  );
}
