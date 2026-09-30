/** Три подпрыгивающих точки вместо пустого пузыря, пока ответ ещё не начал печататься. */
export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-0.5 py-1" role="status" aria-label="Ассистент печатает">
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:-0.3s] dark:bg-ink-500" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 [animation-delay:-0.15s] dark:bg-ink-500" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-ink-400 dark:bg-ink-500" />
    </div>
  );
}
