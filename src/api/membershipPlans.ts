import { apiClient } from './client';

export type MembershipPlan = {
  id: string | number;
  name: string;
  type: string;
  price: number;
  validityDays: number;
  aiQuota: number;
  enabled: boolean;
  sortOrder: number;
  inUse: boolean;
};

export type MembershipPlanPayload = Omit<MembershipPlan, 'id' | 'inUse'>;

type MembershipPlanDto = Partial<MembershipPlan> & {
  planName?: string;
  planType?: string;
  validity_days?: number;
  ai_quota?: number;
  is_enabled?: boolean;
  sort?: number;
  sort_order?: number;
  in_use?: boolean;
};

type ListResponse = MembershipPlanDto[] | {
  data?: MembershipPlanDto[] | { list?: MembershipPlanDto[]; items?: MembershipPlanDto[] };
  items?: MembershipPlanDto[];
  list?: MembershipPlanDto[];
};

function readNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizePlan(plan: MembershipPlanDto): MembershipPlan {
  return {
    id: plan.id ?? '',
    name: plan.name ?? plan.planName ?? '',
    type: plan.type ?? plan.planType ?? 'custom',
    price: readNumber(plan.price),
    validityDays: readNumber(plan.validityDays ?? plan.validity_days, 1),
    aiQuota: readNumber(plan.aiQuota ?? plan.ai_quota),
    enabled: Boolean(plan.enabled ?? plan.is_enabled),
    sortOrder: readNumber(plan.sortOrder ?? plan.sort_order ?? plan.sort),
    inUse: Boolean(plan.inUse ?? plan.in_use),
  };
}

function normalizeList(response: ListResponse): MembershipPlan[] {
  if (Array.isArray(response)) {
    return response.map(normalizePlan);
  }

  if (Array.isArray(response.data)) {
    return response.data.map(normalizePlan);
  }

  if (response.data && !Array.isArray(response.data)) {
    const nested = response.data.list ?? response.data.items;
    if (Array.isArray(nested)) {
      return nested.map(normalizePlan);
    }
  }

  if (Array.isArray(response.items)) {
    return response.items.map(normalizePlan);
  }

  if (Array.isArray(response.list)) {
    return response.list.map(normalizePlan);
  }

  return [];
}

export const membershipPlanApi = {
  async list() {
    const response = await apiClient.get<ListResponse>('/admin/membership/plans');
    return normalizeList(response);
  },
  async create(payload: MembershipPlanPayload) {
    const response = await apiClient.post<MembershipPlanDto>('/admin/membership/plans', payload);
    return normalizePlan(response);
  },
  async update(id: MembershipPlan['id'], payload: MembershipPlanPayload) {
    const response = await apiClient.put<MembershipPlanDto>(`/admin/membership/plans/${id}`, payload);
    return normalizePlan(response);
  },
  remove: (id: MembershipPlan['id']) => apiClient.delete<void>(`/admin/membership/plans/${id}`),
};
