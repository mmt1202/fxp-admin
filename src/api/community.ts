import { apiClient } from './client';

export type CommunityContentStatus = 'published' | 'hidden_by_admin' | 'rejected';

export type CommunityModerationFilters = {
  keyword?: string;
  author?: string;
  minReportCount?: string;
  maxReportCount?: string;
  publishedFrom?: string;
  publishedTo?: string;
  status?: CommunityContentStatus | 'all';
};

export type CommunityNote = {
  id: string;
  title: string;
  content: string;
  author: string;
  reportCount: number;
  latestReportReason?: string;
  publishedAt: string;
  status: CommunityContentStatus;
};

export type CommunityComment = {
  id: string;
  noteId: string;
  content: string;
  author: string;
  reportCount: number;
  latestReportReason?: string;
  publishedAt: string;
  status: CommunityContentStatus;
};

type ListResponse<T> = {
  items: T[];
  total: number;
};

function buildQuery(filters: CommunityModerationFilters) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value && value !== 'all') {
      params.set(key, value);
    }
  });

  const query = params.toString();
  return query ? `?${query}` : '';
}

export const communityApi = {
  listNotes: (filters: CommunityModerationFilters) =>
    apiClient.get<ListResponse<CommunityNote>>(`/admin/community/notes${buildQuery(filters)}`),
  getNote: (id: string) => apiClient.get<CommunityNote>(`/admin/community/notes/${id}`),
  updateNoteStatus: (id: string, status: CommunityContentStatus) =>
    apiClient.put<CommunityNote>(`/admin/community/notes/${id}/status`, { status }),
  listComments: (filters: CommunityModerationFilters) =>
    apiClient.get<ListResponse<CommunityComment>>(`/admin/community/comments${buildQuery(filters)}`),
  updateCommentStatus: (id: string, status: CommunityContentStatus) =>
    apiClient.put<CommunityComment>(`/admin/community/comments/${id}/status`, { status }),
};
