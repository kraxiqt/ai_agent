import { useState, type KeyboardEvent } from 'react';
import { Button, Textarea } from '@/shared/ui';
import { AbortButton } from './AbortButton';

interface ChatInputProps {
  isGenerating: boolean;
  onSend: (content: string) => void;
  onAbort: () => void;
}

export function ChatInput({ isGenerating, onSend, onAbort }: ChatInputProps) {
  const [value, setValue] = useState('');
  const canSend = value.trim().length > 0 && !isGenerating;

  const handleSend = () => {
    if (!canSend) return;
    onSend(value);
    setValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter — отправить, Shift+Enter — перенос строки (ничего не перехватываем).
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="shrink-0 border-t border-ink-200 pb-8 pt-3 dark:border-ink-800 sm:pb-10">
      <div className="flex items-end gap-2">
        <Textarea
          autoResize
          maxHeight={160}
          rows={1}
          placeholder="Напишите сообщение… Enter — отправить, Shift+Enter — новая строка"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1"
          aria-label="Сообщение"
        />
        {isGenerating ? (
          <AbortButton onAbort={onAbort} />
        ) : (
          <Button onClick={handleSend} disabled={!canSend}>
            Отправить
          </Button>
        )}
      </div>
    </div>
  );
}
