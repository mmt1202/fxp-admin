import { AdminUsers } from '../pages/AdminUsers';
import { ModulePage } from '../pages/ModulePage';
import { useAuthStore } from '../store/auth';
import type { AdminModule } from './modules';

export function PermissionRoute({ module }: { module: AdminModule }) {
  const hasPermission = useAuthStore((state) => state.hasPermission);

  if (!hasPermission(module.permission)) {
    return <div className="empty-state">无权访问「{module.label}」，请联系超级管理员开通 {module.permission} 权限。</div>;
  }

  if (module.path === '/admin-users') {
    return <AdminUsers />;
  }

  return <ModulePage title={module.label} description={module.description} permission={module.permission} />;
}
