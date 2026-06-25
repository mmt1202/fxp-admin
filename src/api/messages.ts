import { adaptList, apiClient, type ApiEnvelope, type ListResult, unwrapData } from './client';

export type InAppMessageType = 'system_announcement' | 'personal_notice' | 'activity_notice' | 'review_notice' | 'membership_notice';
export type InAppMessageStatus = 'draft' | 'scheduled' | 'sent' | 'archived';
export type InAppMessageTargetType = 'all' | 'users' | 'segment';

export type InAppMessage = {
  id: string;
  title: string;
  content: string;
  type: InAppMessageType;
  status: InAppMessageStatus;
  targetType: InAppMessageTargetType;
  targetUserIds?: string[];
  targetSegment?: string;
  linkUrl?: string;
  sendAt?: string;
  sentAt?: string;
  senderName?: string;
  deliveredCount?: number;
  readCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type InAppMessagePayload = Pick<InAppMessage, 'title' | 'content' | 'type' | 'targetType'> & {
  targetUserIds?: string[];
  targetSegment?: string;
  linkUrl?: string;
  sendAt?: string;
};

export type AppMessageReadPayload = { messageIds: string[] };

export const messageTypeLabels: Record<InAppMessageType, string> = {
  system_announcement: '系统公告',
  personal_notice: '个人通知',
  activity_notice: '活动通知',
  review_notice: '审核通知',
  membership_notice: '会员通知',
};

export const messageStatusLabels: Record<InAppMessageStatus, string> = {
  draft: '草稿',
  scheduled: '待发送',
  sent: '已发送',
  archived: '已归档',
};

export const targetTypeLabels: Record<InAppMessageTargetType, string> = {
  all: '全部用户',
  users: '指定用户',
  segment: '用户分群',
};

export const messagesApi = {
  async getMessages(params?: Record<string, string | number | boolean | undefined>): Promise<ListResult<InAppMessage>> {
    const payload = await apiClient.get<ApiEnvelope<unknown>>('/admin/messages', { query: params });
    return adaptList<InAppMessage>(payload, ['messages', 'items']);
  },
  async createMessage(data: InAppMessagePayload): Promise<InAppMessage> {
    const payload = await apiClient.post<ApiEnvelope<InAppMessage>>('/admin/messages', data);
    return unwrapData(payload);
  },
  async getMessage(id: string): Promise<InAppMessage> {
    const payload = await apiClient.get<ApiEnvelope<InAppMessage>>(`/admin/messages/${id}`);
    return unwrapData(payload);
  },
  async sendMessage(id: string): Promise<InAppMessage> {
    const payload = await apiClient.post<ApiEnvelope<InAppMessage>>(`/admin/messages/${id}/send`);
    return unwrapData(payload);
  },
  async getAppMessages(params?: Record<string, string | number | boolean | undefined>): Promise<ListResult<InAppMessage & { readAt?: string }>> {
    const payload = await apiClient.get<ApiEnvelope<unknown>>('/app/messages', { query: params });
    return adaptList<InAppMessage & { readAt?: string }>(payload, ['messages', 'items']);
  },
  async markAppMessagesRead(data: AppMessageReadPayload): Promise<{ success?: boolean }> {
    const payload = await apiClient.post<ApiEnvelope<{ success?: boolean }>>('/app/messages/read', data);
    return unwrapData(payload);
  },
};
