import { create } from 'zustand';
import { AppConfig, configApi, defaultAppConfig, normalizeAppConfig } from '../api/config';

type AppConfigStatus = 'idle' | 'loading' | 'ready' | 'error';

type AppConfigState = {
  config: AppConfig;
  status: AppConfigStatus;
  errorMessage: string;
  loadAppConfig: () => Promise<void>;
};

export const useAppConfigStore = create<AppConfigState>((set) => ({
  config: defaultAppConfig,
  status: 'idle',
  errorMessage: '',
  loadAppConfig: async () => {
    set({ status: 'loading', errorMessage: '' });

    try {
      const config = await configApi.getAppConfig();
      set({ config: normalizeAppConfig(config), status: 'ready' });
    } catch {
      set({
        config: defaultAppConfig,
        status: 'error',
        errorMessage: 'App 启动配置读取失败，已使用默认配置。',
      });
    }
  },
}));
