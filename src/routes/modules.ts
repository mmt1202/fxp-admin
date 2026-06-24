import type { ReactNode } from 'react';
import type { AdminPermission } from '../types/admin';

export type AdminEndpoint = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
};

export type AdminModuleKey =
  | 'dashboard' | 'analytics' | 'users' | 'properties' | 'reviews' | 'moderation' | 'config'
  | 'content-moderation' | 'content-quality' | 'recommendation-pools' | 'memberships' | 'orders'
  | 'ai-stats' | 'reports' | 'settings' | 'operation-logs' | 'user-lifecycle' | 'recall-tasks'
  | 'cms' | 'membership-plans' | 'regional-heat' | 'system-health' | 'risk' | 'admin-users'
  | 'property-governance' | 'marketing' | 'marketing-tools' | 'user-segments';

export type AdminModule = {
  path: string;
  label: string;
  icon: string;
  description: string;
  module: AdminModuleKey;
  endpoints: AdminEndpoint[];
  permission?: AdminPermission;
  element?: ReactNode;
};

const module = (item: Omit<AdminModule, 'endpoints'> & { endpoints?: AdminEndpoint[] }): AdminModule => ({
  endpoints: [],
  ...item,
});

export const adminModules: AdminModule[] = [
  module({ path: '/dashboard', label: '数据看板', icon: '📊', module: 'dashboard', description: '核心指标与增长趋势概览。', permission: 'dashboard:view', endpoints: [{ method: 'GET', path: '/admin/dashboard', description: '获取后台数据看板核心指标。' }, { method: 'GET', path: '/admin/dashboard/trend', description: '获取后台数据看板趋势数据。' }] }),
  module({ path: '/analytics', label: '数据分析', icon: '📈', module: 'analytics', description: '按时间范围分析用户、房源、会员转化与 AI 评房数据。' }),
  module({ path: '/users', label: '用户管理', icon: '👥', module: 'users', description: '管理 App 用户资料与账号状态。', permission: 'users:view', endpoints: [{ method: 'GET', path: '/admin/users', description: '获取用户列表。' }, { method: 'PUT', path: '/admin/users/:userId/status', description: '更新指定用户账号状态。' }] }),
  module({ path: '/users/:userId', label: '用户详情', icon: '👤', module: 'users', description: '查看用户资料、会员和举报记录。' }),
  module({ path: '/properties', label: '房源管理', icon: '🏠', module: 'properties', description: '维护房源基础信息、上下架状态、区域与配套标签。' }),
  module({ path: '/property-governance', label: '房源数据治理', icon: '🧭', module: 'property-governance', description: '检查房源完整度、定位缺失项并支持低分筛选。' }),
  module({ path: '/reviews', label: '评价管理', icon: '⭐', module: 'reviews', description: '查看房源评价、评分维度、内容质量与互动数据。' }),
  module({ path: '/content-moderation', label: '内容审核', icon: '📝', module: 'content-moderation', description: '审核社区笔记与评论，处理隐藏、恢复和驳回。' }),
  module({ path: '/moderation', label: '举报/审核管理', icon: '🛡️', module: 'moderation', description: '处理举报线索、内容审核、申诉与处置记录。', permission: 'reports:view' }),
  module({ path: '/reports', label: '举报审核', icon: '🛡️', module: 'reports', description: '处理社区举报线索与审核结果。', permission: 'reports:view' }),
  module({ path: '/orders', label: '订单管理', icon: '🧾', module: 'orders', description: '查看订单、支付状态、退款进度与履约记录。', permission: 'orders:view' }),
  module({ path: '/ai-stats', label: 'AI 用量统计', icon: '🤖', module: 'ai-stats', description: '统计 AI 功能调用量与消耗情况。' }),
  module({ path: '/membership', label: '会员配置', icon: '💎', module: 'memberships', description: '配置会员权益、套餐状态、增值服务与更新策略。', permission: 'membership:update' }),
  module({ path: '/membership/plans', label: '会员套餐', icon: '💎', module: 'membership-plans', description: '配置会员套餐、价格、有效期、AI 次数额度与启停状态。' }),
  module({ path: '/marketing', label: '运营活动', icon: '🎯', module: 'marketing', description: '配置拉新、促活与转化活动，跟踪奖励发放和订单转化效果。' }),
  module({ path: '/marketing/tools', label: '营销工具', icon: '🎟️', module: 'marketing-tools', description: '管理优惠券批次、兑换码生成、领取记录和使用记录。' }),
  module({ path: '/marketing/recall-tasks', label: '用户召回', icon: '📣', module: 'recall-tasks', description: '创建 Push、短信、站内信与邮件召回任务，并跟踪异步发送结果。' }),
  module({ path: '/recommendation-pools', label: '推荐池管理', icon: '🎯', module: 'recommendation-pools', description: '创建首页推荐池，维护推荐内容、排序、置顶与定时上下线。' }),
  module({ path: '/content-quality', label: '内容质量', icon: '🏆', module: 'content-quality', description: '查看社区笔记、评论、房源评价与 AI 报告的质量评分和复核状态。' }),
  module({ path: '/user-lifecycle', label: '用户生命周期', icon: '🔁', module: 'user-lifecycle', description: '分析注册到复购、流失的关键用户转化路径。' }),
  module({ path: '/user-segments', label: '用户分群', icon: '🧩', module: 'user-segments', description: '维护用户分群与运营圈选条件。' }),
  module({ path: '/cms', label: '内容 CMS', icon: '📝', module: 'cms', description: '管理官方文章、Markdown 内容、预览以及发布状态。' }),
  module({ path: '/operation-logs', label: '操作日志', icon: '🧾', module: 'operation-logs', description: '按管理员、操作类型、目标对象与时间范围追踪后台操作。' }),
  module({ path: '/regional-heat', label: '区域热度', icon: '🔥', module: 'regional-heat', description: '按城市、区域与小区分析房源、评价、AI 评房和用户互动热度。' }),
  module({ path: '/system-health', label: '系统监控', icon: '🟢', module: 'system-health', description: '查看 API、数据库、Redis、队列、AI、支付回调与推送服务健康状态。' }),
  module({ path: '/config', label: '配置中心', icon: '⚙️', module: 'config', description: '配置后台权限、业务字典、审核策略与接口参数。' }),
  module({ path: '/settings', label: '系统配置', icon: '⚙️', module: 'settings', description: '配置后台权限、业务字典、审核策略与接口参数。' }),
  module({ path: '/risk', label: '风控配置', icon: '🚦', module: 'risk', description: '维护敏感词库、风控规则、命中记录与待审核策略。' }),
  module({ path: '/admin-users', label: '管理员管理', icon: '🔐', module: 'admin-users', description: '管理后台账号、角色、权限点与账号启停状态。', permission: 'admin-users:manage' }),
];
