import { NavLink } from 'react-router-dom';
import { adminModules } from '../routes/modules';
import { useAuthStore } from '../store/auth';

export function Sidebar() {
  const { hasPermission } = useAuthStore();
  const visibleModules = adminModules.filter((item) => hasPermission(item.permission));

  return (
    <aside className="sidebar">
      <div className="brand">房小评 Admin</div>
      <nav className="nav-list">
        {visibleModules.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
