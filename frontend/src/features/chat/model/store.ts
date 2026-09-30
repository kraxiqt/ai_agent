import { create } from 'zustand';
import { uuid } from '@/shared/lib/uuid';
import type { Conversation, Message } from './types';

function createConversation(): Conversation {
  return { id: uuid(), title: 'Новый чат', createdAt: new Date().toISOString() };
}

export interface ChatState {
  conversation: Conversation;
  messages: Message[];
  isGenerating: boolean;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, patch: Partial<Message>) => void;
  appendMessageContent: (id: string, chunk: string) => void;
  setGenerating: (value: boolean) => void;
  startNewConversation: () => void;
}

export const useChatStore = create<ChatState>()((set) => ({
  conversation: createConversation(),
  messages: [],
  isGenerating: false,

  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  updateMessage: (id, patch) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),

  appendMessageContent: (id, chunk) =>
    set((state) => ({
      messages: state.messages.map((m) => (m.id === id ? { ...m, content: m.content + chunk } : m)),
    })),

  setGenerating: (isGenerating) => set({ isGenerating }),

  startNewConversation: () =>
    set({ conversation: createConversation(), messages: [], isGenerating: false }),
}));
