import { apiClient, PageResult, QueryParams } from '../client';

export type ReviewStatus = 'visible' | 'hidden' | 'deleted';

export interface ReviewSummary {
  id: string;
  houseId: string;
  userId: string;
  rating: number;
  content: string;
  status: ReviewStatus;
  createdAt: string;
}

export interface ReviewDetail extends ReviewSummary {
  images: string[];
  tags: string[];
  updatedAt?: string;
}

export interface UpdateReviewStatusPayload {
  status: ReviewStatus;
  reason?: string;
}

export function getReviews(query?: QueryParams) {
  return apiClient.get<PageResult<ReviewSummary>>('/reviews', { query });
}

export function getReviewDetail(reviewId: string) {
  return apiClient.get<ReviewDetail>(`/reviews/${reviewId}`);
}

export function updateReviewStatus(reviewId: string, payload: UpdateReviewStatusPayload) {
  return apiClient.patch<ReviewDetail>(`/reviews/${reviewId}/status`, payload);
}
