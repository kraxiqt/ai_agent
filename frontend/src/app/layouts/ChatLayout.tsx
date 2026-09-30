import { Outlet } from 'react-router-dom';
import { ChatHeader, useChat } from '@/features/chat';

//Хедер чата
export function ChatLayout() {
  const { conversation, isGenerating, startNewConversation } = useChat();

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        title={conversation.title}
        disabled={isGenerating}
        onNewConversation={startNewConversation}
      />
      <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4">
        <Outlet />
      </main>
    </div>
  );
}
