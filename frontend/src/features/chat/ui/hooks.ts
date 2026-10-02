import { useCallback } from 'react';
import { requestStream } from '@/shared/api/baseClient';
import { uuid } from '@/shared/lib/uuid';
import { selectConversation, selectIsGenerating, selectMessages } from './selectors';
import { useChatStore } from './store';
import type { Message } from './types';

// общие для ВСЕХ вызовов useChat(), поэтому лежат на уровне модуля
let activeGenerationToken = 0;
let activeController: AbortController | null = null;

export function useChat() {
  const conversation = useChatStore(selectConversation);
  const messages = useChatStore(selectMessages);
  const isGenerating = useChatStore(selectIsGenerating);
  const resetConversation = useChatStore((s) => s.startNewConversation);

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
    activeGenerationToken += 1; // текущий ответ больше не пишется в чат
    activeController?.abort(); // и запрос к бэкенду обрывается
    activeController = null;
    resetConversation();
  }, [resetConversation]);

  return { conversation, messages, isGenerating, sendMessage, stopGeneration, startNewConversation };
}