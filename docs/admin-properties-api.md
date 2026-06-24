# 管理员房源接口约定

当前仓库是 `fxp-admin` 管理后台前端。后端服务不在本仓库中；前端已按以下接口发起请求，后端实现时需确保所有管理员写操作记录后台操作日志。

## `GET /admin/properties`

支持分页与筛选查询。

### Query 参数

| 参数 | 类型 | 说明 |
| --- | --- | --- |
| `page` | number | 页码，从 1 开始。 |
| `pageSize` | number | 每页条数。 |
| `keyword` | string | 关键词，建议匹配标题、地址。 |
| `city` | string | 城市筛选。 |
| `district` | string | 区域筛选。 |
| `userId` | string | 所属用户 ID 筛选。 |
| `visibility` | string | 公开状态，建议支持 `public` / `hidden`。 |

### Response 示例

```json
{
  "items": [],
  "total": 0,
  "page": 1,
  "pageSize": 10
}
```

## `GET /admin/properties/:id`

返回单个房源详情。

## `PUT /admin/properties/:id/visibility`

更新房源公开状态。后端应写入后台操作日志。

### Request 示例

```json
{
  "isPublic": false,
  "visibility": "hidden"
}
```

## `DELETE /admin/properties/:id`

删除房源。后端应写入后台操作日志。

## `GET /admin/properties/:id/reviews`

返回房源评价列表。建议直接返回数组；若返回 `{ "data": [] }`，前端也可兼容。
