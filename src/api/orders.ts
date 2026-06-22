import { apiClient } from './client';

export type OrderRecord = {
  id: string;
  userName: string;
  amount: number;
  status: string;
};

export function fetchOrders() {
  return apiClient.get<OrderRecord[]>('/admin/orders');
}
