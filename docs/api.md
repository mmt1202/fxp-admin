# 房小评 App 管理后台接口说明

## 通用约定

- Base URL: `${VITE_API_BASE_URL}`，例如 `https://api.example.com/admin`。
- Content-Type: `application/json`。
- 认证方式: 登录成功后返回 `accessToken`，前端后续请求通过 `Authorization: Bearer <accessToken>` 传递。
- 分页参数: `page` 从 1 开始，`pageSize` 默认 20。
- 通用响应结构:

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

- 通用分页响应结构:

```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [],
    "total": 0,
    "page": 1,
    "pageSize": 20
  }
}
```

## 管理员认证

### 管理员登录

- Method: `POST`
- Path: `/auth/login`
- Body:

```json
{
  "username": "admin",
  "password": "password"
}
```

- Response `data`:

```json
{
  "accessToken": "jwt-token",
  "expiresIn": 7200,
  "admin": {
    "id": "adm_001",
    "username": "admin",
    "displayName": "超级管理员",
    "roles": ["super_admin"],
    "permissions": ["users:read", "houses:write"]
  }
}
```

### 当前管理员信息

- Method: `GET`
- Path: `/auth/me`
- Response `data`: 同登录接口中的 `admin` 字段。

## 用户管理

### 用户列表

- Method: `GET`
- Path: `/users`
- Query: `page`, `pageSize`, `keyword`, `status`。
- Response `data.list[]`: 用户摘要。

### 用户详情

- Method: `GET`
- Path: `/users/{userId}`
- Response `data`: 用户详情。

### 禁用/启用用户

- Method: `PATCH`
- Path: `/users/{userId}/status`
- Body:

```json
{
  "status": "disabled",
  "reason": "违反社区规范"
}
```

- `status`: `enabled` 或 `disabled`。

## 房源管理

### 房源列表

- Method: `GET`
- Path: `/houses`
- Query: `page`, `pageSize`, `keyword`, `status`, `city`, `ownerId`。
- Response `data.list[]`: 房源摘要。

### 房源详情

- Method: `GET`
- Path: `/houses/{houseId}`
- Response `data`: 房源详情。

### 房源上下架

- Method: `PATCH`
- Path: `/houses/{houseId}/status`
- Body:

```json
{
  "status": "offline",
  "reason": "资料不完整"
}
```

- `status`: `online` 或 `offline`。

## 房源评价管理

### 房源评价列表

- Method: `GET`
- Path: `/reviews`
- Query: `page`, `pageSize`, `houseId`, `userId`, `status`, `keyword`。
- Response `data.list[]`: 评价摘要。

### 房源评价详情

- Method: `GET`
- Path: `/reviews/{reviewId}`
- Response `data`: 评价详情。

### 删除/隐藏评价

- Method: `PATCH`
- Path: `/reviews/{reviewId}/status`
- Body:

```json
{
  "status": "hidden",
  "reason": "包含敏感信息"
}
```

- `status`: `visible`, `hidden` 或 `deleted`。

## 举报管理

### 举报列表

- Method: `GET`
- Path: `/reports`
- Query: `page`, `pageSize`, `targetType`, `status`, `keyword`。
- Response `data.list[]`: 举报摘要。

### 处理举报

- Method: `PATCH`
- Path: `/reports/{reportId}/handle`
- Body:

```json
{
  "status": "resolved",
  "action": "hide_review",
  "remark": "已隐藏违规评价"
}
```

- `status`: `pending`, `processing`, `resolved` 或 `rejected`。

## 数据统计

### 管理台统计概览

- Method: `GET`
- Path: `/dashboard/stats`
- Query: `startDate`, `endDate`，日期格式为 `YYYY-MM-DD`。
- Response `data`:

```json
{
  "userCount": 1200,
  "houseCount": 320,
  "reviewCount": 890,
  "pendingReportCount": 8,
  "activeUserCount": 240,
  "newUserCount": 32,
  "newHouseCount": 12,
  "newReviewCount": 45
}
```

## 功能开关配置中心

### FeatureFlag 模型

字段：

- `id`: 功能开关 ID。
- `key`: 功能开关唯一键，例如 `ai.review.v2`。
- `name`: 后台展示名称。
- `enabled`: 是否启用。
- `rolloutPercent`: 灰度比例，范围 0-100。
- `targetUsers`: 指定开放用户 ID 列表；为空表示不按用户限制。
- `targetCities`: 指定开放城市编码或名称列表；为空表示不按城市限制。

### 获取功能开关列表

- Method: `GET`
- Path: `/admin/config/feature-flags`
- Response `data.items[]`: `FeatureFlag` 列表。

### 新增功能开关

- Method: `POST`
- Path: `/admin/config/feature-flags`
- Body:

```json
{
  "key": "ai.review.v2",
  "name": "AI 评房 V2",
  "enabled": true,
  "rolloutPercent": 30,
  "targetUsers": ["10001", "10002"],
  "targetCities": ["SH", "HZ"]
}
```

### 更新功能开关

- Method: `PUT`
- Path: `/admin/config/feature-flags/{id}`
- Body: 同新增功能开关。

### App 启动配置

- Method: `GET`
- Path: `/app/config`
- 说明: App 启动时拉取启动配置，响应中的 `featureFlags` 字段携带功能开关列表；App 端可结合 `enabled`、`rolloutPercent`、`targetUsers`、`targetCities` 判断当前用户与城市是否命中。
