import { useAuthStore } from '../store/auth';
import type { AdminPermission } from '../types/admin';

type ModulePageProps = {
  title: string;
  description: string;
  permission: AdminPermission;
};

export function ModulePage({ title, description, permission }: ModulePageProps) {
  const hasPermission = useAuthStore((state) => state.hasPermission);

  return (
    <div className="module-page">
      <p className="eyebrow">业务模块</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="placeholder-grid">
        <div>列表检索</div>
        <div>详情编辑</div>
        <div>批量操作</div>
        <div>数据导出</div>
      </div>
      <div className="permission-actions">
        <button type="button" disabled={!hasPermission(permission)}>查看数据</button>
        <button type="button" disabled={!hasPermission('users:update')}>更新用户</button>
        <button type="button" disabled={!hasPermission('reports:handle')}>处理举报</button>
        <button type="button" disabled={!hasPermission('membership:update')}>调整会员</button>
      </div>
    </div>
  );
}
