import { create } from 'zustand';
import { uuid } from '@/shared/lib/uuid';
import type { Conversation, Message, MessageFeedback, StoredChat } from './types';

const DEFAULT_TITLE = 'Новый чат';
const MAX_TITLE_LENGTH = 40;

function createConversation(): Conversation {
  return { id: uuid(), title: DEFAULT_TITLE, createdAt: new Date().toISOString() };
}

// Заголовок диалога — начало первого сообщения пользователя
function makeTitle(text: string): string {
  const oneLine = text.replace(/\s+/g, ' ').trim();
  return oneLine.length > MAX_TITLE_LENGTH ? `${oneLine.slice(0, MAX_TITLE_LENGTH)}…` : oneLine;
}

export interface ChatState {
  conversation: Conversation;
  messages: Message[];
  history: StoredChat[]; // все диалоги, кроме активного
  isGenerating: boolean;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, patch: Partial<Message>) => void;
  appendMessageContent: (id: string, chunk: string) => void;
  setFeedback: (id: string, feedback: MessageFeedback | undefined) => void;
  setGenerating: (value: boolean) => void;
  startNewConversation: () => void;
  openConversation: (id: string) => void;
  deleteConversation: (id: string) => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  conversation: createConversation(),
  messages: [],
  history: [],
  isGenerating: false,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
      conversation:
        message.role === 'user' && state.conversation.title === DEFAULT_TITLE
          ? { ...state.conversation, title: makeTitle(message.content) }
          : state.conversation,
    })),

  updateMessage: (id, patch) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  appendMessageContent: (id, chunk) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, content: m.content + chunk } : m)),
    })),

  // TODO(): отправлять оценку на бэкенд
  setFeedback: (id, feedback) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, feedback } : m)),
    })),

  setGenerating: (isGenerating) => set({ isGenerating }),

  // пустой активный диалог в историю не кладём
  startNewConversation: () =>
    set((state) => ({
      history: state.messages.length
        ? [{ conversation: state.conversation, messages: state.messages }, ...state.history]
        : state.history,
      conversation: createConversation(),
      messages: [],
      isGenerating: false,
    })),

  openConversation: (id) =>
    set((state) => {
      const target = state.history.find((c) => c.conversation.id === id);
      if (!target) return state;
      const rest = state.history.filter((c) => c.conversation.id !== id);
      return {
        history: state.messages.length
          ? [{ conversation: state.conversation, messages: state.messages }, ...rest]
          : rest,
        conversation: target.conversation,
        messages: target.messages,
        isGenerating: false,
      };
    }),

  deleteConversation: (id) =>
    set((state) => {
      if (state.conversation.id === id) {
        return { conversation: createConversation(), messages: [], isGenerating: false };
      }
      return { history: state.history.filter((c) => c.conversation.id !== id) };
    }),
}));
