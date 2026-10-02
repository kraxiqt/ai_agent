// НОВЫЙ ФАЙЛ: src/features/chat/api/chatApi.ts
// Запросы к бэкенду за сохранённой историей диалогов.
import { apiClient } from '@/shared/api/baseClient';
import type { PaginatedResponse } from '@/shared/api/types';
import type { Conversation, Message } from '../model/types';

interface ApiConversation {
  id: string;
  title: string;
  createdAt: string;
}

interface ApiMessage {
  id: string;
  role: Message['role'];
  content: string;
  status: Message['status'];
  createdAt: string;
  error?: string | null;
}

// Бэкенд отдаёт даты как 2026-10-02T20:00:00.123456+00:00, во фронте везде формат toISOString()
const toIso = (value: string) => new Date(value).toISOString();

async function fetchAllPages<T>(path: string, pageSize: number, maxPages: number): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; page <= maxPages; page += 1) {
    const res = await apiClient.get<PaginatedResponse<T>>(path, { params: { page, pageSize } });
    all.push(...res.items);
    if (all.length >= res.total || res.items.length === 0) break;
  }
  return all;
}

// Список диалогов текущего пользователя (новые первыми)
export async function fetchConversations(): Promise<Conversation[]> {
  const items = await fetchAllPages<ApiConversation>('chat/conversations', 100, 5);
  return items.map((c) => ({ id: c.id, title: c.title, createdAt: toIso(c.createdAt) }));
}

// Сообщения одного диалога по порядку
export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const items = await fetchAllPages<ApiMessage>(
    `chat/conversations/${encodeURIComponent(conversationId)}/messages`,
    200,
    10,
  );
  return items.map((m) => ({
    id: m.id,
    role: m.role,
    content: m.content,
    status: m.status,
    createdAt: toIso(m.createdAt),
    error: m.error ?? undefined,
  }));
}

export function deleteConversationOnServer(conversationId: string): Promise<void> {
  return apiClient.delete<void>(`chat/conversations/${encodeURIComponent(conversationId)}`);
}