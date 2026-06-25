# 统一导出任务中心后端接口建议

## ExportTask 模型

建议新增 `ExportTask` 持久化模型，用于统一管理后台导出任务：

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `id` | string | 导出任务 ID |
| `type` | enum | `users`、`orders`、`reports`、`ai_usage`、`payment_transactions` |
| `status` | enum | `pending`、`running`、`success`、`failed`、`expired` |
| `filters` | json | 创建任务时提交的筛选条件快照 |
| `fileName` | string | 导出文件名 |
| `filePath` / `objectKey` | string | 文件在本地或对象存储中的位置 |
| `totalRows` | number | 预计导出总行数 |
| `exportedRows` | number | 已导出行数，用于计算进度 |
| `errorMessage` | string | 失败原因 |
| `expiresAt` | datetime | 文件过期时间，到期后禁止下载并清理文件 |
| `createdBy` | string | 创建任务的管理员 ID |
| `createdAt` / `updatedAt` / `completedAt` | datetime | 生命周期时间戳 |

## `GET /admin/export/tasks`

获取导出任务列表。支持按 `type`、`status`、`page`、`pageSize` 过滤。

响应建议：

```json
{
  "data": {
    "items": [],
    "total": 0,
    "page": 1,
    "pageSize": 20
  }
}
```

## `POST /admin/export/tasks`

创建导出任务。大数据量必须进入异步队列，避免请求超时。

请求体：

```json
{
  "type": "users",
  "filters": {
    "startDate": "2026-06-01",
    "endDate": "2026-06-25"
  }
}
```

后端根据 `type` 分发到对应导出处理器：用户列表、订单列表、举报列表、AI 用量、支付流水。任务创建后返回 `pending` 或 `running` 状态。

## `GET /admin/export/tasks/:id/download`

下载成功且未过期的导出文件。

建议规则：

1. 仅 `success` 状态允许下载。
2. 当前时间超过 `expiresAt` 时返回 410，并将任务标记为 `expired`。
3. 使用对象存储时可返回短时效签名 URL 或直接流式转发文件。
4. 所有下载操作写入后台操作日志。
