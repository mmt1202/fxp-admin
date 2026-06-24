export type AdminModule = {
  path: string;
  label: string;
  icon: string;
  description: string;
  module: 'dashboard' | 'users' | 'orders' | 'ai-stats' | 'community-reports' | 'payment-reconciliation' | 'config';
};

export const adminModules: AdminModule[] = [
  { path: '/dashboard', label: '数据看板', icon: '📊', description: '核心指标、增长趋势、评价质量与审核效率概览。', module: 'dashboard' },
  { path: '/users', label: '用户管理', icon: '👥', description: '管理 App 用户、角色状态、实名信息与风控标签。', module: 'users' },
  { path: '/orders', label: '订单管理', icon: '📦', description: '查看订单履约、支付状态、退款售后与风险标记。', module: 'orders' },
  { path: '/finance/payment-reconciliation', label: '支付对账', icon: '💳', description: '核对本地订单支付流水与第三方渠道交易状态。', module: 'payment-reconciliation' },
  { path: '/ai-stats', label: 'AI 统计', icon: '🤖', description: '分析 AI 生成内容、调用量、成本与用户反馈。', module: 'ai-stats' },
  { path: '/community-reports', label: '社区举报', icon: '🚩', description: '处理社区举报、内容处置、申诉与审计记录。', module: 'community-reports' },
  { path: '/config', label: '系统配置', icon: '⚙️', description: '管理 App 公告、业务开关、最低版本与强制更新策略。', module: 'config' },
];
