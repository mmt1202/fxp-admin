# 房小评管理后台后端接口需求文档

> 本文档面向另一个后端工程实现管理后台 API。依据当前 `fxp-admin` 前端项目的 `src/api/*` 调用、页面功能与现有 `docs/api.md` 约定整理。移动端 App 后端可继续保留 `/api/auth`、`/api/properties` 等 App 接口；本管理后台重点需要 `/api/admin/*` 与少量 `/api/app/*` 公共配置接口。

## 1. 后端整体要求

### 1.1 推荐技术形态

后端可以继续使用现有框架，但需满足以下能力：

- **REST API**：统一挂载在 `/api` 前缀下，管理端接口统一在 `/api/admin` 下。
- **JWT 鉴权**：管理员登录后返回 Token，前端通过 `Authorization: Bearer <token>` 访问除登录外的接口。
- **RBAC 权限**：支持管理员角色、权限点、超级管理员 `*` 权限。
- **统一响应格式**：成功响应建议返回 `{ code, message, data }`，前端也兼容部分接口直接返回 `data`。
- **统一分页格式**：列表接口建议返回 `{ items, total, page, pageSize }`，前端兼容 `list`、`rows`、业务名数组字段。
- **审计日志**：管理员关键操作需要记录操作者、操作对象、IP、User-Agent、变更前后内容。
- **异步任务**：导入、导出、推送、批量兑换码、支付对账等适合使用队列。
- **第三方集成**：支付、对象存储、短信/推送、高德地图、LLM 供应商等密钥全部放后端。

### 1.2 Base URL 与环境变量

前端默认从环境变量读取：

```bash
VITE_API_BASE_URL=https://your-domain.com/api
```

所有接口路径示例：

```text
POST /api/admin/auth/login
GET  /api/admin/users?page=1&pageSize=20
```

### 1.3 通用请求头

```http
Content-Type: application/json
Authorization: Bearer <adminAccessToken>
```

上传文件时使用 `multipart/form-data`，Token 仍放在 `Authorization`。

### 1.4 通用成功响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

### 1.5 通用错误响应

```json
{
  "code": 40001,
  "message": "参数错误",
  "timestamp": "2026-06-29T12:00:00.000Z",
  "path": "/api/admin/users"
}
```

建议错误码：

| code | 含义 |
| --- | --- |
| 40001 | 参数错误 |
| 40101 | 未登录或 Token 失效 |
| 40301 | 权限不足 |
| 40401 | 资源不存在 |
| 40901 | 业务冲突 |
| 42901 | 限流 |
| 50001 | 服务端错误 |

### 1.6 通用分页响应

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "pageSize": 20
  }
}
```

## 2. 管理后台核心数据模型

### 2.1 AdminUser 管理员

```ts
interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  status: 'active' | 'disabled';
  role: AdminRole;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

interface AdminRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[]; // 超级管理员可返回 ['*']
}
```

### 2.2 AppUser App 用户

```ts
interface AppUser {
  id: string | number;
  name: string;
  nickname?: string;
  phone?: string;
  email?: string;
  avatarUrl?: string;
  accountStatus: 'active' | 'disabled' | 'risk' | 'pending';
  membershipStatus: 'none' | 'trial' | 'active' | 'expired';
  registeredAt: string;
  lastLoginAt?: string | null;
  riskTags: string[];
  tags?: UserTag[];
}
```

### 2.3 AdminProperty 房源

```ts
interface AdminProperty {
  id: string | number;
  title: string;
  city?: string;
  district?: string;
  community?: string;
  address?: string;
  ownerId?: string | number;
  ownerName?: string;
  ownerPhone?: string;
  propertyType?: string;
  scene?: 'rent' | 'sale';
  price?: number;
  score?: number;
  isPublic?: boolean;
  status?: 'online' | 'offline' | 'pending' | 'deleted';
  viewCount?: number;
  favoriteCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
```

### 2.4 CommunityNote 社区笔记

```ts
interface CommunityNote {
  id: string | number;
  title: string;
  content?: string;
  authorId?: string | number;
  authorName?: string;
  city?: string;
  channel?: string;
  status: 'draft' | 'published' | 'hidden' | 'deleted' | 'pending';
  likeCount?: number;
  commentCount?: number;
  favoriteCount?: number;
  viewCount?: number;
  createdAt?: string;
  updatedAt?: string;
}
```

### 2.5 Money 与时间

- 金额统一用 **分** 存储，接口可返回元为单位的 `number` 给后台展示；如要精确结算，额外返回 `amountCents`。
- 时间统一 ISO 8601 字符串，例如 `2026-06-29T12:00:00.000Z`。

## 3. 接口总览

| 模块 | 前缀 | 用途 |
| --- | --- | --- |
| 管理员认证 | `/admin/auth` | 登录、当前管理员 |
| 管理员与角色 | `/admin/admin-users`, `/admin/admin-roles` | 后台账号管理 |
| 首页大盘 | `/admin/dashboard` | 运营概览、趋势 |
| 用户管理 | `/admin/users` | 用户列表、详情、状态、标签、备注 |
| 用户分群 | `/admin/user-segments` | 分群统计与人工打标 |
| 房源治理 | `/admin/properties` | 房源列表、详情、审核、完整度 |
| 社区治理 | `/admin/community` | 笔记、评论、举报 |
| 内容风控 | `/admin/risk`, `/admin/moderation` | 敏感词、规则、命中、审核队列 |
| AI 运营 | `/admin/ai-stats`, `/admin/ai` | AI 用量、成本、Prompt、评房记录 |
| 会员订单 | `/admin/orders`, `/admin/membership` | 订单、会员方案 |
| 营销推送 | `/admin/marketing`, `/admin/push` | 活动、优惠券、召回、Push |
| CMS | `/admin/cms` | 官方文章内容 |
| 配置中心 | `/admin/config`, `/app/config` | App 配置、功能开关、版本 |
| 地理数据 | `/admin/geo` | 城市管理 |
| 导入导出 | `/admin/import`, `/admin/export` | 异步任务 |
| 系统安全 | `/admin/security`, `/admin/system` | 登录日志、健康检查 |
| 搜索与日志 | `/admin/search`, `/admin/operation-logs` | 全局搜索、操作日志 |

## 4. 详细接口

### 4.1 管理员认证

#### POST `/api/admin/auth/login`

管理员登录，无需 Token。

**Body**

```json
{
  "username": "admin",
  "password": "password"
}
```

**Response data**

```json
{
  "token": "jwt-token",
  "expiresIn": 7200,
  "admin": {
    "id": "adm_001",
    "username": "admin",
    "displayName": "超级管理员",
    "role": { "id": "super-admin", "name": "超级管理员", "permissions": ["*"] },
    "permissions": ["*"]
  }
}
```

> 注意：当前前端登录代码强依赖 `token` 字段，不是 `accessToken`。如果后端返回 `accessToken`，建议同时返回 `token` 兼容。

#### GET `/api/admin/auth/me`

获取当前管理员信息。

**Response data**：`AdminUser`。

### 4.2 管理员账号与角色

#### GET `/api/admin/admin-users`

返回全部管理员或分页管理员列表。

**Query**：`page?`, `pageSize?`, `keyword?`, `status?`。

**Response data**：`AdminUser[]` 或分页对象。

#### POST `/api/admin/admin-users`

创建管理员。

```json
{
  "username": "operator01",
  "displayName": "运营同学",
  "password": "InitialPassword123",
  "roleId": "operation",
  "permissions": ["users:read"]
}
```

#### PUT `/api/admin/admin-users/{id}`

更新管理员资料、角色、状态或权限。

#### DELETE `/api/admin/admin-users/{id}`

删除或停用管理员。不允许删除最后一个超级管理员。

#### GET `/api/admin/admin-roles`

返回角色列表。

### 4.3 首页大盘与经营分析

#### GET `/api/admin/dashboard`

返回后台首页大盘统计。

**Response data 示例**

```json
{
  "users": { "total": 12000, "newToday": 35, "activeToday": 860 },
  "properties": { "total": 3200, "newToday": 12, "publicCount": 1200 },
  "community": { "notes": 800, "pendingReports": 6 },
  "ai": { "callsToday": 430, "successRate": 0.982, "costToday": 128.5 },
  "membership": { "activeMembers": 520, "revenueThisMonth": 38800 },
  "recentOrders": []
}
```

#### GET `/api/admin/dashboard/trend`

近 30 天趋势。

**Response data**

```json
[
  { "date": "2026-06-01", "users": 10, "properties": 5, "orders": 2, "revenue": 198 }
]
```

#### GET `/api/admin/dashboard/summary`

用于新版首页摘要卡片，可返回 `cards`、`todos`、`quickLinks`、`systemAlerts`。

#### GET `/api/admin/analytics/overview`
#### GET `/api/admin/analytics/users`
#### GET `/api/admin/analytics/properties`
#### GET `/api/admin/analytics/membership`
#### GET `/api/admin/analytics/ai-review`

**Query**：`preset=today|7d|30d|custom`, `startDate?`, `endDate?`。

**Response data**

```ts
interface AnalyticsSection {
  title: string;
  cards: Array<{ label: string; value: string; delta: string; hint: string }>;
  trend: Array<{ date: string; users?: number; properties?: number; aiReviews?: number; revenue?: number }>;
  table: Array<{ name: string; value: string; meta: string }>;
}
```

#### GET `/api/admin/analytics/locations`
#### GET `/api/admin/analytics/communities`

**Query**：`city?`, `district?`, `community?`, `range?`, `startDate?`, `endDate?`。

**Response data**

```json
{
  "items": [
    {
      "id": "loc_1",
      "city": "上海",
      "district": "浦东新区",
      "community": "张江",
      "name": "张江",
      "propertyCount": 120,
      "communityCount": 36,
      "reviewCount": 80,
      "aiReviewCount": 66,
      "userCount": 300,
      "heatScore": 92,
      "favoriteCount": 500,
      "viewCount": 12000,
      "favoriteAndViewCount": 12500
    }
  ]
}
```

### 4.4 用户管理

#### GET `/api/admin/users`

**Query**：`page?`, `pageSize?`, `keyword?`, `status?`, `membershipStatus?`, `segment?`, `tag?`。

**Response data**：分页 `AppUser`。

#### GET `/api/admin/users/{userId}`

用户详情。

**Response data**

```ts
interface AdminUserDetail extends AppUser {
  realNameStatus: 'verified' | 'unverified' | 'rejected';
  aiUsage: { monthlyQuota: number; usedThisMonth: number; totalUsed: number; lastUsedAt: string | null };
  propertySummary: { total: number; online: number; offline: number; pendingReview: number };
  communitySummary: { posts: number; comments: number; likesReceived: number };
  reportSummary: { reportedCount: number; pendingCount: number; confirmedCount: number; latestReportedAt: string | null };
  orderSummary: { totalOrders: number; paidOrders: number; refundedOrders: number; totalAmount: number; lastOrderAt: string | null };
  membership: { planName: string; startedAt: string | null; expiresAt: string | null; autoRenew: boolean };
  orders: Array<{ id: string; productName: string; status: string; amount: number; paidAt: string | null }>;
  properties: Array<{ id: string; title: string; city: string; status: string; updatedAt: string }>;
  reports: Array<{ id: string; scene: string; reason: string; status: string; createdAt: string }>;
}
```

#### PUT `/api/admin/users/{userId}/status`
#### PATCH `/api/admin/users/{userId}/status`

启用、禁用或标记风险用户。建议两个 Method 都支持，兼容旧页面和新页面。

```json
{
  "status": "disabled",
  "reason": "违反社区规范"
}
```

#### POST `/api/admin/users/{userId}/ban`

风控页快捷封禁。

```json
{ "reason": "异常登录风控处置" }
```

#### POST `/api/admin/users/{userId}/watchlist`

加入观察名单。

```json
{ "reason": "异常登录加入观察名单" }
```

#### GET `/api/admin/users/{userId}/tags`
#### PUT `/api/admin/users/{userId}/tags`

用户标签读取与保存。

```json
{ "tags": [{ "id": "high_value", "name": "高价值", "color": "gold" }] }
```

#### GET `/api/admin/users/{userId}/notes`
#### POST `/api/admin/users/{userId}/notes`

管理员备注。

```json
{ "content": "用户反馈过 AI 评房质量问题，后续跟进" }
```

#### GET `/api/admin/users/{userId}/membership`
#### PUT `/api/admin/users/{userId}/membership`

查看和修改用户会员。

```json
{
  "level": "pro",
  "expireAt": "2026-12-31T23:59:59.000Z",
  "reason": "客服补偿"
}
```

### 4.5 用户分群

#### GET `/api/admin/user-segments`

返回自动/人工分群列表。

```json
{
  "segments": [
    { "key": "new", "name": "新用户", "count": 120, "mode": "auto", "description": "注册 7 天内" }
  ]
}
```

#### GET `/api/admin/user-segments/{segment}/users`

**Query**：`page?`, `pageSize?`, `keyword?`。

返回某分群下用户列表。

#### POST `/api/admin/user-segments/manual`

人工打标/分群。

```json
{
  "userIds": ["1001", "1002"],
  "segment": "high_value",
  "tags": ["高价值"],
  "reason": "运营人工标记"
}
```

### 4.6 房源治理

#### GET `/api/admin/properties`

**Query**：`page?`, `pageSize?`, `keyword?`, `city?`, `district?`, `ownerId?`, `status?`, `isPublic?`。

**Response data**：分页 `AdminProperty`。

#### GET `/api/admin/properties/{id}`

房源详情，建议包含：基础字段、原始 `payload`、媒体、评分、AI 报告、成本、用户信息、审核记录。

#### GET `/api/admin/properties/{id}/reviews`

房源评论/评价列表。

#### PUT `/api/admin/properties/{id}/visibility`

```json
{ "isPublic": true }
```

#### DELETE `/api/admin/properties/{id}`

后台删除/下架房源，建议软删除并写入操作日志。

#### GET `/api/admin/properties/completeness`

房源资料完整度列表。

**Response item**

```json
{
  "propertyId": "p_001",
  "propertyName": "张江两居室",
  "score": 86,
  "level": "good",
  "missingItems": ["房源图片", "通勤地址"],
  "dimensions": [{ "name": "基础信息", "score": 90, "missing": [] }],
  "updatedAt": "2026-06-29T12:00:00.000Z"
}
```

#### GET `/api/admin/properties/{id}/completeness`

单房源完整度。

#### GET `/api/admin/properties/duplicates`

疑似重复房源列表。

#### POST `/api/admin/properties/duplicates/{id}/handle`

处理重复房源。

```json
{ "action": "merge", "targetPropertyId": "p_001", "remark": "同小区同户型重复提交" }
```

### 4.7 社区治理

#### GET `/api/admin/community/notes`

**Query**：`page?`, `pageSize?`, `keyword?`, `status?`, `city?`, `channel?`, `authorId?`。

#### GET `/api/admin/community/notes/{id}`

笔记详情。

#### PUT `/api/admin/community/notes/{id}`

编辑笔记状态或内容。

```json
{ "status": "hidden", "reason": "包含隐私信息" }
```

#### DELETE `/api/admin/community/notes/{id}`

删除/隐藏笔记。

#### GET `/api/admin/community/comments`

评论列表。

#### PUT `/api/admin/community/comments/{id}`

审核或隐藏评论。

#### DELETE `/api/admin/community/comments/{id}`

删除评论。

#### GET `/api/admin/community/reports`

社区举报列表。

**Query**：`page?`, `pageSize?`, `status?=pending`, `targetType?`, `keyword?`。

#### PUT `/api/admin/community/reports/{id}`

处理举报。

```json
{
  "status": "resolved",
  "action": "hide_note",
  "remark": "已隐藏违规内容"
}
```

### 4.8 内容审核、敏感词与风险

#### GET `/api/admin/risk/sensitive-words`
#### POST `/api/admin/risk/sensitive-words`
#### PUT `/api/admin/risk/sensitive-words/{id}`
#### DELETE `/api/admin/risk/sensitive-words/{id}`

敏感词管理。

```json
{
  "word": "敏感词",
  "category": "广告引流",
  "riskLevel": "high",
  "enabled": true
}
```

#### GET `/api/admin/risk/rules`
#### PUT `/api/admin/risk/rules/{id}`

风控规则列表与启停。

```json
{ "enabled": false }
```

#### GET `/api/admin/risk/hits`

敏感词/规则命中记录。

#### GET `/api/admin/risk/watchlist`
#### POST `/api/admin/risk/watchlist`
#### PUT `/api/admin/risk/watchlist/{id}`
#### DELETE `/api/admin/risk/watchlist/{id}`

风险观察名单。

#### GET `/api/admin/security/blacklist`
#### POST `/api/admin/security/blacklist`
#### DELETE `/api/admin/security/blacklist/{id}`

黑名单。

#### GET `/api/admin/moderation/reports`

通用审核/举报队列，兼容旧页面。

#### GET `/api/admin/content-quality`
#### PUT `/api/admin/content-quality/{id}`

内容质量巡检与处理。

### 4.9 AI 运营与 Prompt 管理

#### GET `/api/admin/ai-stats`

AI 用量统计。

```json
{ "totalCalls": 12000, "successRate": 0.98, "cost": 3688.66 }
```

#### GET `/api/admin/ai-stats/summary`

AI 摘要卡片。

```json
{ "calls": 1200, "successRate": 0.982, "cost": 388.5 }
```

#### GET `/api/admin/ai/reviews`

AI 评房记录列表。

#### GET `/api/admin/ai/reviews/{id}`

AI 评房详情，包含输入摘要、模型、输出、耗时、Token、费用、错误信息。

#### GET `/api/admin/ai/costs/overview`
#### GET `/api/admin/ai/costs/records`
#### GET `/api/admin/ai/costs/users`

AI 成本分析。

#### GET `/api/admin/ai/prompts`
#### POST `/api/admin/ai/prompts`
#### PUT `/api/admin/ai/prompts/{id}`
#### DELETE `/api/admin/ai/prompts/{id}`

Prompt 模板管理。

```json
{
  "name": "AI评房主提示词",
  "scene": "ai_review",
  "model": "gpt-4.1-mini",
  "content": "你是专业房产顾问……",
  "status": "active",
  "version": "v3"
}
```

### 4.10 会员、订单、支付与退款

#### GET `/api/admin/orders`

**Query**：`page?`, `pageSize?`, `status?`, `keyword?`, `userId?`, `startDate?`, `endDate?`。

返回订单分页。

#### GET `/api/admin/membership/plans`
#### POST `/api/admin/membership/plans`
#### PUT `/api/admin/membership/plans/{id}`
#### DELETE `/api/admin/membership/plans/{id}`

会员套餐管理。

```json
{
  "name": "专业版月卡",
  "level": "pro",
  "price": 1900,
  "durationDays": 31,
  "features": ["ai_review", "pdf_report"],
  "status": "active"
}
```

#### GET `/api/admin/payments/records`

支付流水。

#### GET `/api/admin/payments/reconciliation`
#### POST `/api/admin/payments/reconciliation/run`
#### GET `/api/admin/payments/reconciliation/{id}`

支付对账任务。

#### GET `/api/admin/refunds`
#### POST `/api/admin/refunds/{id}/approve`
#### POST `/api/admin/refunds/{id}/reject`

退款审核。

### 4.11 营销、优惠券与推送

#### GET `/api/admin/marketing/campaigns`
#### POST `/api/admin/marketing/campaigns`
#### PUT `/api/admin/marketing/campaigns/{id}`
#### DELETE `/api/admin/marketing/campaigns/{id}`

营销活动。

#### GET `/api/admin/marketing/recall-tasks`
#### POST `/api/admin/marketing/recall-tasks`
#### PUT `/api/admin/marketing/recall-tasks/{id}`
#### DELETE `/api/admin/marketing/recall-tasks/{id}`

用户召回任务。

#### GET `/api/admin/marketing/coupons`
#### POST `/api/admin/marketing/coupons`
#### PUT `/api/admin/marketing/coupons/{id}`
#### DELETE `/api/admin/marketing/coupons/{id}`

优惠券。

#### GET `/api/admin/marketing/redeem-codes`
#### POST `/api/admin/marketing/redeem-codes/batch`

兑换码列表与批量生成。

#### GET `/api/admin/push/campaigns`
#### POST `/api/admin/push/campaigns`
#### POST `/api/admin/push/campaigns/{id}/send`
#### GET `/api/admin/push/campaigns/{id}/stats`

Push 推送活动。

```json
{
  "title": "会员限时优惠",
  "content": "专业版本周 8 折",
  "linkUrl": "fxp://membership",
  "audience": { "type": "segments", "values": ["active"] },
  "scheduledAt": "2026-06-30T10:00:00.000Z"
}
```

### 4.12 推荐池、CMS 与站内消息

#### GET `/api/admin/recommendation/pools`
#### POST `/api/admin/recommendation/pools`
#### PUT `/api/admin/recommendation/pools/{id}`
#### DELETE `/api/admin/recommendation/pools/{id}`
#### POST `/api/admin/recommendation/pools/{poolId}/items`
#### DELETE `/api/admin/recommendation/pools/{poolId}/items/{itemId}`

首页/社区推荐池管理。

#### GET `/api/admin/cms/articles`
#### POST `/api/admin/cms/articles`
#### PUT `/api/admin/cms/articles/{id}`
#### DELETE `/api/admin/cms/articles/{id}`

官方文章。

#### GET `/api/admin/announcements`
#### POST `/api/admin/announcements`
#### PUT `/api/admin/announcements/{id}`
#### DELETE `/api/admin/announcements/{id}`

后台内部公告。

#### GET `/api/admin/messages`
#### POST `/api/admin/messages`
#### PUT `/api/admin/messages/{id}`
#### DELETE `/api/admin/messages/{id}`

后台站内消息管理。

#### GET `/api/app/messages`
#### POST `/api/app/messages/read`

App/用户侧消息读取与标记已读。如果该后端只做管理后台，可先提供 Mock 或转发到 App 后端。

### 4.13 配置中心与版本管理

#### GET `/api/admin/config`
#### PUT `/api/admin/config`

全局配置。

#### GET `/api/admin/config/feature-flags`
#### POST `/api/admin/config/feature-flags`
#### PUT `/api/admin/config/feature-flags/{id}`
#### DELETE `/api/admin/config/feature-flags/{id}`

功能开关。

```json
{
  "key": "ai_compare_v2",
  "name": "AI 对比 V2",
  "enabled": true,
  "description": "控制新版 AI 对比入口",
  "rolloutPercentage": 50
}
```

#### GET `/api/admin/config/app-versions`
#### POST `/api/admin/config/app-versions`
#### PUT `/api/admin/config/app-versions/{id}`

App 版本配置。

```json
{
  "platform": "iOS",
  "latestVersion": "1.4.0",
  "minSupportedVersion": "1.2.0",
  "forceUpdate": false,
  "releaseNotes": "优化 AI 评房体验",
  "downloadUrl": "https://apps.apple.com/app/xxx",
  "rolloutPercentage": 100
}
```

#### GET `/api/app/config`

App 公共配置读取，可不需要管理员 Token。

#### GET `/api/app/version-check`

**Query**：`platform=iOS|Android`, `version`, `deviceId?`。

**Response data**

```json
{
  "platform": "iOS",
  "latestVersion": "1.4.0",
  "minSupportedVersion": "1.2.0",
  "updateAvailable": true,
  "forceUpdate": false,
  "releaseNotes": "优化 AI 评房体验",
  "downloadUrl": "https://apps.apple.com/app/xxx",
  "rolloutPercentage": 100
}
```

### 4.14 地理数据

#### GET `/api/admin/geo/cities`
#### POST `/api/admin/geo/cities`
#### PUT `/api/admin/geo/cities/{id}`
#### DELETE `/api/admin/geo/cities/{id}`

城市、行政区、热门城市管理。

### 4.15 导入导出任务

#### GET `/api/admin/import/tasks`
#### POST `/api/admin/import/tasks`
#### GET `/api/admin/import/tasks/{id}`

导入任务，适用于用户、房源、社区内容、敏感词批量导入。

#### GET `/api/admin/export/tasks`
#### POST `/api/admin/export/tasks`
#### GET `/api/admin/export/tasks/{id}`

导出任务，返回任务状态和下载地址。

```json
{
  "type": "users",
  "filters": { "membershipStatus": "active" },
  "fields": ["id", "phone", "registeredAt"]
}
```

### 4.16 系统健康、安全与日志

#### GET `/api/admin/system/health`

系统健康检查。

```json
{
  "status": "healthy",
  "checkedAt": "2026-06-29T12:00:00.000Z",
  "checks": [
    { "key": "database", "name": "数据库连接", "status": "healthy", "durationMs": 12, "error": null },
    { "key": "redis", "name": "Redis 连接", "status": "warning", "durationMs": 80, "error": "连接较慢" }
  ]
}
```

#### GET `/api/admin/security/login-logs`

登录日志。

#### GET `/api/admin/security/risky-logins`

异常登录列表。

#### GET `/api/admin/operation-logs`

管理员操作日志。

**Query**：`page?`, `pageSize?`, `adminId?`, `module?`, `action?`, `keyword?`, `startDate?`, `endDate?`。

### 4.17 全局搜索、报表与客服

#### GET `/api/admin/search`

**Query**：`q`。

**Response data**

```json
{
  "items": [
    { "type": "user", "title": "张三", "summary": "手机号 138****0000", "url": "/users/1001" }
  ]
}
```

#### GET `/api/admin/reports`

报表列表。

#### GET `/api/admin/feedback`
#### PUT `/api/admin/feedback/{id}`

用户反馈。

#### GET `/api/admin/support/tickets`
#### PUT `/api/admin/support/tickets/{id}`

客服工单。

## 5. 权限点建议

| 权限点 | 说明 |
| --- | --- |
| `*` | 超级管理员所有权限 |
| `dashboard:read` | 查看首页大盘 |
| `users:read` / `users:write` | 用户查看/处置 |
| `properties:read` / `properties:write` | 房源查看/治理 |
| `community:read` / `community:write` | 社区治理 |
| `risk:read` / `risk:write` | 风控配置 |
| `ai:read` / `ai:write` | AI 运营和 Prompt |
| `orders:read` / `orders:write` | 订单和退款 |
| `marketing:read` / `marketing:write` | 营销活动 |
| `config:read` / `config:write` | 配置中心 |
| `admin:read` / `admin:write` | 管理员账号 |
| `logs:read` | 操作日志 |

## 6. 实现优先级

### P0：后台能登录、核心数据能看

1. `POST /api/admin/auth/login`
2. `GET /api/admin/auth/me`
3. `GET /api/admin/dashboard`
4. `GET /api/admin/users`
5. `GET /api/admin/users/{id}`
6. `GET /api/admin/properties`
7. `GET /api/admin/properties/{id}`
8. `GET /api/admin/community/reports`
9. `PUT /api/admin/community/reports/{id}`
10. `GET /api/admin/system/health`

### P1：运营治理闭环

1. 用户状态、标签、备注、会员调整。
2. 房源可见性、删除、完整度、重复房源处理。
3. 社区笔记/评论审核。
4. 敏感词、风险规则、命中记录。
5. 订单列表、会员套餐、AI 统计。

### P2：增长、配置与自动化

1. 营销活动、优惠券、兑换码、Push。
2. 推荐池、CMS、内部公告。
3. App 配置、功能开关、版本检查。
4. 导入导出任务、对账、退款、客服工单。
5. 操作日志、全局搜索、数据分析增强。

## 7. 与移动端 App 后端的边界

如果另一个工程已经服务房小评 App，建议这样拆分：

- App 业务接口继续保留：用户登录、房源创建、AI 评房、家庭协作、社区浏览、会员支付等。
- 管理后台新增 `/api/admin/*`：只做运营、审核、配置、统计、管理动作。
- 管理后台需要读取 App 业务数据表，但写操作必须走明确的管理动作并记录审计日志。
- 支付回调、AI 调用、地图调用等仍由 App 后端业务服务处理；后台只读取统计和发起配置变更。

## 8. 前端兼容注意事项

- 登录接口必须返回 `token`。
- 列表字段建议用 `items`，同时返回 `total/page/pageSize`。
- 很多前端适配器兼容 `data` 包装和不包装，但新接口建议统一包装。
- 删除接口返回 `{ success: true }` 或空响应均可。
- 状态值尽量使用英文枚举，前端负责中文展示。
- 金额如果返回元，字段用 `amount` / `price`；如果返回分，字段用 `amountCents` / `priceCents`，避免混淆。
