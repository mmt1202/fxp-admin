import type { ReactNode } from 'react';
import { useAuthStore } from '../store/auth';
import type { AdminModule } from './modules';

export function PermissionRoute({ module, children }: { module: AdminModule; children: ReactNode }) {
  const hasPermission = useAuthStore((state) => state.hasPermission);

  if (module.permission && !hasPermission(module.permission)) {
    return <div className="empty-state">无权访问「{module.label}」，请联系超级管理员开通 {module.permission} 权限。</div>;
  }

  return <>{children}</>;
}
