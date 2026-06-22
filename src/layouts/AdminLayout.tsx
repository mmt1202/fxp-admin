import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar';
import { useAuthStore } from '../store/auth';

export function AdminLayout() {
  const { token, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="admin-shell">
      <Sidebar />
      <main className="main-panel">
        <header className="topbar">
          <div>
            <strong>房小评管理后台</strong>
            <span>连接 App 既有后端接口，统一管理业务运营数据</span>
          </div>
          <button type="button" className="logout-button" onClick={handleLogout}>退出登录</button>
        </header>
        <section className="content-card">
          <Outlet />
        </section>
      </main>
    </div>
  );
}
