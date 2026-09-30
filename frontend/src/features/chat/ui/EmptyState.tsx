interface EmptyStateProps {
  onExamplePick?: (text: string) => void;
}

const EXAMPLES = [
  'Новости ИБ',
  'Новости ИТ',
  'Почему в TS 5 пустых типов данных??',
];

export function EmptyState({ onExamplePick }: EmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 py-8 text-center">
      <div>
        <h2 className="text-lg font-medium">Чем помочь?</h2>
        <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
          Напишите вопрос ниже или начните с одного из примеров.
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-center">
        {EXAMPLES.map((example) => (
          <button
            key={example}
            type="button"
            onClick={() => onExamplePick?.(example)}
            className="rounded-full border border-ink-300 px-4 py-2 text-sm text-ink-700 transition-colors hover:bg-ink-100 dark:border-ink-700 dark:text-ink-300 dark:hover:bg-ink-800"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
