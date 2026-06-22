import { apiClient } from './client';

export type OrderListItem = {
  id: string;
  userName: string;
  status: string;
  amount: number;
};

export function getOrders() {
  return apiClient.get<OrderListItem[]>('/admin/orders');
}
