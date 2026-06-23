import { apiClient } from './client';

export type UserSegmentKey = 'new' | 'active' | 'ai_power' | 'creator' | 'community' | 'high_value' | 'risk' | 'member' | 'manual';

export type UserSegment = {
  key: UserSegmentKey | string;
  name: string;
  description?: string;
  count: number;
  mode?: 'auto' | 'manual';
  criteria?: Partial<Record<'registeredAt' | 'lastLoginAt' | 'aiUsageCount' | 'propertyCount' | 'postCount' | 'orderAmount' | 'reportCount' | 'membershipStatus', string | number | boolean>>;
};

export type UserSegmentUser = {
  id: string | number;
  nickname?: string;
  phone?: string;
  registeredAt?: string;
  lastLoginAt?: string;
  aiUsageCount?: number;
  propertyCount?: number;
  postCount?: number;
  orderAmount?: number;
  reportCount?: number;
  membershipStatus?: string;
  tags?: string[];
};

export type ManualSegmentPayload = {
  userIds: Array<string | number>;
  segment: string;
  tags?: string[];
  reason?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function unwrap<T>(payload: T | { data?: T }): T {
  return isRecord(payload) && 'data' in payload ? payload.data as T : payload as T;
}

function pickArray<T>(value: unknown, keys: string[]): T[] {
  const body = unwrap(value);

  if (Array.isArray(body)) {
    return body as T[];
  }

  if (!isRecord(body)) {
    return [];
  }

  for (const key of keys) {
    if (Array.isArray(body[key])) {
      return body[key] as T[];
    }
  }

  return [];
}

function toQuery(params?: Record<string, string | number | boolean | undefined>) {
  const search = new URLSearchParams();
  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
}

export const userSegmentsApi = {
  async getSegments() {
    const payload = await apiClient.get<unknown>('/admin/user-segments');
    return pickArray<UserSegment>(payload, ['segments', 'items']);
  },

  async getSegmentUsers(segment: string, params?: Record<string, string | number | boolean | undefined>) {
    const payload = await apiClient.get<unknown>(`/admin/user-segments/${encodeURIComponent(segment)}/users${toQuery(params)}`);
    return pickArray<UserSegmentUser>(payload, ['users', 'items']);
  },

  async applyManualSegment(data: ManualSegmentPayload) {
    return unwrap(await apiClient.post<unknown>('/admin/user-segments/manual', data));
  },
};
