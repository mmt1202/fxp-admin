import { apiClient, PageResult, QueryParams } from '../client';

export type HouseStatus = 'online' | 'offline';

export interface HouseSummary {
  id: string;
  title: string;
  city: string;
  address: string;
  ownerId: string;
  status: HouseStatus;
  averageRating: number;
  createdAt: string;
}

export interface HouseDetail extends HouseSummary {
  description?: string;
  images: string[];
  reviewCount: number;
}

export interface UpdateHouseStatusPayload {
  status: HouseStatus;
  reason?: string;
}

export function getHouses(query?: QueryParams) {
  return apiClient.get<PageResult<HouseSummary>>('/houses', { query });
}

export function getHouseDetail(houseId: string) {
  return apiClient.get<HouseDetail>(`/houses/${houseId}`);
}

export function updateHouseStatus(houseId: string, payload: UpdateHouseStatusPayload) {
  return apiClient.patch<HouseDetail>(`/houses/${houseId}/status`, payload);
}
