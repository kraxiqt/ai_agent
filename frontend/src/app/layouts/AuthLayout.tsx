import { Outlet } from 'react-router-dom';
import { env } from '@/shared/config/env';

export function AuthLayout() {
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight">{env.APP_NAME}</h1>
        <div className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm dark:border-ink-800 dark:bg-ink-900">
          <Outlet />
        </div>
      </div>
    </main>
  );
}
