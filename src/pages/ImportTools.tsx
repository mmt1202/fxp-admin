import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import { type ImportTask, type ImportTaskError, type ImportType, importTaskApi, importTypeText } from '../api/importTasks';

const requiredFields: Record<ImportType, string[]> = {
  community_library: ['city', 'name', 'district', 'address'],
  sensitive_words: ['word', 'category', 'riskLevel'],
  blacklist: ['targetType', 'targetValue', 'reason'],
  whitelist: ['targetType', 'targetValue', 'reason'],
  city_config: ['cityCode', 'cityName', 'enabled'],
};

const sampleTasks: ImportTask[] = [
  { id: 'sample-20260625-01', type: 'community_library', fileName: 'shanghai-communities.csv', status: 'partially_failed', totalRows: 1280, successRows: 1264, failedRows: 16, createdAt: '2026-06-25 09:30', createdBy: '运营管理员', errorFileUrl: '#' },
  { id: 'sample-20260624-02', type: 'sensitive_words', fileName: 'risk-keywords.xlsx', status: 'completed', totalRows: 86, successRows: 86, failedRows: 0, createdAt: '2026-06-24 16:12', createdBy: '风控管理员' },
];

const sampleErrors: ImportTaskError[] = [
  { rowNumber: 18, field: 'name', message: '小区名称不能为空' },
  { rowNumber: 42, field: 'city', message: '城市未开通或城市编码不存在' },
  { rowNumber: 77, field: 'address', message: '地址字段超过 120 个字符' },
];

function parseCsv(text: string) {
  const rows: string[][] = [];
  let cell = '';
  let row: string[] = [];
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(cell.trim());
      cell = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && next === '\n') i += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

export function ImportTools() {
  const [type, setType] = useState<ImportType>('community_library');
  const [file, setFile] = useState<File | null>(null);
  const [previewRows, setPreviewRows] = useState<ImportTask['previewRows']>([]);
  const [tasks, setTasks] = useState<ImportTask[]>([]);
  const [errors, setErrors] = useState<ImportTaskError[]>([]);
  const [selectedTask, setSelectedTask] = useState<ImportTask | null>(null);
  const [notice, setNotice] = useState('');
  const [usingFallback, setUsingFallback] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    importTaskApi.listTasks().then((data) => {
      setTasks(data.items);
      setUsingFallback(false);
    }).catch(() => {
      setTasks(sampleTasks);
      setUsingFallback(true);
      setNotice('后端导入接口暂不可用，当前展示演示任务；接口联通后将自动使用真实数据。');
    });
  }, []);

  const expectedFields = requiredFields[type];
  const invalidPreviewCount = useMemo(() => previewRows?.filter((row) => !row.valid).length ?? 0, [previewRows]);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;
    setFile(nextFile);
    setPreviewRows([]);
    if (!nextFile) return;

    const lowerName = nextFile.name.toLowerCase();
    if (!lowerName.endsWith('.csv') && !lowerName.endsWith('.xlsx')) {
      setNotice('仅支持 CSV / XLSX 文件。');
      return;
    }
    if (lowerName.endsWith('.xlsx')) {
      setNotice('XLSX 文件将提交后由后端解析预览；本地仅对 CSV 做即时预览。');
      return;
    }

    const rows = parseCsv(await nextFile.text());
    const headers = rows[0] ?? [];
    const missing = expectedFields.filter((field) => !headers.includes(field));
    const preview = rows.slice(1, 21).map((row, index) => {
      const values = Object.fromEntries(headers.map((header, columnIndex) => [header, row[columnIndex] ?? '']));
      const emptyRequired = expectedFields.filter((field) => !values[field]);
      return {
        rowNumber: index + 2,
        values,
        valid: missing.length === 0 && emptyRequired.length === 0,
        errors: [...missing.map((field) => `缺少字段 ${field}`), ...emptyRequired.map((field) => `${field} 不能为空`)],
      };
    });
    setPreviewRows(preview);
    setNotice(missing.length ? `字段校验失败：缺少 ${missing.join('、')}` : '已完成字段校验并生成前 20 行预览。');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!file) {
      setNotice('请先选择导入文件。');
      return;
    }
    if (invalidPreviewCount > 0) {
      setNotice('预览中仍有校验失败行，请修正文件后再导入。');
      return;
    }
    setSubmitting(true);
    try {
      const task = usingFallback
        ? { id: `local-${Date.now()}`, type, fileName: file.name, status: 'previewed' as const, totalRows: previewRows?.length ?? 0, successRows: 0, failedRows: 0, createdAt: new Date().toLocaleString(), previewRows }
        : await importTaskApi.createTask({ type, file, previewOnly: false });
      setTasks((current) => [task, ...current]);
      setNotice('导入任务已创建，可在任务列表查看处理进度。');
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '导入任务创建失败。');
    } finally {
      setSubmitting(false);
    }
  };

  const handleShowErrors = async (task: ImportTask) => {
    setSelectedTask(task);
    if (usingFallback || task.id.startsWith('sample')) {
      setErrors(sampleErrors);
      return;
    }
    try {
      const data = await importTaskApi.listErrors(task.id);
      setErrors(data.items);
    } catch {
      setErrors([]);
      setNotice('失败原因加载失败，请稍后重试。');
    }
  };

  const downloadErrors = () => {
    const header = 'rowNumber,field,message\n';
    const body = errors.map((item) => `${item.rowNumber},${item.field ?? ''},"${item.message.replace(/"/g, '""')}"`).join('\n');
    const blob = new Blob([header + body], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedTask?.id ?? 'import'}-errors.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="import-page">
      <div className="page-heading">
        <p className="eyebrow">Import Center</p>
        <h1>导入工具</h1>
        <p>统一处理小区库、敏感词、黑白名单与城市配置批量导入，支持 CSV / XLSX、字段校验、预览和失败明细下载。</p>
      </div>
      {notice && <div className="notice">{notice}</div>}
      <section className="panel-card form-section"><h2>创建导入任务</h2><form className="filter-bar" onSubmit={handleSubmit}><label>导入类型<select value={type} onChange={(event) => setType(event.target.value as ImportType)}>{Object.entries(importTypeText).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label><label>上传文件<input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileChange} /></label><button type="submit" disabled={submitting}>{submitting ? '提交中...' : '提交导入'}</button></form><p className="helper-text">必填字段：{expectedFields.join('、')}。提交前会预览前 20 行并阻断明显字段错误。</p></section>
      <section className="panel-card form-section"><h2>预览前 20 行</h2><div className="table-wrap"><table><thead><tr><th>行号</th><th>状态</th><th>数据</th><th>失败原因</th></tr></thead><tbody>{previewRows?.length ? previewRows.map((row) => <tr key={row.rowNumber}><td>{row.rowNumber}</td><td><span className={`status-pill ${row.valid ? 'success' : 'muted'}`}>{row.valid ? '通过' : '失败'}</span></td><td>{Object.entries(row.values).map(([key, value]) => `${key}: ${value}`).join('；')}</td><td>{row.errors.join('；') || '-'}</td></tr>) : <tr><td className="empty-cell" colSpan={4}>请选择 CSV 文件后查看预览；XLSX 预览由后端返回。</td></tr>}</tbody></table></div></section>
      <section className="panel-card form-section"><h2>导入任务</h2><div className="table-wrap"><table><thead><tr><th>任务</th><th>类型</th><th>状态</th><th>成功/失败/总数</th><th>创建时间</th><th>操作</th></tr></thead><tbody>{tasks.map((task) => <tr key={task.id}><td>{task.fileName}<br /><small>{task.id}</small></td><td>{importTypeText[task.type]}</td><td><span className="status-pill muted">{task.status}</span></td><td>{task.successRows} / {task.failedRows} / {task.totalRows}</td><td>{task.createdAt}</td><td><div className="action-group"><button type="button" className="secondary-button" onClick={() => handleShowErrors(task)}>失败原因</button>{task.errorFileUrl ? <a className="secondary-button" href={task.errorFileUrl}>下载错误文件</a> : null}</div></td></tr>)}</tbody></table></div></section>
      {selectedTask && <section className="detail-panel form-section"><div><h2>{selectedTask.fileName} 失败原因</h2><p>来自接口 GET /admin/import/tasks/:id/errors，可下载为 CSV 供业务修正后重新导入。</p></div><button type="button" onClick={downloadErrors}>下载错误文件</button><pre>{JSON.stringify(errors, null, 2)}</pre></section>}
    </div>
  );
}
