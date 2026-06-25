import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { adminUserProfileMockPlugin } from './src/mocks/adminUserProfilePlugin';

const moderationStatuses = ['published', 'hidden_by_admin', 'rejected'] as const;
type ModerationStatus = typeof moderationStatuses[number];

type CommunityContent = {
  id: string;
  title?: string;
  noteId?: string;
  content: string;
  author: string;
  reportCount: number;
  latestReportReason?: string;
  publishedAt: string;
  status: ModerationStatus;
};

const notes: CommunityContent[] = [
  {
    id: 'note-1001',
    title: '小区夜间噪音真实体验',
    content: '连续三晚楼下商铺施工到凌晨，疑似包含夸大描述，需要人工复核。',
    author: '住户A',
    reportCount: 8,
    latestReportReason: '涉嫌不实信息',
    publishedAt: '2026-06-18T13:20:00.000Z',
    status: 'published',
  },
  {
    id: 'note-1002',
    title: '中介服务踩坑记录',
    content: '内容中出现个人手机号和攻击性表达，已被多名用户举报。',
    author: '看房达人',
    reportCount: 14,
    latestReportReason: '泄露隐私',
    publishedAt: '2026-06-20T08:10:00.000Z',
    status: 'hidden_by_admin',
  },
  {
    id: 'note-1003',
    title: '地铁口公寓评价',
    content: '包含疑似广告导流话术，等待运营确认是否驳回。',
    author: '租客小林',
    reportCount: 4,
    latestReportReason: '营销广告',
    publishedAt: '2026-06-21T16:45:00.000Z',
    status: 'rejected',
  },
];

const comments: CommunityContent[] = [
  {
    id: 'comment-2001',
    noteId: 'note-1001',
    content: '你这是恶意抹黑吧，根本没有这种情况。',
    author: '用户7788',
    reportCount: 5,
    latestReportReason: '人身攻击',
    publishedAt: '2026-06-19T02:12:00.000Z',
    status: 'published',
  },
  {
    id: 'comment-2002',
    noteId: 'note-1002',
    content: '私信我，有内部房源和返佣渠道。',
    author: '经纪人Leo',
    reportCount: 11,
    latestReportReason: '广告引流',
    publishedAt: '2026-06-20T11:30:00.000Z',
    status: 'hidden_by_admin',
  },
  {
    id: 'comment-2003',
    noteId: 'note-1003',
    content: '这条评论包含重复刷屏内容。',
    author: '匿名用户',
    reportCount: 2,
    latestReportReason: '垃圾内容',
    publishedAt: '2026-06-21T09:05:00.000Z',
    status: 'rejected',
  },
];

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.statusCode = statusCode;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.end(JSON.stringify(payload));
}

function readBody(request: IncomingMessage) {
  return new Promise<Record<string, unknown>>((resolve) => {
    let body = '';

    request.on('data', (chunk: Buffer) => {
      body += chunk.toString();
    });

    request.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) as Record<string, unknown> : {});
      } catch {
        resolve({});
      }
    });
  });
}

function filteredItems(items: CommunityContent[], searchParams: URLSearchParams) {
  const keyword = searchParams.get('keyword')?.trim().toLowerCase();
  const author = searchParams.get('author')?.trim().toLowerCase();
  const status = searchParams.get('status');
  const minReportCountValue = searchParams.get('minReportCount') ?? searchParams.get('min_report_count');
  const maxReportCountValue = searchParams.get('maxReportCount') ?? searchParams.get('max_report_count');
  const minReportCount = minReportCountValue === null ? Number.NaN : Number(minReportCountValue);
  const maxReportCount = maxReportCountValue === null ? Number.NaN : Number(maxReportCountValue);
  const publishedFrom = searchParams.get('publishedFrom') ?? searchParams.get('published_from');
  const publishedTo = searchParams.get('publishedTo') ?? searchParams.get('published_to');

  return items.filter((item) => {
    const text = `${item.title ?? ''} ${item.content}`.toLowerCase();
    const publishedTime = new Date(item.publishedAt).getTime();

    return (!keyword || text.includes(keyword))
      && (!author || item.author.toLowerCase().includes(author))
      && (!status || moderationStatuses.includes(status as ModerationStatus) && item.status === status)
      && (Number.isNaN(minReportCount) || item.reportCount >= minReportCount)
      && (Number.isNaN(maxReportCount) || item.reportCount <= maxReportCount)
      && (!publishedFrom || publishedTime >= new Date(`${publishedFrom}T00:00:00.000Z`).getTime())
      && (!publishedTo || publishedTime <= new Date(`${publishedTo}T23:59:59.999Z`).getTime());
  });
}


type AdminSearchResult = {
  type: 'user' | 'order' | 'property' | 'community' | 'report' | 'feedback';
  title: string;
  summary: string;
  url: string;
  keywords: string;
};

const globalSearchSeed: AdminSearchResult[] = [
  { type: 'user', title: '用户 张小满 · U10086', summary: '手机号 138****0086，上海，会员用户', url: '/users/U10086', keywords: '用户 张小满 U10086 138 上海 会员' },
  { type: 'order', title: '订单 ORD-20260618-0007', summary: 'AI 评房套餐 · 已支付 · ¥29.90', url: '/orders?orderNo=ORD-20260618-0007', keywords: '订单 ORD-20260618-0007 AI 评房 套餐 已支付' },
  { type: 'property', title: '滨江壹号 2 室 1 厅', summary: '上海 / 浦东新区 · 近地铁，待完善学区信息', url: '/properties?keyword=滨江壹号', keywords: '房源 滨江壹号 上海 浦东新区 地铁 学区' },
  { type: 'community', title: '滨江壹号小区', summary: '上海浦东新区 · 126 套房源 · 48 条评价', url: '/communities?keyword=滨江壹号', keywords: '小区 滨江壹号 上海 浦东新区 评价 房源' },
  { type: 'report', title: '举报 RPT-9001 · 广告引流', summary: '举报对象：评论 comment-2002，状态：待处理', url: '/reports?reportId=RPT-9001', keywords: '举报 RPT-9001 广告 引流 comment-2002 待处理' },
  { type: 'feedback', title: '反馈 FB-3102 · 房源信息错误', summary: '用户反馈户型与图片不一致，等待客服回复', url: '/feedback?feedbackId=FB-3102', keywords: '反馈 FB-3102 房源 信息 错误 户型 图片 客服' },
];

function globalSearchMockApi(): Plugin {
  return {
    name: 'global-search-mock-api',
    configureServer(server) {
      server.middlewares.use('/api/admin/search', (request, response, next) => {
        if (!request.url || request.method !== 'GET') {
          next();
          return;
        }

        const url = new URL(request.url, 'http://localhost');
        const keyword = url.searchParams.get('q')?.trim().toLowerCase() ?? '';
        const items = keyword
          ? globalSearchSeed.filter((item) => `${item.title} ${item.summary} ${item.keywords}`.toLowerCase().includes(keyword))
              .map((item) => ({ type: item.type, title: item.title, summary: item.summary, url: item.url }))
          : [];

        sendJson(response, 200, { items, total: items.length });
      });
    },
  };
}

function communityModerationMockApi(): Plugin {
  return {
    name: 'community-moderation-mock-api',
    configureServer(server) {
      server.middlewares.use('/api/admin/community', async (request, response, next) => {
        if (!request.url) {
          next();
          return;
        }

        const url = new URL(request.url, 'http://localhost');
        const path = url.pathname;

        if (request.method === 'GET' && path === '/notes') {
          const items = filteredItems(notes, url.searchParams);
          sendJson(response, 200, { items, total: items.length });
          return;
        }

        if (request.method === 'GET' && path.startsWith('/notes/')) {
          const id = path.split('/')[2];
          const note = notes.find((item) => item.id === id);
          sendJson(response, note ? 200 : 404, note ?? { message: '笔记不存在' });
          return;
        }

        if (request.method === 'PUT' && path.startsWith('/notes/') && path.endsWith('/status')) {
          const id = path.split('/')[2];
          const body = await readBody(request);
          const status = body.status;
          const note = notes.find((item) => item.id === id);

          if (!note) {
            sendJson(response, 404, { message: '笔记不存在' });
            return;
          }

          if (!moderationStatuses.includes(status as ModerationStatus)) {
            sendJson(response, 400, { message: '状态不支持' });
            return;
          }

          note.status = status as ModerationStatus;
          sendJson(response, 200, note);
          return;
        }

        if (request.method === 'GET' && path === '/comments') {
          const items = filteredItems(comments, url.searchParams);
          sendJson(response, 200, { items, total: items.length });
          return;
        }

        if (request.method === 'PUT' && path.startsWith('/comments/') && path.endsWith('/status')) {
          const id = path.split('/')[2];
          const body = await readBody(request);
          const status = body.status;
          const comment = comments.find((item) => item.id === id);

          if (!comment) {
            sendJson(response, 404, { message: '评论不存在' });
            return;
          }

          if (!moderationStatuses.includes(status as ModerationStatus)) {
            sendJson(response, 400, { message: '状态不支持' });
            return;
          }

          comment.status = status as ModerationStatus;
          sendJson(response, 200, comment);
          return;
        }

        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), globalSearchMockApi(), communityModerationMockApi(), adminUserProfileMockPlugin()],
  server: {
    port: 5173,
  },
});
