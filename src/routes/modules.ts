export type AdminModule = {
  path: string;
  label: string;
  icon: string;
  description: string;
  loader: 'dashboard' | 'users' | 'orders' | 'aiStats' | 'reports';
};

export const adminModules: AdminModule[] = [
  { path: '/dashboard', label: '数据看板', icon: '📊', description: '核心指标与增长趋势概览。', loader: 'dashboard' },
  { path: '/users', label: '用户管理', icon: '👥', description: '管理 App 用户、角色状态、实名信息与风控标签。', loader: 'users' },
  { path: '/orders', label: '订单管理', icon: '🧾', description: '查看订单交易、履约状态、支付与退款信息。', loader: 'orders' },
  { path: '/ai-stats', label: 'AI 统计', icon: '🤖', description: '查看 AI 调用、识别、生成与消耗统计。', loader: 'aiStats' },
  { path: '/community/reports', label: '举报/审核管理', icon: '🛡️', description: '处理社区举报线索、内容审核、申诉与处置记录。', loader: 'reports' },
];
