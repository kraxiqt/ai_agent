import { useEffect, useRef } from 'react';
import type { Message } from '../model/types';
import { EmptyState } from './EmptyState';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  onExamplePick?: (text: string) => void;
}

export function MessageList({ messages, onExamplePick }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Едет вниз при каждом новом сообщении и при каждом «довешенном» слове во время печати.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  if (messages.length === 0) {
    return <EmptyState onExamplePick={onExamplePick} />;
  }

  return (
    <div className="min-h-0 flex-1 space-y-4 overflow-y-auto py-4">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
