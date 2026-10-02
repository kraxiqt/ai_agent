import { useCallback, useEffect } from 'react';
import { requestStream } from '@/shared/api/baseClient';
import { uuid } from '@/shared/lib/uuid';
import { deleteConversationOnServer, fetchConversations, fetchMessages } from '../api/chatApi';
import { selectConversation, selectHistory, selectIsGenerating, selectMessages } from './selectors';
import { useChatStore } from '../model/store';
import type { Message } from '../model/types';

// общие для ВСЕХ вызовов useChat(), поэтому лежат на уровне модуля
let activeGenerationToken = 0;
let activeController: AbortController | null = null;
let openRequestToken = 0; // чтобы быстрый повторный клик по диалогам не перепутал порядок
let syncedUserId: string | null = null; // чья история сейчас лежит в хранилище

// гасит текущий ответ: больше не пишется в чат, а запрос к бэкенду обрывается
function cancelActiveGeneration() {
  activeGenerationToken += 1;
  openRequestToken += 1;
  activeController?.abort();
  activeController = null;
}

export function useChat() {
  const conversation = useChatStore(selectConversation);
  const messages = useChatStore(selectMessages);
  const isGenerating = useChatStore(selectIsGenerating);
  const history = useChatStore(selectHistory);
  const resetConversation = useChatStore((s) => s.startNewConversation);
  const openConversationInStore = useChatStore((s) => s.openConversation);
  const deleteConversationInStore = useChatStore((s) => s.deleteConversation);

  const sendMessage = useCallback(async (rawContent: string) => {
    const content = rawContent.trim();
    if (!content || useChatStore.getState().isGenerating) return;

    const userMessage: Message = {
      id: uuid(),
      role: 'user',
      content,
      status: 'sent',
      createdAt: new Date().toISOString(),
    };
    useChatStore.getState().addMessage(userMessage);

    const assistantId = uuid();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
      status: 'streaming',
      createdAt: new Date().toISOString(),
    };
    useChatStore.getState().addMessage(assistantMessage);
    useChatStore.getState().setGenerating(true);

    const myToken = ++activeGenerationToken;
    const controller = new AbortController();
    activeController = controller;
    const conversationId = useChatStore.getState().conversation.id;

    try {
      const response = await requestStream('chat/stream', {
        method: 'POST',
        body: { conversationId, content },
        signal: controller.signal,
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Пустой ответ сервера');
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (activeGenerationToken !== myToken) return; // диалог сбросили, пока шёл ответ
        const chunk = decoder.decode(value, { stream: true });
        if (chunk) useChatStore.getState().appendMessageContent(assistantId, chunk);
      }

      if (activeGenerationToken === myToken) {
        useChatStore.getState().updateMessage(assistantId, { status: 'sent' });
      }
    } catch (error) {
      if (activeGenerationToken !== myToken) return; // диалог сбросили, ошибка уже не важна
      if (controller.signal.aborted) {
        // пользователь нажал «Стоп»: оставляем то, что успело прийти
        useChatStore.getState().updateMessage(assistantId, { status: 'sent' });
      } else {
        useChatStore.getState().updateMessage(assistantId, {
          status: 'error',
          error: error instanceof Error ? error.message : 'Не удалось получить ответ',
        });
      }
    } finally {
      if (activeGenerationToken === myToken) {
        useChatStore.getState().setGenerating(false);
        activeController = null;
      }
    }
  }, []);

  const stopGeneration = useCallback(() => {
    activeController?.abort();
  }, []);

  const startNewConversation = useCallback(() => {
    cancelActiveGeneration();
    resetConversation();
  }, [resetConversation]);

  const openConversation = useCallback(
    async (id: string) => {
      cancelActiveGeneration();
      const myOpen = openRequestToken;

      // у диалога из списка сообщений ещё нет: подгружаем с бэкенда
      const target = useChatStore.getState().history.find((c) => c.conversation.id === id);
      if (target && target.messages.length === 0) {
        try {
          const loaded = await fetchMessages(id);
          useChatStore.getState().setHistoryMessages(id, loaded);
        } catch {
          // не загрузилось: откроем диалог пустым, можно нажать на него ещё раз
        }
        if (openRequestToken !== myOpen) return; // за это время открыли другой диалог
      }
      openConversationInStore(id);
    },
    [openConversationInStore],
  );

  const deleteConversation = useCallback(
    (id: string) => {
      if (useChatStore.getState().conversation.id === id) cancelActiveGeneration();
      deleteConversationInStore(id);
      // удаляем диалог и на сервере; если его там ещё нет (не было сообщений), ошибку игнорируем
      deleteConversationOnServer(id).catch(() => undefined);
    },
    [deleteConversationInStore],
  );

  return {
    conversation,
    messages,
    history,
    isGenerating,
    sendMessage,
    stopGeneration,
    startNewConversation,
    openConversation,
    deleteConversation,
  };
}

// Вызывать ОДИН раз, в ChatLayout: загружает историю с бэкенда при входе и после перезагрузки
// страницы, а при смене пользователя (выход и вход в другой аккаунт) чистит чужую историю.
export function useChatHistorySync(userId: string | null) {
  useEffect(() => {
    if (!userId) {
      if (syncedUserId !== null) {
        cancelActiveGeneration();
        useChatStore.getState().resetChat();
        syncedUserId = null;
      }
      return undefined;
    }

    if (syncedUserId !== userId) {
      cancelActiveGeneration();
      useChatStore.getState().resetChat();
      syncedUserId = userId;
    }

    let cancelled = false;
    fetchConversations()
      .then((conversations) => {
        if (!cancelled) useChatStore.getState().replaceHistory(conversations);
      })
      .catch(() => undefined); // история не загрузилась: чат продолжает работать без неё

    return () => {
      cancelled = true;
    };
  }, [userId]);
}