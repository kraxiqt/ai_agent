import { ChatInput, MessageList, useChat } from '@/features/chat';

export function ChatPage() {
  const { messages, isGenerating, sendMessage, stopGeneration } = useChat();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <MessageList messages={messages} onExamplePick={sendMessage} />
      <ChatInput isGenerating={isGenerating} onSend={sendMessage} onAbort={stopGeneration} />
    </div>
  );
}
