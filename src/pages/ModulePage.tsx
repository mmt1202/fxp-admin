import type { AdminEndpoint } from '../routes/modules';

type ModulePageProps = {
  title: string;
  description: string;
  endpoints: AdminEndpoint[];
};

export function ModulePage({ title, description, endpoints }: ModulePageProps) {
  return (
    <div className="module-page">
      <p className="eyebrow">业务模块</p>
      <h1>{title}</h1>
      <p>{description}</p>
      {endpoints.length > 0 ? (
        <div className="endpoint-list" aria-label={`${title}接口列表`}>
          {endpoints.map((endpoint) => (
            <div className="endpoint-card" key={`${endpoint.method}-${endpoint.path}`}>
              <span className={`method-badge method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
              <code>{endpoint.path}</code>
              <p>{endpoint.description}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">当前模块暂无已确认后台接口。</div>
      )}
    </div>
  );
}
