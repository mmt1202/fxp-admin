import { apiClient, type ApiEnvelope, unwrapData } from './client';

export type TodoType =
  | 'content_moderation'
  | 'property_review'
  | 'refund_review'
  | 'support_ticket'
  | 'ai_review';

export type TodoItem = {
  id: string;
  title: string;
  description?: string;
  createdAt?: string;
  targetUrl: string;
};

export type TodoCategory = {
  type: TodoType;
  label: string;
  description: string;
  count: number;
  targetUrl: string;
  items: TodoItem[];
};

export type TodoCenter = {
  total: number;
  role?: string;
  categories: TodoCategory[];
  updatedAt?: string;
};

export type TodoQuery = {
  role?: string;
};

export async function fetchAdminTodos(query?: TodoQuery) {
  const payload = await apiClient.get<ApiEnvelope<TodoCenter>>('/admin/todos', { query });
  return unwrapData<TodoCenter>(payload);
}
