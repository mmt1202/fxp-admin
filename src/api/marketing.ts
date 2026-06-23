import { apiClient } from './client';

export type CouponBenefitType = 'membership_discount' | 'free_ai_credits' | 'membership_days';
export type MarketingStatus = 'draft' | 'active' | 'paused' | 'expired';

export type CouponBatch = {
  id: string;
  name: string;
  benefitType: CouponBenefitType;
  benefitValue: number;
  totalCount: number;
  claimedCount: number;
  usedCount: number;
  status: MarketingStatus;
  startsAt: string;
  endsAt: string;
  createdAt: string;
};

export type Coupon = {
  id: string;
  batchId: string;
  batchName: string;
  benefitType: CouponBenefitType;
  benefitValue: number;
  ownerUserId?: string;
  status: 'available' | 'claimed' | 'used' | 'expired';
  claimedAt?: string;
  usedAt?: string;
};

export type RedeemCode = {
  id: string;
  code: string;
  benefitType: CouponBenefitType;
  benefitValue: number;
  status: 'unused' | 'redeemed' | 'disabled' | 'expired';
  redeemedByUserId?: string;
  redeemedAt?: string;
  expiresAt: string;
  createdAt: string;
};

export type CouponBatchPayload = {
  name: string;
  benefitType: CouponBenefitType;
  benefitValue: number;
  totalCount: number;
  startsAt: string;
  endsAt: string;
};

export type RedeemCodeBatchPayload = {
  batchName: string;
  benefitType: CouponBenefitType;
  benefitValue: number;
  quantity: number;
  expiresAt: string;
};

export type MarketingListResponse<T> = {
  items: T[];
  total: number;
};

export const benefitTypeLabels: Record<CouponBenefitType, string> = {
  membership_discount: '会员折扣',
  free_ai_credits: '免费 AI 次数',
  membership_days: '会员天数赠送',
};

export const marketingApi = {
  getCoupons: () => apiClient.get<MarketingListResponse<CouponBatch>>('/admin/marketing/coupons'),
  createCouponBatch: (payload: CouponBatchPayload) => apiClient.post<CouponBatch>('/admin/marketing/coupons', payload),
  updateCouponBatch: (id: string, payload: Partial<CouponBatchPayload> & { status?: MarketingStatus }) => (
    apiClient.put<CouponBatch>(`/admin/marketing/coupons/${id}`, payload)
  ),
  getRedeemCodes: () => apiClient.get<MarketingListResponse<RedeemCode>>('/admin/marketing/redeem-codes'),
  createRedeemCodeBatch: (payload: RedeemCodeBatchPayload) => (
    apiClient.post<MarketingListResponse<RedeemCode>>('/admin/marketing/redeem-codes/batch', payload)
  ),
};
