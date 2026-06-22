type ModulePageProps = {
  title: string;
  description: string;
};

export function ModulePage({ title, description }: ModulePageProps) {
  return (
    <div className="module-page">
      <p className="eyebrow">业务模块预留</p>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="placeholder-grid">
        <div>列表检索</div>
        <div>详情编辑</div>
        <div>批量操作</div>
        <div>数据导出</div>
      </div>
    </div>
  );
}
