import { Spinner } from '@/shared/ui';

//загрулка для логикии обмена токенами TODO()
export function CallbackPage() {
  return (
    <div className="flex flex-col items-center gap-3 py-4 text-sm text-ink-600 dark:text-ink-400">
      <Spinner size="lg" label="Завершаем вход" />
      <p>Завершаем вход…</p>
    </div>
  );
}
