import {
  adaptList,
  apiClient as baseApiClient,
  toQuery,
  unwrapData,
  type ApiEnvelope,
  type ListResult,
  type QueryParams,
} from './client';

export type PaymentRecord = Record<string, unknown> & {
  id?: string | number;
  localOrderNo?: string;
  orderNo?: string;
  thirdPartyTransactionNo?: string;
  transactionNo?: string;
  channel?: string;
  amount?: number;
  paidAmount?: number;
  localStatus?: string;
  paidAt?: string;
  createdAt?: string;
};

export type ReconciliationRecord = PaymentRecord & {
  result?: string;
  thirdPartyStatus?: string;
  differenceReason?: string;
  diffReason?: string;
};

export type ReconciliationSummary = {
  success: number;
  failed: number;
  exception: number;
  total: number;
};

export type AiReviewStatus = 'pending' | 'approved' | 'corrected' | 'rejected';
export type AiReviewRecord = Record<string, unknown> & {
  id: string | number;
  status?: AiReviewStatus;
  auditStatus?: AiReviewStatus;
  title?: string;
  propertyTitle?: string;
  propertyInfo?: unknown;
  property?: unknown;
  aiOutput?: unknown;
  aiResult?: unknown;
  userFeedback?: unknown;
  feedback?: unknown;
  riskKeywords?: string[];
  correctionComment?: string;
};

export type AiCostOverview = Record<string, unknown>;
export type AiCostRecord = Record<string, unknown>;
export type AiCostByUser = Record<string, unknown>;

export type RiskBlacklistType = 'USER_ID' | 'PHONE' | 'IP' | 'DEVICE_ID' | 'WECHAT_OPENID';
export type RiskBlacklist = {
  id: string | number;
  type: RiskBlacklistType;
  value: string;
  reason?: string;
  expiresAt?: string | null;
  createdAt?: string;
};

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type RiskEvent = {
  id: string | number;
  action: string;
  summary: string;
  detail?: string;
  createdAt?: string;
};
export type RiskWatchlist = {
  id: string | number;
  userId: string;
  riskType: string;
  riskLevel: RiskLevel;
  reason: string;
  addedBy: string;
  expiresAt?: string | null;
  events?: RiskEvent[];
};
export type RiskWatchlistPayload = Omit<RiskWatchlist, 'id' | 'events'>;

export type CommunityBase = Record<string, unknown> & {
  id?: string | number;
  _id?: string | number;
  name?: string;
  city?: string;
  district?: string;
  street?: string;
  longitude?: number;
  latitude?: number;
  builtYear?: number;
  propertyCompany?: string;
  developer?: string;
  tags?: string[] | string;
  riskTips?: string;
  propertyCount?: number;
  reviewCount?: number;
};
export type CommunityBasePayload = Omit<CommunityBase, 'id' | '_id' | 'propertyCount' | 'reviewCount'>;

export type DuplicateProperty = Record<string, unknown> & {
  id?: string | number;
  title?: string;
  address?: string;
  communityName?: string;
  building?: string;
  roomNumber?: string;
  area?: string | number;
  layout?: string;
  imageUrl?: string;
};
export type DuplicateGroup = Record<string, unknown> & {
  id?: string | number;
  groupId?: string | number;
  status?: string;
  confidence?: number;
  imageSimilarity?: number;
  properties?: DuplicateProperty[];
  candidates?: DuplicateProperty[];
};
export type DuplicateMergePayload = {
  action: 'merge' | 'ignore' | 'confirm' | 'mark_not_duplicate';
  primaryPropertyId?: string | number;
  propertyIds?: Array<string | number>;
};

export type SupportTicketStatus = 'pending' | 'in_progress' | 'waiting_user' | 'resolved' | 'closed';
export type SupportTicket = Record<string, unknown> & {
  id: string | number;
  subject?: string;
  title?: string;
  userId?: string | number;
  userName?: string;
  status?: SupportTicketStatus;
  assigneeId?: string | number;
  assigneeName?: string;
  lastMessageAt?: string;
  updatedAt?: string;
};
export type SupportTicketMessage = Record<string, unknown> & {
  id?: string | number;
  content?: string;
  isInternal?: boolean;
  senderName?: string;
  senderType?: string;
  createdAt?: string;
};
export type SupportTicketDetail = SupportTicket & {
  messages?: SupportTicketMessage[];
};

export type FeedbackStatus = 'pending' | 'processing' | 'replied' | 'resolved' | 'closed';
export type UserFeedbackItem = Record<string, unknown> & {
  id: string | number;
  type: string;
  status: FeedbackStatus;
  content: string;
  userId?: string | number;
  contact?: string;
  handlerId?: string | number;
  handlerName?: string;
  handlerRemark?: string;
  images?: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type RefundStatus = 'pending' | 'approved' | 'rejected' | 'processing' | 'succeeded' | 'failed';
export type RefundOrder = Record<string, unknown> & {
  id: string | number;
  originalOrderId?: string;
  userId?: string | number;
  refundAmount?: number;
  refundReason?: string;
  status?: RefundStatus;
  auditor?: string;
  auditTime?: string;
  thirdPartyRefundNo?: string;
  paymentChannel?: string;
};

type ReconciliationBody = ListResult<ReconciliationRecord> & Partial<ReconciliationSummary> & {
  summary?: Partial<ReconciliationSummary>;
  records?: ReconciliationRecord[];
};

function zeroSummary(): ReconciliationSummary {
  return { success: 0, failed: 0, exception: 0, total: 0 };
}

function readSummary(body: unknown, items: ReconciliationRecord[]): ReconciliationSummary {
  const record = body && typeof body === 'object' ? body as ReconciliationBody : {} as ReconciliationBody;
  const summary = record.summary ?? record;
  return {
    success: Number(summary.success ?? 0),
    failed: Number(summary.failed ?? 0),
    exception: Number(summary.exception ?? 0),
    total: Number(summary.total ?? items.length),
  };
}

class MigratedFeatureApi {
  async getReconciliation(params?: QueryParams) {
    const payload = await baseApiClient.get<ApiEnvelope<unknown>>(`/admin/payments/reconciliation${toQuery(params)}`);
    const list = adaptList<ReconciliationRecord>(payload, ['items', 'records', 'reconciliations']);
    return { ...list, summary: readSummary(unwrapData(payload), list.items) || zeroSummary() };
  }

  async getPaymentRecords(params?: QueryParams) {
    const payload = await baseApiClient.get<ApiEnvelope<unknown>>(`/admin/payments/records${toQuery(params)}`);
    return adaptList<PaymentRecord>(payload, ['items', 'records', 'payments']);
  }

  runReconciliation(params?: QueryParams) {
    return baseApiClient.post('/admin/payments/reconciliation/run', params ?? {});
  }

  repairReconciliation(orderNo: string) {
    return baseApiClient.post(`/admin/payments/reconciliation/${encodeURIComponent(orderNo)}/repair`);
  }

  async getAiReviewRecords(params?: QueryParams) {
    const payload = await baseApiClient.get<ApiEnvelope<unknown>>(`/admin/ai/reviews${toQuery(params)}`);
    return adaptList<AiReviewRecord>(payload, ['items', 'records', 'reviews']);
  }

  async getAiReviewRecord(id: string | number) {
    return unwrapData<AiReviewRecord>(await baseApiClient.get<ApiEnvelope<AiReviewRecord>>(`/admin/ai/reviews/${id}`));
  }

  async auditAiReviewRecord(id: string | number, data: { status: AiReviewStatus; correctionComment?: string }) {
    return unwrapData<AiReviewRecord>(await baseApiClient.put<ApiEnvelope<AiReviewRecord>>(`/admin/ai/reviews/${id}/audit`, data));
  }

  async getAiCostOverview(params?: QueryParams) {
    return unwrapData<AiCostOverview>(await baseApiClient.get<ApiEnvelope<AiCostOverview>>(`/admin/ai/costs/overview${toQuery(params)}`));
  }

  async getAiCostRecords(params?: QueryParams) {
    const payload = await baseApiClient.get<ApiEnvelope<unknown>>(`/admin/ai/costs/records${toQuery(params)}`);
    return adaptList<AiCostRecord>(payload, ['items', 'records', 'costs']);
  }

  async getAiCostsByUser(params?: QueryParams) {
    const payload = await baseApiClient.get<ApiEnvelope<unknown>>(`/admin/ai/costs/users${toQuery(params)}`);
    return adaptList<AiCostByUser>(payload, ['items', 'users', 'ranking']);
  }

  async getSecurityBlacklist(params?: QueryParams) {
    const payload = await baseApiClient.get<ApiEnvelope<unknown>>(`/admin/security/blacklist${toQuery(params)}`);
    return adaptList<RiskBlacklist>(payload, ['items', 'blacklist', 'records']);
  }

  createSecurityBlacklist(data: Omit<RiskBlacklist, 'id' | 'createdAt'>) {
    return baseApiClient.post('/admin/security/blacklist', data);
  }

  deleteSecurityBlacklist(id: string | number) {
    return baseApiClient.delete(`/admin/security/blacklist/${id}`);
  }

  async getRiskWatchlist(params?: QueryParams) {
    const payload = await baseApiClient.get<ApiEnvelope<unknown>>(`/admin/risk/watchlist${toQuery(params)}`);
    return adaptList<RiskWatchlist>(payload, ['items', 'watchlist', 'records']);
  }

  async getRiskWatchlistEvents(id: string | number) {
    const payload = await baseApiClient.get<ApiEnvelope<unknown>>(`/admin/risk/watchlist/${id}/events`);
    return adaptList<RiskEvent>(payload, ['items', 'events']);
  }

  createRiskWatchlist(data: RiskWatchlistPayload) {
    return baseApiClient.post('/admin/risk/watchlist', data);
  }

  updateRiskWatchlist(id: string | number, data: RiskWatchlistPayload) {
    return baseApiClient.put(`/admin/risk/watchlist/${id}`, data);
  }

  deleteRiskWatchlist(id: string | number) {
    return baseApiClient.delete(`/admin/risk/watchlist/${id}`);
  }

  async getCommunities(params?: QueryParams) {
    const payload = await baseApiClient.get<ApiEnvelope<unknown>>(`/admin/communities${toQuery(params)}`);
    return adaptList<CommunityBase>(payload, ['items', 'communities']);
  }

  createCommunity(data: CommunityBasePayload) {
    return baseApiClient.post('/admin/communities', data);
  }

  updateCommunity(id: string | number, data: CommunityBasePayload) {
    return baseApiClient.put(`/admin/communities/${id}`, data);
  }

  deleteCommunity(id: string | number) {
    return baseApiClient.delete(`/admin/communities/${id}`);
  }

  mergeCommunities(sourceId: string | number, targetId: string | number) {
    return baseApiClient.post('/admin/communities/merge', { sourceId, targetId });
  }

  async getPropertyDuplicateGroups(params?: QueryParams) {
    const payload = await baseApiClient.get<ApiEnvelope<unknown>>(`/admin/properties/duplicates${toQuery(params)}`);
    return adaptList<DuplicateGroup>(payload, ['items', 'groups', 'duplicates']);
  }

  async getPropertyDuplicateGroup(id: string | number) {
    return unwrapData<DuplicateGroup>(await baseApiClient.get<ApiEnvelope<DuplicateGroup>>(`/admin/properties/duplicates/${id}`));
  }

  mergePropertyDuplicateGroup(id: string | number, data: DuplicateMergePayload) {
    return baseApiClient.post(`/admin/properties/duplicates/${id}/merge`, data);
  }

  async getSupportTickets(params?: QueryParams) {
    const payload = await baseApiClient.get<ApiEnvelope<unknown>>(`/admin/support/tickets${toQuery(params)}`);
    return adaptList<SupportTicket>(payload, ['items', 'tickets']);
  }

  async getSupportTicket(id: string | number) {
    return unwrapData<SupportTicketDetail>(await baseApiClient.get<ApiEnvelope<SupportTicketDetail>>(`/admin/support/tickets/${id}`));
  }

  async updateSupportTicketStatus(id: string | number, status: SupportTicketStatus) {
    return unwrapData<SupportTicket>(await baseApiClient.put<ApiEnvelope<SupportTicket>>(`/admin/support/tickets/${id}/status`, { status }));
  }

  async updateSupportTicketAssignee(id: string | number, assigneeId: string) {
    return unwrapData<SupportTicket>(await baseApiClient.put<ApiEnvelope<SupportTicket>>(`/admin/support/tickets/${id}/assignee`, { assigneeId }));
  }

  async createSupportTicketMessage(id: string | number, data: { content: string; isInternal: boolean }) {
    return unwrapData<SupportTicketMessage>(await baseApiClient.post<ApiEnvelope<SupportTicketMessage>>(`/admin/support/tickets/${id}/messages`, data));
  }

  async getFeedback(params?: QueryParams) {
    const payload = await baseApiClient.get<ApiEnvelope<unknown>>(`/admin/feedback${toQuery(params)}`);
    return adaptList<UserFeedbackItem>(payload, ['items', 'feedback', 'records']);
  }

  async getFeedbackDetail(id: string | number) {
    return unwrapData<UserFeedbackItem>(await baseApiClient.get<ApiEnvelope<UserFeedbackItem>>(`/admin/feedback/${id}`));
  }

  async updateFeedbackStatus(id: string | number, data: { status: FeedbackStatus; handlerRemark?: string }) {
    return unwrapData<UserFeedbackItem>(await baseApiClient.put<ApiEnvelope<UserFeedbackItem>>(`/admin/feedback/${id}/status`, data));
  }

  async getRefunds(params?: QueryParams) {
    const payload = await baseApiClient.get<ApiEnvelope<unknown>>(`/admin/refunds${toQuery(params)}`);
    return adaptList<RefundOrder>(payload, ['items', 'refunds', 'records']);
  }

  createRefund(data: { originalOrderId: string; userId: string; refundAmount: number; refundReason: string }) {
    return baseApiClient.post('/admin/refunds', data);
  }

  auditRefund(id: string | number, data: { approved: boolean; auditReason?: string }) {
    return baseApiClient.put(`/admin/refunds/${id}/audit`, data);
  }

  executeRefund(id: string | number, data: { channel: string }) {
    return baseApiClient.post(`/admin/refunds/${id}/execute`, data);
  }
}

export const featureApi = new MigratedFeatureApi();
