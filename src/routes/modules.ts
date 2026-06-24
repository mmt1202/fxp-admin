export type AdminEndpoint = {
  method: 'GET' | 'PUT';
  path: string;
  label: string;
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
    description: '展示后台核心指标与趋势数据。',
    endpoints: [
      { method: 'GET', path: '/admin/dashboard', label: '核心指标' },
      { method: 'GET', path: '/admin/dashboard/trend', label: '趋势数据' },
    ],
  },
  {
    path: '/users',
    label: '用户管理',
    icon: '👥',
    description: '查询 App 用户并管理用户状态。',
    endpoints: [
      { method: 'GET', path: '/admin/users', label: '用户列表' },
      { method: 'PUT', path: '/admin/users/:userId/status', label: '更新用户状态' },
    ],
  },
  {
    path: '/memberships',
    label: '会员管理',
    icon: '💎',
    description: '查看与调整用户会员权益。',
    endpoints: [
      { method: 'GET', path: '/admin/users/:userId/membership', label: '会员详情' },
      { method: 'PUT', path: '/admin/users/:userId/membership', label: '更新会员' },
    ],
  },
  {
    path: '/orders',
    label: '订单流水',
    icon: '🧾',
    description: '查询后台订单与支付流水。',
    endpoints: [{ method: 'GET', path: '/admin/orders', label: '订单列表' }],
  },
  {
    path: '/ai-stats',
    label: 'AI 用量统计',
    icon: '🤖',
    description: '统计 AI 调用量、消耗与趋势。',
    endpoints: [{ method: 'GET', path: '/admin/ai-stats', label: 'AI 用量' }],
  },
  {
    path: '/reports',
    label: '举报审核',
    icon: '🛡️',
    description: '处理社区举报与审核处置。',
    endpoints: [
      { method: 'GET', path: '/admin/community/reports', label: '举报列表' },
      { method: 'PUT', path: '/admin/community/reports/:id', label: '更新举报状态' },
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
