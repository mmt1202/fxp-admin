import { apiClient, unwrapData, type ApiEnvelope } from './client';

export type AppPlatform = 'iOS' | 'Android';

export type AppVersionConfig = {
  id: string | number;
  platform: AppPlatform;
  latestVersion: string;
  minSupportedVersion: string;
  forceUpdate: boolean;
  releaseNotes: string;
  downloadUrl: string;
  rolloutPercentage: number;
  createdAt?: string;
  updatedAt?: string;
};

export type AppVersionPayload = Omit<AppVersionConfig, 'id' | 'createdAt' | 'updatedAt'>;

export type AppVersionCheckParams = {
  platform: AppPlatform;
  version: string;
  deviceId?: string;
};

export type AppVersionCheckResult = {
  platform: AppPlatform;
  latestVersion: string;
  minSupportedVersion: string;
  updateAvailable: boolean;
  forceUpdate: boolean;
  releaseNotes: string;
  downloadUrl: string;
  rolloutPercentage: number;
};

type AppVersionDto = Partial<AppVersionConfig> & {
  latest_version?: string;
  min_supported_version?: string;
  minimumVersion?: string;
  minimum_version?: string;
  minVersion?: string;
  force_update?: boolean;
  isForceUpdate?: boolean;
  is_force_update?: boolean;
  updateNotes?: string;
  update_notes?: string;
  release_notes?: string;
  grayRatio?: number;
  gray_ratio?: number;
  rollout_percentage?: number;
  download_url?: string;
  created_at?: string;
  updated_at?: string;
};

type ListResponse = ApiEnvelope<AppVersionDto[] | { list?: AppVersionDto[]; items?: AppVersionDto[]; appVersions?: AppVersionDto[] }>;

function normalizePlatform(value: unknown): AppPlatform {
  return String(value).toLowerCase() === 'android' ? 'Android' : 'iOS';
}

function readNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : fallback;
}

function normalizeVersion(version: AppVersionDto): AppVersionConfig {
  return {
    id: version.id ?? '',
    platform: normalizePlatform(version.platform),
    latestVersion: version.latestVersion ?? version.latest_version ?? '',
    minSupportedVersion: version.minSupportedVersion ?? version.min_supported_version ?? version.minimumVersion ?? version.minimum_version ?? version.minVersion ?? '',
    forceUpdate: Boolean(version.forceUpdate ?? version.force_update ?? version.isForceUpdate ?? version.is_force_update),
    releaseNotes: version.releaseNotes ?? version.release_notes ?? version.updateNotes ?? version.update_notes ?? '',
    downloadUrl: version.downloadUrl ?? version.download_url ?? '',
    rolloutPercentage: readNumber(version.rolloutPercentage ?? version.rollout_percentage ?? version.grayRatio ?? version.gray_ratio),
    createdAt: version.createdAt ?? version.created_at,
    updatedAt: version.updatedAt ?? version.updated_at,
  };
}

function normalizeList(response: ListResponse): AppVersionConfig[] {
  const body = unwrapData(response);
  if (Array.isArray(body)) return body.map(normalizeVersion);
  const items = body.list ?? body.items ?? body.appVersions ?? [];
  return items.map(normalizeVersion);
}

export const appVersionApi = {
  async list() {
    const response = await apiClient.get<ListResponse>('/admin/config/app-versions');
    return normalizeList(response);
  },
  async create(payload: AppVersionPayload) {
    const response = await apiClient.post<ApiEnvelope<AppVersionDto>>('/admin/config/app-versions', payload);
    return normalizeVersion(unwrapData(response));
  },
  async update(id: AppVersionConfig['id'], payload: AppVersionPayload) {
    const response = await apiClient.put<ApiEnvelope<AppVersionDto>>(`/admin/config/app-versions/${id}`, payload);
    return normalizeVersion(unwrapData(response));
  },
  async versionCheck(params: AppVersionCheckParams) {
    const response = await apiClient.get<ApiEnvelope<AppVersionCheckResult>>('/app/version-check', { skipAuth: true, query: params });
    return unwrapData(response);
  },
};
