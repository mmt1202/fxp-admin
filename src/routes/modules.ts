export type AdminEndpoint = {
  method: 'GET' | 'PUT';
  path: string;
  description: string;
};

export type AdminModule = {
  path: string;
  label: string;
  icon: string;
  description: string;
  endpoints: AdminEndpoint[];
};

export const adminModules: AdminModule[] = [
  {
    path: '/dashboard',
    label: '数据看板',
    icon: '📊',
    description: '核心指标与增长趋势概览。',
    endpoints: [
      { method: 'GET', path: '/admin/dashboard', description: '获取后台数据看板核心指标。' },
      { method: 'GET', path: '/admin/dashboard/trend', description: '获取后台数据看板趋势数据。' },
    ],
  },
  {
    path: '/users',
    label: '用户管理',
    icon: '👥',
    description: '管理 App 用户资料与账号状态。',
    endpoints: [
      { method: 'GET', path: '/admin/users', description: '获取用户列表。' },
      { method: 'PUT', path: '/admin/users/:userId/status', description: '更新指定用户账号状态。' },
    ],
  },
  {
    path: '/memberships',
    label: '会员管理',
    icon: '💎',
    description: '查看与调整用户会员权益。',
    endpoints: [
      { method: 'GET', path: '/admin/users/:userId/membership', description: '获取指定用户会员信息。' },
      { method: 'PUT', path: '/admin/users/:userId/membership', description: '更新指定用户会员信息。' },
    ],
  },
  {
    path: '/orders',
    label: '订单流水',
    icon: '🧾',
    description: '查询订单、支付与流水记录。',
    endpoints: [{ method: 'GET', path: '/admin/orders', description: '获取订单流水列表。' }],
  },
  {
    path: '/ai-stats',
    label: 'AI 用量统计',
    icon: '🤖',
    description: '统计 AI 功能调用量与消耗情况。',
    endpoints: [{ method: 'GET', path: '/admin/ai-stats', description: '获取 AI 用量统计数据。' }],
  },
  {
    path: '/reports',
    label: '举报审核',
    icon: '🛡️',
    description: '处理社区举报线索与审核结果。',
    endpoints: [
      { method: 'GET', path: '/admin/community/reports', description: '获取社区举报列表。' },
      { method: 'PUT', path: '/admin/community/reports/:id', description: '更新指定举报处理状态。' },
    ],
  },
  {
    path: '/settings',
    label: '系统配置',
    icon: '⚙️',
    description: '配置后台权限、业务字典、审核策略与接口参数。',
    endpoints: [],
  },
];
