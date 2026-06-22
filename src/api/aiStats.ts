import { apiClient } from './client';

export type AiStatsSummary = {
  calls: number;
  successRate: number;
  cost: number;
};

export function getAiStatsSummary() {
  return apiClient.get<AiStatsSummary>('/admin/ai-stats/summary');
}
