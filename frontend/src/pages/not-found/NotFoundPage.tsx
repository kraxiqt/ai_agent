import { Link } from 'react-router-dom';
import { ROUTES } from '@/app/router/routes';

export function NotFoundPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-3 px-4 text-center">
      <h1 className="text-2xl font-semibold">Страница не найдена</h1>
      <p className="text-sm text-ink-600 dark:text-ink-400">Проверьте адрес или вернитесь в чат.</p>
      <Link to={ROUTES.CHAT} className="font-medium text-brand-700 underline dark:text-brand-400">
        Открыть чат
      </Link>
    </main>
  );
}
