import { cn } from '@/shared/lib/cn';
import { IconButton } from '@/shared/ui';
import { useChatStore } from './store';
import type { MessageFeedback } from './types';

const svgProps = {
  viewBox: '0 0 24 24',
  className: 'h-4 w-4',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const ThumbUpIcon = (active: boolean) => (
  <svg {...svgProps} fill={active ? 'currentColor' : 'none'} stroke="currentColor">
    <path d="M7 10v11" />
    <path d="M15 5.9 14 10h5.8a2 2 0 0 1 1.9 2.5l-1.8 7a2 2 0 0 1-1.9 1.5H7V10l4-7a2 2 0 0 1 4 1.9Z" />
  </svg>
);

const ThumbDownIcon = (active: boolean) => (
  <svg {...svgProps} fill={active ? 'currentColor' : 'none'} stroke="currentColor">
    <path d="M17 14V3" />
    <path d="m9 18.1 1-4.1H4.2a2 2 0 0 1-1.9-2.5l1.8-7A2 2 0 0 1 6 3h11v11l-4 7a2 2 0 0 1-4-1.9Z" />
  </svg>
);

interface FeedbackButtonsProps {
  messageId: string;
  value?: MessageFeedback;
}

// Лайк / дизлайк. Повторный клик по выбранной оценке снимает её.
export function FeedbackButtons({ messageId, value }: FeedbackButtonsProps) {
  const setFeedback = useChatStore((s) => s.setFeedback);

  const toggle = (next: MessageFeedback) => setFeedback(messageId, value === next ? undefined : next);

  return (
    <>
      <IconButton
        label="Хороший ответ"
        icon={ThumbUpIcon(value === 'like')}
        size="sm"
        aria-pressed={value === 'like'}
        onClick={() => toggle('like')}
        className={cn(value === 'like' && 'text-green-600 dark:text-green-400')}
      />
      <IconButton
        label="Плохой ответ"
        icon={ThumbDownIcon(value === 'dislike')}
        size="sm"
        aria-pressed={value === 'dislike'}
        onClick={() => toggle('dislike')}
        className={cn(value === 'dislike' && 'text-red-600 dark:text-red-400')}
      />
    </>
  );
}
