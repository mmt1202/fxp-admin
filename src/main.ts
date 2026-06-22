import { AiStatsPage } from './pages/AiStatsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { OrdersPage } from './pages/OrdersPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { authState } from './state/auth';
import { AppRoute, findMenuItem, menuItems } from './state/app';
import { clearAndAppend, createElement, qs } from './utils/dom';
import './styles.css';

const pageFactories: Record<AppRoute, () => HTMLElement> = {
  dashboard: DashboardPage,
  users: UsersPage,
  orders: OrdersPage,
  'ai-stats': AiStatsPage,
  reports: ReportsPage,
  settings: SettingsPage,
};

function navigate(path: string): void {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
  }
  renderApp();
}

function renderSidebar(activePath: string): HTMLElement {
  const sidebar = createElement('aside', { className: 'sidebar' });
  const brand = createElement('div', { className: 'brand', textContent: '房小评 Admin' });
  const nav = createElement('nav', { className: 'nav-list' });

  menuItems.forEach((item) => {
    const link = createElement('a', {
      className: `nav-item${item.path === activePath ? ' active' : ''}`,
      attributes: { href: item.path },
    });
    link.innerHTML = `<span>${item.icon}</span>${item.label}`;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      navigate(item.path);
    });
    nav.append(link);
  });

  sidebar.append(brand, nav);
  return sidebar;
}

function renderShell(): HTMLElement {
  const activeItem = findMenuItem(window.location.pathname);
  const shell = createElement('div', { className: 'admin-shell' });
  const main = createElement('main', { className: 'main-panel' });
  const topbar = createElement('header', { className: 'topbar' });
  topbar.innerHTML = `
    <div>
      <strong>房小评管理后台</strong>
      <span>连接 App 既有后端接口，统一管理业务运营数据</span>
    </div>
    <button type="button">退出登录</button>
  `;
  qs<HTMLButtonElement>('button', topbar).addEventListener('click', () => {
    authState.logout();
    navigate('/login');
  });

  const content = createElement('section', { className: 'content-card' });
  content.append(pageFactories[activeItem.route]());
  main.append(topbar, content);
  shell.append(renderSidebar(activeItem.path), main);
  return shell;
}

function renderApp(): void {
  const root = qs<HTMLElement>('#root');
  const path = window.location.pathname;

  if (path === '/' || path === '') {
    navigate(authState.isAuthenticated() ? '/dashboard' : '/login');
    return;
  }

  if (!authState.isAuthenticated()) {
    clearAndAppend(root, LoginPage(() => navigate('/dashboard')));
    return;
  }

  if (path === '/login') {
    navigate('/dashboard');
    return;
  }

  clearAndAppend(root, renderShell());
}

window.addEventListener('popstate', renderApp);
renderApp();
