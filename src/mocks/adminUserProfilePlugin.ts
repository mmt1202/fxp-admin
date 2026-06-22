import type { IncomingMessage, ServerResponse } from 'node:http';
import type { Plugin } from 'vite';

type UserTag = {
  id: string;
  name: string;
  color?: string;
};

type UserAdminNote = {
  id: string;
  userId: string;
  adminId: string;
  content: string;
  createdAt: string;
};

type MockUserProfile = {
  tags: UserTag[];
  notes: UserAdminNote[];
};

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store',
};

const profileStore = new Map<string, MockUserProfile>([
  [
    'demo-user-001',
    {
      tags: [
        { id: 'verified-landlord', name: '已实名房东', color: '#2563eb' },
        { id: 'high-value', name: '高价值用户', color: '#059669' },
      ],
      notes: [
        {
          id: 'note-demo-1',
          userId: 'demo-user-001',
          adminId: 'admin-demo',
          content: '仅后台可见：用户反馈希望优先推荐近地铁、可养宠房源。',
          createdAt: '2026-06-18T09:24:00.000Z',
        },
      ],
    },
  ],
]);

function sendJson(response: ServerResponse, statusCode: number, payload: unknown) {
  response.writeHead(statusCode, jsonHeaders);
  response.end(JSON.stringify(payload));
}

function readJsonBody<T>(request: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let rawBody = '';

    request.on('data', (chunk: Buffer) => {
      rawBody += chunk.toString('utf8');
    });

    request.on('end', () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) as T : {} as T);
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Invalid JSON payload'));
      }
    });

    request.on('error', reject);
  });
}

function getProfile(userId: string) {
  const existingProfile = profileStore.get(userId);

  if (existingProfile) {
    return existingProfile;
  }

  const profile: MockUserProfile = {
    tags: [],
    notes: [],
  };

  profileStore.set(userId, profile);
  return profile;
}

function normaliseTags(value: unknown): UserTag[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value
    .map((tag, index): UserTag | null => {
      if (!tag || typeof tag !== 'object' || !('name' in tag) || typeof tag.name !== 'string') {
        return null;
      }

      const name = tag.name.trim();

      if (!name) {
        return null;
      }

      return {
        id: 'id' in tag && typeof tag.id === 'string' && tag.id ? tag.id : `tag-${index}-${Date.now()}`,
        name,
        color: 'color' in tag && typeof tag.color === 'string' ? tag.color : undefined,
      } satisfies UserTag;
    })
    .filter((tag): tag is UserTag => Boolean(tag));
}

function getAdminId(request: IncomingMessage) {
  const explicitAdminId = request.headers['x-admin-id'];

  if (typeof explicitAdminId === 'string' && explicitAdminId.trim()) {
    return explicitAdminId.trim();
  }

  return 'admin-dev';
}

export function adminUserProfileMockPlugin(): Plugin {
  return {
    name: 'fxp-admin-user-profile-mock',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (!request.url) {
          next();
          return;
        }

        const url = new URL(request.url, 'http://localhost');
        const match = url.pathname.match(/^\/api\/admin\/users\/([^/]+)\/(tags|notes)$/);

        if (!match) {
          next();
          return;
        }

        const [, encodedUserId, resource] = match;
        const userId = decodeURIComponent(encodedUserId);
        const profile = getProfile(userId);

        try {
          if (resource === 'tags' && request.method === 'GET') {
            sendJson(response, 200, { tags: profile.tags });
            return;
          }

          if (resource === 'tags' && request.method === 'PUT') {
            const payload = await readJsonBody<{ tags?: unknown }>(request);
            const tags = normaliseTags(payload.tags);

            if (!tags) {
              sendJson(response, 400, { message: 'tags must be an array of tag objects with a non-empty name' });
              return;
            }

            profile.tags = tags;
            sendJson(response, 200, { tags: profile.tags });
            return;
          }

          if (resource === 'notes' && request.method === 'GET') {
            sendJson(response, 200, { notes: profile.notes });
            return;
          }

          if (resource === 'notes' && request.method === 'POST') {
            const payload = await readJsonBody<{ content?: unknown }>(request);
            const content = typeof payload.content === 'string' ? payload.content.trim() : '';

            if (!content) {
              sendJson(response, 400, { message: 'content is required' });
              return;
            }

            const note: UserAdminNote = {
              id: `note-${Date.now()}`,
              userId,
              adminId: getAdminId(request),
              content,
              createdAt: new Date().toISOString(),
            };

            profile.notes = [note, ...profile.notes];
            sendJson(response, 201, note);
            return;
          }

          response.setHeader('Allow', resource === 'tags' ? 'GET, PUT' : 'GET, POST');
          sendJson(response, 405, { message: 'Method not allowed' });
        } catch (error) {
          sendJson(response, 400, { message: error instanceof Error ? error.message : 'Invalid request' });
        }
      });
    },
  };
}
