import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage, ServerResponse } from 'node:http';

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
  plugins: [react(), communityModerationMockApi()],
  server: {
    port: 5173,
  },
});
