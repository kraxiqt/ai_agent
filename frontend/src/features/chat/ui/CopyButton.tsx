import { IconButton } from '@/shared/ui';

const CopyIcon = (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1" />
  </svg>
);

interface CopyButtonProps {
  content: string;
}

//заглушка копирования, пока лог в консоль TOSO()
export function CopyButton({ content }: CopyButtonProps) {
  const handleClick = () => {
    console.log('[chat] copy (заглушка):', content);
  };

  return <IconButton label="Скопировать ответ" icon={CopyIcon} size="sm" onClick={handleClick} />;
}
