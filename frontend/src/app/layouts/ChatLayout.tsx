import { useMemo, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuthStore } from '@/features/auth';
import { ChatHeader, ChatSidebar, useChat, useChatHistorySync } from '@/features/chat';

const isDesktop = () => window.matchMedia('(min-width: 768px)').matches;

//Хедер чата + боковая панель с историей
export function ChatLayout() {
  const {
    conversation,
    messages,
    history,
    isGenerating,
    startNewConversation,
    openConversation,
    deleteConversation,
  } = useChat();

  // история хранится на бэкенде: загружаем её для текущего пользователя
  const userId = useAuthStore((s) => s.user?.id ?? null);
  useChatHistorySync(userId);

  // на десктопе панель открыта по умолчанию, на телефоне — закрыта
  const [sidebarOpen, setSidebarOpen] = useState(isDesktop);

  // на телефоне после выбора закрываем панель
  const closeOnMobile = () => {
    if (!isDesktop()) setSidebarOpen(false);
  };

  // активный диалог показываем в списке, только если в нём уже есть сообщения
  const items = useMemo(() => {
    const all = history.map((c) => ({ ...c.conversation }));
    if (messages.length) all.push(conversation);
    return all
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(({ id, title }) => ({ id, title }));
  }, [history, messages.length, conversation]);

  return (
    <div className="flex h-full flex-col">
      <ChatHeader
        title={conversation.title}
        disabled={isGenerating}
        onNewConversation={startNewConversation}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />

      <div className="relative flex min-h-0 flex-1">
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <ChatSidebar
          className={sidebarOpen ? 'fixed inset-y-0 left-0 z-30 flex md:static md:z-auto' : 'hidden'}
          items={items}
          activeId={conversation.id}
          disabled={isGenerating}
          onSelect={(id) => {
            if (id !== conversation.id) openConversation(id);
            closeOnMobile();
          }}
          onDelete={deleteConversation}
          onNew={() => {
            startNewConversation();
            closeOnMobile();
          }}
        />

        <main className="mx-auto flex min-h-0 w-full max-w-3xl flex-1 flex-col px-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}