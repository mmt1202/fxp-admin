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
