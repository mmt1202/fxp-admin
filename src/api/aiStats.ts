import { apiClient } from './client';

export type AiStats = {
  totalCalls: number;
  successRate: number;
  cost: number;
};

export type AiStatsSummary = {
  calls: number;
  successRate: number;
  cost: number;
};

export function fetchAiStats() {
  return apiClient.get<AiStats>('/admin/ai-stats');
}

export function getAiStatsSummary() {
  return apiClient.get<AiStatsSummary>('/admin/ai-stats/summary');
}
