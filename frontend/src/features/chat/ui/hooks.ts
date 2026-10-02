import { useCallback } from 'react';
import { uuid } from '@/shared/lib/uuid';
import { selectConversation, selectHistory, selectIsGenerating, selectMessages } from './selectors';
import { EXAMPLE_REPLIES } from './examples';
import { useChatStore } from '../model/store';
import type { Message } from '../model/types';

//заглушка реплик под ИИ TODO()
const MOCK_REPLIES = [
  'Хорошая мысль! Дай мне секунду, чтобы собрать ответ по шагам.',
  'Понял задачу.',
];

const wait = (minMs: number, maxMs: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, minMs + Math.random() * (maxMs - minMs)));

//общий для ВСЕХ вызовов useChat(), поэтому лежит на уровне модуля
let activeGenerationToken = 0;

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
    await wait(400, 900); //имитация "думает" перед ответом словом

    // на кнопки-примеры отвечаем заготовленным Markdown, на остальное — случайной репликой
    const reply =
      EXAMPLE_REPLIES[content] ?? MOCK_REPLIES[Math.floor(Math.random() * MOCK_REPLIES.length)];
    const words = reply.split(' ');

    for (let i = 0; i < words.length; i++) {
      if (activeGenerationToken !== myToken) return; //диалог сбросили, пока печатали
      useChatStore.getState().appendMessageContent(assistantId, (i === 0 ? '' : ' ') + words[i]);
      await wait(30, 90);
    }

    if (activeGenerationToken === myToken) {
      useChatStore.getState().updateMessage(assistantId, { status: 'sent' });
      useChatStore.getState().setGenerating(false);
    }
  }, []);

  //заглушка запроса TODO()
  const stopGeneration = useCallback(() => {
    console.log('[chat] stopGeneration — пока заглушка, ответ продолжит генерироваться');
  }, []);

  const startNewConversation = useCallback(() => {
    activeGenerationToken += 1; // гасим текущую имитацию, если она ещё идёт
    resetConversation();
  }, [resetConversation]);

  const openConversation = useCallback(
    (id: string) => {
      activeGenerationToken += 1;
      openConversationInStore(id);
    },
    [openConversationInStore],
  );

  const deleteConversation = useCallback(
    (id: string) => {
      if (useChatStore.getState().conversation.id === id) activeGenerationToken += 1;
      deleteConversationInStore(id);
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
