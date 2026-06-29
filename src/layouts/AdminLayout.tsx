import { useEffect } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { GlobalSearch } from '../components/GlobalSearch';
import { Sidebar } from '../components/Sidebar';
import { useAuthStore } from '../store/auth';

export function AdminLayout() {
  const { token, currentAdmin, meLoading, meError, fetchMe, logout } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (token && !currentAdmin) {
      void fetchMe();
    }
  }, [currentAdmin, fetchMe, token]);

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
            <span>{meLoading ? '正在加载管理员权限...' : `当前管理员：${currentAdmin?.displayName ?? currentAdmin?.username ?? '未加载'}`}</span>
            {meError ? <span className="permission-warning" role="status">{meError}</span> : null}
          </div>
          <GlobalSearch />
          <button type="button" className="logout-button" onClick={handleLogout}>退出登录</button>
        </header>
        <section className="content-card">
          {meLoading && !currentAdmin ? <div className="loading-state">正在校验登录状态与权限...</div> : <Outlet />}
        </section>
      </main>
    </div>
  );
}
