import { AiStatsPage } from './pages/AiStatsPage';
import { DashboardPage } from './pages/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { OrdersPage } from './pages/LegacyOrdersPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';
import { UsersPage } from './pages/UsersPage';
import { getRouteKey, menuItems, type RouteKey } from './state/app';
import { authState } from './state/auth';
import { clearElement, createElement, qs } from './utils/dom';
import './styles.css';

const root = qs<HTMLDivElement>('#root');

const pageFactories: Record<RouteKey, () => HTMLElement> = {
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

function renderLogin(): void {
  clearElement(root);
  root.append(LoginPage(() => navigate('/dashboard')));
}

function renderShell(routeKey: RouteKey): void {
  clearElement(root);

  const shell = createElement('div', { className: 'admin-shell' });
  const sidebar = createElement('aside', { className: 'sidebar' });
  const nav = createElement('nav', { className: 'nav-list' });

  sidebar.append(createElement('div', { className: 'brand', text: '房小评 Admin' }), nav);

  menuItems.forEach((item) => {
    const link = createElement('a', {
      className: `nav-item${item.key === routeKey ? ' active' : ''}`,
      attrs: { href: item.path },
    });
    link.append(createElement('span', { text: item.icon }), document.createTextNode(item.label));
    link.addEventListener('click', (event) => {
      event.preventDefault();
      navigate(item.path);
    });
    nav.append(link);
  });

  const main = createElement('main', { className: 'main-panel' });
  const header = createElement('header', { className: 'topbar' });
  const title = createElement('div');
  title.append(
    createElement('strong', { text: '房小评管理后台' }),
    createElement('span', { text: '连接 App 既有后端接口，统一管理业务运营数据' }),
  );

  const logout = createElement('button', { text: '退出登录', attrs: { type: 'button' } });
  logout.addEventListener('click', () => {
    authState.logout();
    navigate('/login');
  });

  const content = createElement('section', { className: 'content-card' });
  content.append(pageFactories[routeKey]());
  header.append(title, logout);
  main.append(header, content);
  shell.append(sidebar, main);
  root.append(shell);
}

function renderApp(): void {
  const routeKey = getRouteKey(window.location.pathname);

  if (routeKey === 'login') {
    if (authState.isAuthenticated()) {
      navigate('/dashboard');
      return;
    }

    renderLogin();
    return;
  }

  if (!authState.isAuthenticated()) {
    navigate('/login');
    return;
  }

  renderShell(routeKey);
}

window.addEventListener('popstate', renderApp);
authState.subscribe(renderApp);
renderApp();
