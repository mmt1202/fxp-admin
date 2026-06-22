export type AdminModule = {
  path: string;
  label: string;
  icon: string;
  description: string;
  module: 'dashboard' | 'users' | 'orders' | 'ai-stats' | 'community-reports';
};

export const adminModules: AdminModule[] = [
  { path: '/dashboard', label: '数据看板', icon: '📊', description: '核心指标与增长趋势概览。', module: 'dashboard' },
  { path: '/users', label: '用户管理', icon: '👥', description: '管理 App 用户、角色状态、实名信息与风控标签。', module: 'users' },
  { path: '/orders', label: '订单管理', icon: '🧾', description: '查看订单列表、支付状态、交易金额与履约信息。', module: 'orders' },
  { path: '/ai-stats', label: 'AI 统计', icon: '🤖', description: '查看 AI 调用、识别结果与业务统计。', module: 'ai-stats' },
  { path: '/community-reports', label: '举报/审核管理', icon: '🛡️', description: '处理社区举报线索、内容审核、申诉与处置记录。', module: 'community-reports' },
];
