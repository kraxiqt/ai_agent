import { Button } from '@/shared/ui';

const StopIcon = (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

interface AbortButtonProps {
  onAbort: () => void;
}

//заглушка отмены запроса TODO()
export function AbortButton({ onAbort }: AbortButtonProps) {
  return (
    <Button variant="secondary" size="sm" leftIcon={StopIcon} onClick={onAbort}>
      Остановить
    </Button>
  );
}
