import { cn } from '@/shared/lib/cn';
import { Button, IconButton } from '@/shared/ui';

const PlusIcon = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M12 5v14M5 12h14" />
  </svg>
);

const TrashIcon = (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6h18" />
    <path d="M8 6V4h8v2" />
    <path d="M19 6l-1 14H6L5 6" />
  </svg>
);

export interface ChatSidebarItem {
  id: string;
  title: string;
}

interface ChatSidebarProps {
  items: ChatSidebarItem[];
  activeId: string;
  disabled?: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  className?: string;
}

// Панель истории диалогов слева
export function ChatSidebar({
  items,
  activeId,
  disabled = false,
  onSelect,
  onDelete,
  onNew,
  className,
}: ChatSidebarProps) {
  return (
    <aside
      className={cn(
        'w-64 shrink-0 flex-col border-r border-ink-200 bg-white dark:border-ink-800 dark:bg-ink-950',
        className,
      )}
    >
      <div className="shrink-0 p-3">
        <Button
          variant="secondary"
          size="sm"
          fullWidth
          leftIcon={PlusIcon}
          onClick={onNew}
          disabled={disabled}
          title={disabled ? 'Дождитесь ответа или остановите генерацию' : undefined}
        >
          Новый диалог
        </Button>
      </div>

      <nav aria-label="История чатов" className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {items.length === 0 ? (
          <p className="px-2 py-4 text-sm text-ink-400 dark:text-ink-500">
            История пуста. Напишите первое сообщение.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {items.map((item) => {
              const isActive = item.id === activeId;
              return (
                <li
                  key={item.id}
                  className={cn(
                    'group flex items-center rounded-lg transition-colors',
                    isActive
                      ? 'bg-ink-200/70 dark:bg-ink-800'
                      : 'hover:bg-ink-200/50 dark:hover:bg-ink-900',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(item.id)}
                    disabled={disabled && !isActive}
                    aria-current={isActive ? 'page' : undefined}
                    title={item.title}
                    className="min-w-0 flex-1 truncate px-3 py-2 text-left text-sm disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {item.title}
                  </button>
                  <IconButton
                    size="sm"
                    label="Удалить диалог"
                    icon={TrashIcon}
                    disabled={disabled}
                    onClick={() => onDelete(item.id)}
                    className="mr-1 opacity-0 focus-visible:opacity-100 group-hover:opacity-100"
                  />
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}
