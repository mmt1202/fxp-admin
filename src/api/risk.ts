import { apiClient } from './client';

export type RiskLevel = 'low' | 'medium' | 'high';

export type SensitiveWord = {
  id: string;
  word: string;
  category: string;
  riskLevel: RiskLevel;
  enabled: boolean;
  hitCount: number;
  updatedAt: string;
};

export type SensitiveWordPayload = Pick<SensitiveWord, 'word' | 'category' | 'riskLevel' | 'enabled'>;

export type RiskRule = {
  id: string;
  name: string;
  scene: 'content' | 'comment' | 'report';
  description: string;
  highRisk: boolean;
  enabled: boolean;
  action: 'pending_review' | 'reject' | 'flag';
  updatedAt: string;
};

export type RiskHit = {
  id: string;
  sourceType: 'content' | 'comment' | 'report';
  sourceId: string;
  excerpt: string;
  matchedWord?: string;
  ruleName: string;
  riskLevel: RiskLevel;
  status: 'pending_review' | 'approved' | 'rejected' | 'flagged';
  hitAt: string;
};

export const riskApi = {
  listSensitiveWords: () => apiClient.get<SensitiveWord[]>('/admin/risk/sensitive-words'),
  createSensitiveWord: (data: SensitiveWordPayload) => apiClient.post<SensitiveWord>('/admin/risk/sensitive-words', data),
  updateSensitiveWord: (id: string, data: SensitiveWordPayload) => (
    apiClient.put<SensitiveWord>(`/admin/risk/sensitive-words/${id}`, data)
  ),
  deleteSensitiveWord: (id: string) => apiClient.delete<void>(`/admin/risk/sensitive-words/${id}`),
  listRules: () => apiClient.get<RiskRule[]>('/admin/risk/rules'),
  updateRule: (id: string, data: Pick<RiskRule, 'enabled'>) => apiClient.put<RiskRule>(`/admin/risk/rules/${id}`, data),
  listHits: () => apiClient.get<RiskHit[]>('/admin/risk/hits'),
};
