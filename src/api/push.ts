import { adaptList, apiClient, type ApiEnvelope, unwrapData } from './client';

export type PushCampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
export type PushAudienceType = 'all' | 'users' | 'tags' | 'segments';

export type PushAudience = {
  type: PushAudienceType;
  values: string[];
};

export type PushCampaignStats = {
  targetCount: number;
  sentCount: number;
  deliveredCount: number;
  clickedCount: number;
  deliveryRate: number;
  clickRate: number;
};

export type PushCampaign = {
  id: string;
  title: string;
  content: string;
  linkUrl?: string;
  audience: PushAudience;
  status: PushCampaignStatus;
  scheduledAt?: string;
  sentAt?: string;
  createdAt?: string;
  updatedAt?: string;
  stats?: PushCampaignStats;
};

export type PushCampaignPayload = {
  title: string;
  content: string;
  linkUrl?: string;
  audience: PushAudience;
  scheduledAt?: string;
};

export const pushApi = {
  async getCampaigns(params?: Record<string, string | number | boolean | undefined>) {
    const payload = await apiClient.get<ApiEnvelope<unknown>>(`/admin/push/campaigns${apiClient.toQuery(params)}`);
    return adaptList<PushCampaign>(payload, ['campaigns', 'items']);
  },
  async createCampaign(data: PushCampaignPayload) {
    const payload = await apiClient.post<ApiEnvelope<PushCampaign>>('/admin/push/campaigns', data);
    return unwrapData<PushCampaign>(payload);
  },
  async sendCampaign(id: PushCampaign['id']) {
    const payload = await apiClient.post<ApiEnvelope<PushCampaign>>(`/admin/push/campaigns/${id}/send`);
    return unwrapData<PushCampaign>(payload);
  },
  async getCampaignStats(id: PushCampaign['id']) {
    const payload = await apiClient.get<ApiEnvelope<PushCampaignStats>>(`/admin/push/campaigns/${id}/stats`);
    return unwrapData<PushCampaignStats>(payload);
  },
};
