export type AppRoute = 'dashboard' | 'users' | 'orders' | 'ai-stats' | 'reports' | 'settings';

export type MenuItem = {
  route: AppRoute;
  path: string;
  label: string;
  icon: string;
  description: string;
};

export const menuItems: MenuItem[] = [
  { route: 'dashboard', path: '/dashboard', label: '数据看板', icon: '📊', description: '核心指标、增长趋势、评价质量与审核效率概览。' },
  { route: 'users', path: '/users', label: '用户管理', icon: '👥', description: '管理 App 用户、角色状态、实名信息与风控标签。' },
  { route: 'orders', path: '/orders', label: '订单管理', icon: '🧾', description: '跟进订单状态、退款售后、履约进度与异常单据。' },
  { route: 'ai-stats', path: '/ai-stats', label: 'AI 统计', icon: '🤖', description: '查看 AI 调用量、模型效果、成本趋势与失败原因。' },
  { route: 'reports', path: '/reports', label: '报表中心', icon: '📈', description: '汇总运营报表、导出任务、指标口径与周期对比。' },
  { route: 'settings', path: '/settings', label: '系统配置', icon: '⚙️', description: '配置后台权限、业务字典、审核策略与接口参数。' },
];

export function findMenuItem(pathname: string): MenuItem {
  return menuItems.find((item) => item.path === pathname) ?? menuItems[0];
}
