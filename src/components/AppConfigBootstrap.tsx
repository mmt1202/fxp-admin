import { ReactNode, useEffect } from 'react';
import { useAppConfigStore } from '../store/appConfig';

type AppConfigBootstrapProps = {
  children: ReactNode;
};

export function AppConfigBootstrap({ children }: AppConfigBootstrapProps) {
  const loadAppConfig = useAppConfigStore((state) => state.loadAppConfig);

  useEffect(() => {
    void loadAppConfig();
  }, [loadAppConfig]);

  return children;
}
