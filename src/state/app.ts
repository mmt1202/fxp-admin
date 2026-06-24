export type RouteKey = 'dashboard' | 'users' | 'orders' | 'ai-stats' | 'reports' | 'settings';

export type AppRoute = 'dashboard' | 'users' | 'orders' | 'ai-stats' | 'reports' | 'settings';

export type MenuItem = {
  key: RouteKey;
  route: AppRoute;
  path: string;
  label: string;
  icon: string;
  description: string;
};

export const menuItems: MenuItem[] = [
  { key: 'dashboard', route: 'dashboard', path: '/dashboard', label: '数据看板', icon: '📊', description: '核心指标、增长趋势、评价质量与审核效率概览。' },
  { key: 'users', route: 'users', path: '/users', label: '用户管理', icon: '👥', description: '管理 App 用户、角色状态、实名信息与风控标签。' },
  { key: 'orders', route: 'orders', path: '/orders', label: '订单管理', icon: '🧾', description: '查看订单状态、退款售后、支付流水与履约异常。' },
  { key: 'ai-stats', route: 'ai-stats', path: '/ai-stats', label: 'AI 统计', icon: '🤖', description: '追踪 AI 调用量、成功率、成本与模型表现。' },
  { key: 'reports', route: 'reports', path: '/reports', label: '报表中心', icon: '📈', description: '汇总运营报表、导出任务、周期指标与业务洞察。' },
  { key: 'settings', route: 'settings', path: '/settings', label: '系统配置', icon: '⚙️', description: '配置后台权限、业务字典、审核策略与接口参数。' },
];

export function getRouteKey(pathname: string): RouteKey | 'login' {
  if (pathname === '/login') {
    return 'login';
  }

  return menuItems.find((item) => item.path === pathname)?.key ?? 'dashboard';
}

export function findMenuItem(pathname: string): MenuItem {
  return menuItems.find((item) => item.path === pathname) ?? menuItems[0];
}