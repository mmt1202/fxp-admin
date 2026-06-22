import { apiClient } from './client';

export type UserTag = {
  id: string;
  name: string;
  color?: string;
};

export type UserAdminNote = {
  id: string;
  userId: string;
  adminId: string;
  content: string;
  createdAt: string;
};

export type UserTagsResponse = {
  tags: UserTag[];
};

export type UserAdminNotesResponse = {
  notes: UserAdminNote[];
};

export type UpdateUserTagsPayload = {
  tags: UserTag[];
};

export type CreateUserAdminNotePayload = {
  content: string;
};

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
