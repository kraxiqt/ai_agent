import ReactMarkdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Стили под Tailwind (плагин typography не подключён, поэтому размечаем элементы вручную).
const components: Components = {
  h1: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h3>,
  h2: ({ children }) => <h3 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h3>,
  h3: ({ children }) => <h4 className="mb-1.5 mt-3 text-sm font-semibold first:mt-0">{children}</h4>,
  h4: ({ children }) => <h5 className="mb-1 mt-3 text-sm font-semibold first:mt-0">{children}</h5>,
  p: ({ children }) => <p className="my-2 first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="my-2 list-disc space-y-1 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-2 list-decimal space-y-1 pl-5">{children}</ol>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      className="underline underline-offset-2 hover:opacity-80"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-l-4 border-ink-300 pl-3 text-ink-600 dark:border-ink-600 dark:text-ink-400">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-ink-200 px-1 py-0.5 font-mono text-[0.85em] dark:bg-ink-700">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-ink-200 p-3 text-xs dark:bg-ink-900 [&_code]:bg-transparent [&_code]:p-0">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-left text-xs">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-ink-300 px-2 py-1 font-semibold dark:border-ink-600">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border border-ink-300 px-2 py-1 dark:border-ink-600">{children}</td>
  ),
  hr: () => <hr className="my-3 border-ink-300 dark:border-ink-600" />,
};

interface MarkdownContentProps {
  content: string;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  );
}
