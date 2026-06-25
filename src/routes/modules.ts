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
  | 'property-governance' | 'marketing' | 'marketing-tools' | 'user-segments' | 'city-config'
  | 'payment-reconciliation' | 'refunds' | 'ai-review' | 'ai-cost' | 'ai-prompts'
  | 'security-blacklist' | 'risk-watchlist' | 'community-library' | 'login-security'
  | 'property-duplicates' | 'support-tickets' | 'user-feedback' | 'export-tasks';

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
  module({ path: '/properties/duplicates', label: '重复房源', icon: '🧬', module: 'property-duplicates', description: '识别重复房源组，支持确认、合并、忽略等人工治理流程。', endpoints: [{ method: 'GET', path: '/admin/properties/duplicates', description: '获取重复房源组。' }, { method: 'POST', path: '/admin/properties/duplicates/:id/merge', description: '提交重复组处理动作。' }] }),
  module({ path: '/property-governance', label: '房源数据治理', icon: '🧭', module: 'property-governance', description: '检查房源完整度、定位缺失项并支持低分筛选。' }),
  module({ path: '/reviews', label: '评价管理', icon: '⭐', module: 'reviews', description: '查看房源评价、评分维度、内容质量与互动数据。' }),
  module({ path: '/content-moderation', label: '内容审核', icon: '📝', module: 'content-moderation', description: '审核社区笔记与评论，处理隐藏、恢复和驳回。' }),
  module({ path: '/moderation', label: '举报/审核管理', icon: '🛡️', module: 'moderation', description: '处理举报线索、内容审核、申诉与处置记录。', permission: 'reports:view' }),
  module({ path: '/reports', label: '举报审核', icon: '🛡️', module: 'reports', description: '处理社区举报线索与审核结果。', permission: 'reports:view' }),
  module({ path: '/orders', label: '订单管理', icon: '🧾', module: 'orders', description: '查看订单、支付状态、退款进度与履约记录。', permission: 'orders:view' }),
  module({ path: '/finance/reconciliation', label: '支付对账', icon: '💳', module: 'payment-reconciliation', description: '核对本地支付流水与第三方交易状态，支持手动对账、导出和异常修复。' }),
  module({ path: '/finance/refunds', label: '退款管理', icon: '↩️', module: 'refunds', description: '创建退款申请，完成财务审核，并执行第三方退款。' }),
  module({ path: '/ai-stats', label: 'AI 用量统计', icon: '🤖', module: 'ai-stats', description: '统计 AI 功能调用量与消耗情况。' }),
  module({ path: '/ai/reviews', label: 'AI 结果审核', icon: '🧪', module: 'ai-review', description: '抽检 AI 评房输出，处理高风险关键词、修正意见和问题样本。' }),
  module({ path: '/ai/costs', label: 'AI 成本监控', icon: '💸', module: 'ai-cost', description: '按时间、模型和用户统计 AI 调用成本，导出成本明细。' }),
  module({ path: '/ai/prompts', label: 'AI Prompt', icon: '✍️', module: 'ai-prompts', description: '管理 AI 评房 Prompt 模板、版本发布、回滚和差异对比。' }),
  module({ path: '/membership', label: '会员配置', icon: '💎', module: 'memberships', description: '配置会员权益、套餐状态、增值服务与更新策略。', permission: 'membership:update' }),
  module({ path: '/membership/plans', label: '会员套餐', icon: '💎', module: 'membership-plans', description: '配置会员套餐、价格、有效期、AI 次数额度与启停状态。' }),
  module({ path: '/marketing', label: '运营活动', icon: '🎯', module: 'marketing', description: '配置拉新、促活与转化活动，跟踪奖励发放和订单转化效果。' }),
  module({ path: '/marketing/tools', label: '营销工具', icon: '🎟️', module: 'marketing-tools', description: '管理优惠券批次、兑换码生成、领取记录和使用记录。' }),
  module({ path: '/marketing/recall-tasks', label: '用户召回', icon: '📣', module: 'recall-tasks', description: '创建 Push、短信、站内信与邮件召回任务，并跟踪异步发送结果。' }),
  module({ path: '/recommendation-pools', label: '推荐池管理', icon: '🎯', module: 'recommendation-pools', description: '创建首页推荐池，维护推荐内容、排序、置顶与定时上下线。' }),
  module({ path: '/content-quality', label: '内容质量', icon: '🏆', module: 'content-quality', description: '查看社区笔记、评论、房源评价与 AI 报告的质量评分和复核状态。' }),
  module({ path: '/user-lifecycle', label: '用户生命周期', icon: '🔁', module: 'user-lifecycle', description: '分析注册到复购、流失的关键用户转化路径。' }),
  module({ path: '/user-segments', label: '用户分群', icon: '🧩', module: 'user-segments', description: '维护用户分群与运营圈选条件。' }),
  module({ path: '/feedback', label: '用户反馈', icon: '💬', module: 'user-feedback', description: '处理 App 用户反馈，支持筛选、详情、回复和状态流转。' }),
  module({ path: '/support/tickets', label: '客服工单', icon: '🎧', module: 'support-tickets', description: '处理客服工单、转派客服、回复用户和记录内部备注。' }),
  module({ path: '/cms', label: '内容 CMS', icon: '📝', module: 'cms', description: '管理官方文章、Markdown 内容、预览以及发布状态。' }),
  module({ path: '/export/tasks', label: '导出中心', icon: '📤', module: 'export-tasks', description: '统一管理用户、订单、举报、AI 用量和支付流水导出任务。', endpoints: [{ method: 'GET', path: '/admin/export/tasks', description: '获取导出任务列表。' }, { method: 'POST', path: '/admin/export/tasks', description: '创建导出任务；大数据量由后端异步处理。' }, { method: 'GET', path: '/admin/export/tasks/:id/download', description: '下载已成功且未过期的导出文件。' }] }),
  module({ path: '/operation-logs', label: '操作日志', icon: '🧾', module: 'operation-logs', description: '按管理员、操作类型、目标对象与时间范围追踪后台操作。' }),
  module({ path: '/communities', label: '小区库', icon: '🏘️', module: 'community-library', description: '维护小区基础数据、标签、经纬度、风险提示，并支持小区合并。' }),
  module({ path: '/regional-heat', label: '区域热度', icon: '🔥', module: 'regional-heat', description: '按城市、区域与小区分析房源、评价、AI 评房和用户互动热度。' }),
  module({ path: '/geo/cities', label: '城市配置', icon: '🌆', module: 'city-config', description: '配置城市服务开通状态、热门城市、默认经纬度与运营说明。', endpoints: [{ method: 'GET', path: '/admin/geo/cities', description: '获取城市配置列表。' }, { method: 'POST', path: '/admin/geo/cities', description: '新增城市配置。' }, { method: 'PUT', path: '/admin/geo/cities/:id', description: '更新城市配置。' }, { method: 'PUT', path: '/admin/geo/cities/:id/status', description: '更新城市服务开通状态。' }] }),
  module({ path: '/security/login', label: '登录安全', icon: '🔎', module: 'login-security', description: '查看登录日志与异常登录事件，执行封禁或加入观察名单。' }),
  module({ path: '/security/blacklist', label: '黑名单', icon: '⛔', module: 'security-blacklist', description: '按用户、手机号、IP、设备和 OpenID 维护黑名单。' }),
  module({ path: '/security/watchlist', label: '风险观察名单', icon: '👁️', module: 'risk-watchlist', description: '维护风险用户观察名单，并查看风险事件时间线。' }),
  module({ path: '/system-health', label: '系统监控', icon: '🟢', module: 'system-health', description: '查看 API、数据库、Redis、队列、AI、支付回调与推送服务健康状态。' }),
  module({ path: '/config', label: '配置中心', icon: '⚙️', module: 'config', description: '配置后台权限、业务字典、审核策略与接口参数。' }),
  module({ path: '/settings', label: '系统配置', icon: '⚙️', module: 'settings', description: '配置后台权限、业务字典、审核策略与接口参数。' }),
  module({ path: '/risk', label: '风控配置', icon: '🚦', module: 'risk', description: '维护敏感词库、风控规则、命中记录与待审核策略。' }),
  module({ path: '/admin-users', label: '管理员管理', icon: '🔐', module: 'admin-users', description: '管理后台账号、角色、权限点与账号启停状态。', permission: 'admin-users:manage' }),
];
