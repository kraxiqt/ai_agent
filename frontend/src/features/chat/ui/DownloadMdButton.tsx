import { IconButton } from '@/shared/ui';

const DownloadIcon = (
  <svg
    viewBox="0 0 24 24"
    className="h-4 w-4"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 3v12" />
    <path d="m7 10 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);

interface DownloadMdButtonProps {
  content: string;
  filename?: string;
}

// Скачивает ответ как файл .md
export function DownloadMdButton({ content, filename = 'answer' }: DownloadMdButtonProps) {
  const handleClick = () => {
    const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return <IconButton label="Скачать как .md" icon={DownloadIcon} size="sm" onClick={handleClick} />;
}
