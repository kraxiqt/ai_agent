export type MessageRole = 'user' | 'assistant';

export type MessageStatus = 'pending' | 'streaming' | 'sent' | 'error';

export type MessageFeedback = 'like' | 'dislike';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  createdAt: string;
  error?: string;
  feedback?: MessageFeedback; // оценка ответа ассистента
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}

// Сохранённый (неактивный) диалог в истории
export interface StoredChat {
  conversation: Conversation;
  messages: Message[];
}
