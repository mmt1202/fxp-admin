import { adaptList, apiClient, type ApiEnvelope, unwrapData } from './client';

export type ForceUpdateConfig = {
  enabled: boolean;
  version: string;
  message: string;
  downloadUrl: string;
};

export type AppConfig = {
  homeAnnouncement: string;
  aiReviewEnabled: boolean;
  membershipPurchaseEnabled: boolean;
  communityPostEnabled: boolean;
  reportEntryEnabled: boolean;
  minAppVersion: string;
  forceUpdate: ForceUpdateConfig;
  featureFlags: FeatureFlag[];
};

export type FeatureFlag = {
  id: string | number;
  key: string;
  name: string;
  enabled: boolean;
  rolloutPercent: number;
  targetUsers: string[];
  targetCities: string[];
  createdAt?: string;
  updatedAt?: string;
};

export type FeatureFlagPayload = Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>;

export const defaultFeatureFlagPayload: FeatureFlagPayload = {
  key: '',
  name: '',
  enabled: false,
  rolloutPercent: 0,
  targetUsers: [],
  targetCities: [],
};

export const defaultAppConfig: AppConfig = {
  homeAnnouncement: '',
  aiReviewEnabled: true,
  membershipPurchaseEnabled: true,
  communityPostEnabled: true,
  reportEntryEnabled: true,
  minAppVersion: '',
  forceUpdate: {
    enabled: false,
    version: '',
    message: '',
    downloadUrl: '',
  },
  featureFlags: [],
};

const asStringArray = (value: unknown): string[] => Array.isArray(value)
  ? value.map((item) => String(item).trim()).filter(Boolean)
  : [];

export const normalizeFeatureFlag = (flag: Partial<FeatureFlag>): FeatureFlag => ({
  id: flag.id ?? flag.key ?? '',
  key: flag.key ?? '',
  name: flag.name ?? flag.key ?? '',
  enabled: Boolean(flag.enabled),
  rolloutPercent: Math.min(100, Math.max(0, Number(flag.rolloutPercent) || 0)),
  targetUsers: asStringArray(flag.targetUsers),
  targetCities: asStringArray(flag.targetCities),
  createdAt: flag.createdAt,
  updatedAt: flag.updatedAt,
});

export const normalizeAppConfig = (config: Partial<AppConfig>): AppConfig => ({
  ...defaultAppConfig,
  ...config,
  forceUpdate: {
    ...defaultAppConfig.forceUpdate,
    ...config.forceUpdate,
  },
  featureFlags: (config.featureFlags ?? []).map(normalizeFeatureFlag),
});

const unwrapFeatureFlag = (payload: ApiEnvelope<FeatureFlag>) => normalizeFeatureFlag(unwrapData(payload));

export const configApi = {
  getAdminConfig: () => apiClient.get<AppConfig>('/admin/config'),
  updateAdminConfig: (config: AppConfig) => apiClient.put<AppConfig>('/admin/config', config),
  getAppConfig: () => apiClient.get<AppConfig>('/app/config', { skipAuth: true }),
  getFeatureFlags: async () => {
    const payload = await apiClient.get<ApiEnvelope<unknown>>('/admin/config/feature-flags');
    return adaptList<FeatureFlag>(payload, ['featureFlags', 'flags', 'items', 'list']).items.map(normalizeFeatureFlag);
  },
  createFeatureFlag: async (flag: FeatureFlagPayload) => {
    const payload = await apiClient.post<ApiEnvelope<FeatureFlag>>('/admin/config/feature-flags', flag);
    return unwrapFeatureFlag(payload);
  },
  updateFeatureFlag: async (id: FeatureFlag['id'], flag: FeatureFlagPayload) => {
    const payload = await apiClient.put<ApiEnvelope<FeatureFlag>>(`/admin/config/feature-flags/${id}`, flag);
    return unwrapFeatureFlag(payload);
  },
};
