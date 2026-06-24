import { apiClient } from './client';

export type CityConfig = {
  id: string | number;
  name: string;
  code: string;
  serviceEnabled: boolean;
  sort: number;
  defaultLatitude: number;
  defaultLongitude: number;
  operator: string;
  hot: boolean;
  operationNote: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CityConfigPayload = Omit<CityConfig, 'id' | 'createdAt' | 'updatedAt'>;

export type CityStatusPayload = {
  serviceEnabled: boolean;
};

export const defaultCityConfigPayload: CityConfigPayload = {
  name: '',
  code: '',
  serviceEnabled: true,
  sort: 0,
  defaultLatitude: 31.2304,
  defaultLongitude: 121.4737,
  operator: '',
  hot: false,
  operationNote: '',
};

const normalizeBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'number') {
    return value === 1;
  }

  return fallback;
};

const normalizeNumber = (value: unknown, fallback = 0) => {
  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : fallback;
};

const normalizeCityConfig = (city: Partial<CityConfig> & Record<string, unknown>): CityConfig => ({
  id: city.id ?? city.code ?? '',
  name: String(city.name ?? city.cityName ?? ''),
  code: String(city.code ?? city.cityCode ?? ''),
  serviceEnabled: normalizeBoolean(city.serviceEnabled ?? city.enabled ?? city.isServiceEnabled, true),
  sort: normalizeNumber(city.sort ?? city.sortOrder),
  defaultLatitude: normalizeNumber(city.defaultLatitude ?? city.latitude ?? city.lat, defaultCityConfigPayload.defaultLatitude),
  defaultLongitude: normalizeNumber(city.defaultLongitude ?? city.longitude ?? city.lng, defaultCityConfigPayload.defaultLongitude),
  operator: String(city.operator ?? city.operatorName ?? city.owner ?? ''),
  hot: normalizeBoolean(city.hot ?? city.isHot),
  operationNote: String(city.operationNote ?? city.operationDescription ?? city.note ?? ''),
  createdAt: typeof city.createdAt === 'string' ? city.createdAt : undefined,
  updatedAt: typeof city.updatedAt === 'string' ? city.updatedAt : undefined,
});

const normalizeCityList = (payload: unknown): CityConfig[] => {
  const body = payload && typeof payload === 'object' && 'data' in payload ? (payload as { data: unknown }).data : payload;

  if (Array.isArray(body)) {
    return body.map((item) => normalizeCityConfig(item as Partial<CityConfig> & Record<string, unknown>));
  }

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    const items = Array.isArray(record.items) ? record.items : Array.isArray(record.cities) ? record.cities : [];
    return items.map((item) => normalizeCityConfig(item as Partial<CityConfig> & Record<string, unknown>));
  }

  return [];
};

const normalizeCityResponse = (payload: unknown): CityConfig => {
  const body = payload && typeof payload === 'object' && 'data' in payload ? (payload as { data: unknown }).data : payload;
  return normalizeCityConfig((body ?? {}) as Partial<CityConfig> & Record<string, unknown>);
};

export const geoApi = {
  getCities: async () => normalizeCityList(await apiClient.get<unknown>('/admin/geo/cities')),
  createCity: async (city: CityConfigPayload) => normalizeCityResponse(await apiClient.post<unknown>('/admin/geo/cities', city)),
  updateCity: async (id: CityConfig['id'], city: CityConfigPayload) => normalizeCityResponse(await apiClient.put<unknown>(`/admin/geo/cities/${id}`, city)),
  updateCityStatus: async (id: CityConfig['id'], status: CityStatusPayload) => normalizeCityResponse(await apiClient.put<unknown>(`/admin/geo/cities/${id}/status`, status)),
};
