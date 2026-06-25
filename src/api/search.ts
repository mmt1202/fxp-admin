import { adaptList, apiClient, unwrapData, type ApiEnvelope } from './client';

export type GlobalSearchType = 'user' | 'order' | 'property' | 'community' | 'report' | 'feedback' | string;

export type GlobalSearchResult = {
  type: GlobalSearchType;
  title: string;
  summary: string;
  url: string;
};

function normalizeResult(item: unknown): GlobalSearchResult | null {
  if (!item || typeof item !== 'object' || Array.isArray(item)) return null;

  const record = item as Record<string, unknown>;
  const type = String(record.type ?? record.category ?? 'unknown');
  const title = String(record.title ?? record.name ?? record.label ?? '未命名结果');
  const summary = String(record.summary ?? record.description ?? record.subtitle ?? '');
  const url = String(record.url ?? record.href ?? record.path ?? '');

  if (!url) return null;

  return { type, title, summary, url };
}

export async function searchAdmin(keyword: string) {
  const q = keyword.trim();
  if (!q) return [];

  const payload = await apiClient.get<ApiEnvelope<unknown>>('/admin/search', { query: { q } });
  const body = unwrapData(payload);
  const candidates = Array.isArray(body)
    ? body
    : adaptList<unknown>(payload, ['items', 'results', 'records']).items;

  return candidates.map(normalizeResult).filter((item): item is GlobalSearchResult => Boolean(item));
}
