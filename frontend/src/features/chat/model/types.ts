export type MessageRole = 'user' | 'assistant';


//pending сообщение пользователя перед подтверждением отправки (пригодится для реального API)
//streaming ответ ассистента ещё формируется (пока — локальная имитация «печатает»)
//sent финальное сообщение, готово к показу
//error не удалось получить/отправить (тоже задел под реальный API)

export type MessageStatus = 'pending' | 'streaming' | 'sent' | 'error';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  status: MessageStatus;
  createdAt: string;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  createdAt: string;
}
