import { cn } from '@/shared/lib/cn';
import { formatTime } from '@/shared/lib/date';
import type { Message } from './types';
import { CopyButton } from './CopyButton';
import { DownloadMdButton } from './DownloadMdButton';
import { FeedbackButtons } from './FeedbackButtons';
import { MarkdownContent } from './MarkdownContent';
import { TypingIndicator } from './TypingIndicator';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isEmptyStreaming = message.status === 'streaming' && message.content.length === 0;
  const isError = message.status === 'error';
  const canCopy = !isUser && message.status === 'sent' && message.content.length > 0;

  return (
    <div className={cn('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={cn('group flex max-w-[85%] flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'break-words rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
            // у пользователя — обычный текст с переносами, у ассистента — Markdown
            isUser && 'whitespace-pre-wrap',
            isUser
              ? 'bg-brand-700 text-white dark:bg-brand-600'
              : 'bg-ink-100 text-ink-900 dark:bg-ink-800 dark:text-ink-100',
            isError &&
              'border border-red-400 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-950/40 dark:text-red-300',
          )}
        >
          {isEmptyStreaming ? (
            <TypingIndicator />
          ) : isUser || isError ? (
            message.content
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>

        <div className="flex min-h-[1.25rem] items-center gap-2 px-1 text-xs text-ink-400 dark:text-ink-500">
          <span>{formatTime(message.createdAt)}</span>
          {isError && <span className="text-red-600 dark:text-red-400">{message.error ?? 'Ошибка'}</span>}
          {canCopy && (
            <span
              className={cn(
                'flex items-center transition-opacity group-hover:opacity-100',
                // если ответ уже оценён, кнопки остаются видимыми
                message.feedback ? 'opacity-100' : 'opacity-0',
              )}
            >
              <CopyButton content={message.content} />
              <DownloadMdButton content={message.content} />
              <FeedbackButtons messageId={message.id} value={message.feedback} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
