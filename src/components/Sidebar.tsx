import { NavLink } from 'react-router-dom';
import { adminModules } from '../routes/modules';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">房小评 Admin</div>
      <nav className="nav-list">
        {adminModules.map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}>
            <span>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
