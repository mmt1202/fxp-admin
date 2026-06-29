import { NavLink } from 'react-router-dom';
import { adminModuleStatusLabels, adminModules } from '../routes/modules';
import { useAuthStore } from '../store/auth';

export function Sidebar() {
  const { token, currentAdmin, meLoading, hasPermission } = useAuthStore();
  const shouldWaitForPermissions = Boolean(token) && (meLoading || !currentAdmin);
  const visibleModules = shouldWaitForPermissions ? [] : adminModules.filter((item) => hasPermission(item.permission));

  return (
    <aside className="sidebar">
      <div className="brand">房小评 Admin</div>
      <nav className="nav-list">
        {shouldWaitForPermissions && <div className="nav-loading">正在加载权限菜单...</div>}
        {visibleModules.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span>{item.icon}</span>
            <span className="nav-label">{item.label}</span>
            <span className={`module-status-badge status-${item.status}`}>{adminModuleStatusLabels[item.status]}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
