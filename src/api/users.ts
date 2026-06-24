import { apiClient } from './client';

export type UserRecord = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
};

export function fetchUsers() {
  return apiClient.get<UserRecord[]>('/admin/users');
}
export type AccountStatus = 'active' | 'disabled' | 'risk' | 'pending';
export type MembershipStatus = 'none' | 'trial' | 'active' | 'expired';

export type AdminUserListItem = {
  id: string;
  name: string;
  phone: string;
  email: string;
  accountStatus: AccountStatus;
  membershipStatus: MembershipStatus;
  registeredAt: string;
  lastLoginAt: string | null;
  riskTags: string[];
};

export type UserOrderSummary = {
  totalOrders: number;
  paidOrders: number;
  refundedOrders: number;
  totalAmount: number;
  lastOrderAt: string | null;
};

export type AdminUserDetail = AdminUserListItem & {
  avatarUrl?: string;
  realNameStatus: 'verified' | 'unverified' | 'rejected';
  aiUsage: {
    monthlyQuota: number;
    usedThisMonth: number;
    totalUsed: number;
    lastUsedAt: string | null;
  };
  propertySummary: {
    total: number;
    online: number;
    offline: number;
    pendingReview: number;
  };
  communitySummary: {
    posts: number;
    comments: number;
    likesReceived: number;
  };
  reportSummary: {
    reportedCount: number;
    pendingCount: number;
    confirmedCount: number;
    latestReportedAt: string | null;
  };
  orderSummary: UserOrderSummary;
  membership: {
    planName: string;
    startedAt: string | null;
    expiresAt: string | null;
    autoRenew: boolean;
  };
  orders: Array<{
    id: string;
    productName: string;
    status: 'paid' | 'refunded' | 'closed' | 'pending';
    amount: number;
    paidAt: string | null;
  }>;
  properties: Array<{
    id: string;
    title: string;
    city: string;
    status: 'online' | 'offline' | 'pending';
    updatedAt: string;
  }>;
  reports: Array<{
    id: string;
    scene: string;
    reason: string;
    status: 'pending' | 'confirmed' | 'dismissed';
    createdAt: string;
  }>;
};

export type UserAdminNote = {
  id: string;
  userId: string;
  adminId: string;
  content: string;
  createdAt: string;
};
export type UserTag = {
  id: string;
  name: string;
  color?: string;
};

export function getAdminUsers() {
  return apiClient.get<AdminUserListItem[]>('/admin/users');
}
export type UserTagsResponse = {
  tags: UserTag[];
};

export type UserAdminNotesResponse = {
  notes: UserAdminNote[];
};

export function getAdminUserDetail(userId: string) {
  return apiClient.get<AdminUserDetail>(`/admin/users/${userId}`);
}
export type UpdateUserTagsPayload = {
  tags: UserTag[];
};

export function updateAdminUserStatus(userId: string, accountStatus: AccountStatus) {
  return apiClient.put<AdminUserDetail>(`/admin/users/${userId}/status`, { accountStatus });
}
export type CreateUserAdminNotePayload = {
  content: string;
};

export function updateAdminUserMembership(userId: string, membershipStatus: MembershipStatus) {
  return apiClient.put<AdminUserDetail>(`/admin/users/${userId}/membership`, { membershipStatus });
}
const encodeUserId = (userId: string) => encodeURIComponent(userId);

export const userProfileApi = {
  getTags: (userId: string) => apiClient.get<UserTagsResponse>(`/admin/users/${encodeUserId(userId)}/tags`),
  updateTags: (userId: string, tags: UserTag[]) => apiClient.put<UserTagsResponse>(
    `/admin/users/${encodeUserId(userId)}/tags`,
    { tags } satisfies UpdateUserTagsPayload,
  ),
  getNotes: (userId: string) => apiClient.get<UserAdminNotesResponse>(`/admin/users/${encodeUserId(userId)}/notes`),
  createNote: (userId: string, content: string) => apiClient.post<UserAdminNote>(
    `/admin/users/${encodeUserId(userId)}/notes`,
    { content } satisfies CreateUserAdminNotePayload,
  ),
};
