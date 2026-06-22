import { apiClient } from './client';

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
};

export const normalizeAppConfig = (config: Partial<AppConfig>): AppConfig => ({
  ...defaultAppConfig,
  ...config,
  forceUpdate: {
    ...defaultAppConfig.forceUpdate,
    ...config.forceUpdate,
  },
});

export const configApi = {
  getAdminConfig: () => apiClient.get<AppConfig>('/admin/config'),
  updateAdminConfig: (config: AppConfig) => apiClient.put<AppConfig>('/admin/config', config),
  getAppConfig: () => apiClient.get<AppConfig>('/app/config', { skipAuth: true }),
};
