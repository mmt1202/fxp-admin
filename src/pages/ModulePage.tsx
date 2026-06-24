import { useEffect, useState } from 'react';
import { apiClient } from '../api/client';
import type { AdminEndpoint } from '../routes/modules';

type ModulePageProps = {
  title: string;
  description: string;
  endpoints: AdminEndpoint[];
};

type EndpointResult = {
  loading: boolean;
  error?: string;
  data?: unknown;
};

const hasPathParams = (path: string) => path.includes(':');

export function ModulePage({ title, description, endpoints }: ModulePageProps) {
  const [results, setResults] = useState<Record<string, EndpointResult>>({});

  useEffect(() => {
    const callableEndpoints = endpoints.filter(
      (endpoint) => endpoint.method === 'GET' && !hasPathParams(endpoint.path),
    );

    setResults(Object.fromEntries(callableEndpoints.map((endpoint) => [endpoint.path, { loading: true }])));

    callableEndpoints.forEach((endpoint) => {
      apiClient.get<unknown>(endpoint.path)
        .then((data) => {
          setResults((current) => ({ ...current, [endpoint.path]: { loading: false, data } }));
        })
        .catch((error: unknown) => {
          setResults((current) => ({
            ...current,
            [endpoint.path]: {
              loading: false,
              error: error instanceof Error ? error.message : '接口调用失败',
            },
          }));
        });
    });
  }, [endpoints]);

  return (
    <div className="module-page">
      <p className="eyebrow">后台模块</p>
      <h1>{title}</h1>
      <p>{description}</p>
      {endpoints.length > 0 ? (
        <div className="endpoint-grid">
          {endpoints.map((endpoint) => {
            const result = results[endpoint.path];
            const requiresParams = hasPathParams(endpoint.path);
            return (
              <section className="endpoint-card" key={`${endpoint.method}-${endpoint.path}`}>
                <div className="endpoint-card-header">
                  <span className={`method-badge method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
                  <strong>{endpoint.label}</strong>
                </div>
                <code>{endpoint.path}</code>
                {endpoint.method === 'GET' && !requiresParams && (
                  <pre>
                    {result?.loading ? '加载中...' : JSON.stringify(result?.data ?? result?.error ?? null, null, 2)}
                  </pre>
                )}
                {requiresParams && <p className="endpoint-note">需要先选择记录后替换路径参数再调用。</p>}
                {endpoint.method !== 'GET' && <p className="endpoint-note">写操作入口将在对应详情/审核操作中触发。</p>}
              </section>
            );
          })}
        </div>
      ) : (
        <div className="placeholder-grid">
          <div>权限配置</div>
          <div>业务字典</div>
          <div>审核策略</div>
          <div>接口参数</div>
        </div>
      )}
    </div>
  );
}
