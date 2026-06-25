import { createElement } from '../utils/dom';

const importTypes = [
  ['community_library', '小区库', 'city、name、district、address'],
  ['sensitive_words', '敏感词', 'word、category、riskLevel'],
  ['blacklist', '黑名单', 'targetType、targetValue、reason'],
  ['whitelist', '白名单', 'targetType、targetValue、reason'],
  ['city_config', '城市配置', 'cityCode、cityName、enabled'],
] as const;

function parseCsv(text: string): string[][] {
  return text.trim().split(/\r?\n/).map((line) => line.split(',').map((cell) => cell.trim()));
}

export function ImportToolsPage(): HTMLElement {
  const wrapper = createElement('div', { className: 'import-page' });
  const typeSelect = createElement('select') as HTMLSelectElement;
  importTypes.forEach(([value, label]) => typeSelect.append(createElement('option', { text: label, attrs: { value } })));
  const fileInput = createElement('input', { attrs: { type: 'file', accept: '.csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' } }) as HTMLInputElement;
  const notice = createElement('div', { className: 'notice', text: '请选择 CSV / XLSX 文件。CSV 可在本地预览前 20 行，XLSX 将由后端导入接口解析。' });
  const previewBody = createElement('tbody');
  const errorsPre = createElement('pre', { text: JSON.stringify([{ rowNumber: 18, field: 'name', message: '小区名称不能为空' }, { rowNumber: 42, field: 'city', message: '城市未开通或城市编码不存在' }], null, 2) });

  const renderEmptyPreview = () => {
    previewBody.replaceChildren(createElement('tr'));
    previewBody.firstElementChild?.append(createElement('td', { className: 'empty-cell', text: '上传 CSV 后展示前 20 行预览。', attrs: { colSpan: '4' } }));
  };

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const isCsv = file.name.toLowerCase().endsWith('.csv');
    const isXlsx = file.name.toLowerCase().endsWith('.xlsx');
    if (!isCsv && !isXlsx) {
      notice.textContent = '仅支持 CSV / XLSX 文件。';
      return;
    }
    if (isXlsx) {
      notice.textContent = 'XLSX 文件已选择：提交后调用 POST /admin/import/tasks 由后端解析并返回预览。';
      renderEmptyPreview();
      return;
    }

    const rows = parseCsv(await file.text());
    const headers = rows[0] ?? [];
    const required = importTypes.find(([value]) => value === typeSelect.value)?.[2].split('、') ?? [];
    const missing = required.filter((field) => !headers.includes(field));
    previewBody.replaceChildren(...rows.slice(1, 21).map((row, index) => {
      const values = Object.fromEntries(headers.map((header, columnIndex) => [header, row[columnIndex] ?? '']));
      const emptyRequired = required.filter((field) => !values[field]);
      const errors = [...missing.map((field) => `缺少字段 ${field}`), ...emptyRequired.map((field) => `${field} 不能为空`)];
      const tr = createElement('tr');
      tr.append(
        createElement('td', { text: String(index + 2) }),
        createElement('td', { text: errors.length ? '失败' : '通过' }),
        createElement('td', { text: Object.entries(values).map(([key, value]) => `${key}: ${value}`).join('；') }),
        createElement('td', { text: errors.join('；') || '-' }),
      );
      return tr;
    }));
    notice.textContent = missing.length ? `字段校验失败：缺少 ${missing.join('、')}` : '字段校验通过，已生成前 20 行预览。';
  });

  renderEmptyPreview();
  const form = createElement('form', { className: 'filter-bar' });
  form.append(
    createElement('label', { text: '导入类型' }),
    typeSelect,
    createElement('label', { text: '上传文件' }),
    fileInput,
    createElement('button', { text: '提交导入任务', attrs: { type: 'button' } }),
  );
  form.querySelector('button')?.addEventListener('click', () => {
    notice.textContent = '将调用 POST /admin/import/tasks 创建 ImportTask，并在列表通过 GET /admin/import/tasks 查询进度。';
  });

  const previewTable = createElement('table');
  previewTable.append(createElement('thead'), previewBody);
  previewTable.querySelector('thead')?.append(createElement('tr'));
  previewTable.querySelector('tr')?.append(createElement('th', { text: '行号' }), createElement('th', { text: '状态' }), createElement('th', { text: '数据' }), createElement('th', { text: '失败原因' }));

  wrapper.append(
    createElement('p', { className: 'eyebrow', text: 'Import Center' }),
    createElement('h1', { text: '导入工具' }),
    createElement('p', { text: '支持小区库、敏感词、黑名单、白名单、城市配置批量导入，提供 CSV / XLSX 上传、字段校验、前 20 行预览、失败原因和错误文件下载。' }),
    notice,
    createElement('section', { className: 'panel-card' }),
  );
  const sections = wrapper.querySelector('section')!;
  sections.append(createElement('h2', { text: '创建导入任务' }), form, createElement('p', { className: 'helper-text', text: '后端模型：ImportTask；接口：POST /admin/import/tasks、GET /admin/import/tasks、GET /admin/import/tasks/:id/errors。' }));
  const previewSection = createElement('section', { className: 'panel-card' });
  previewSection.append(createElement('h2', { text: '预览前 20 行' }), previewTable);
  const errorSection = createElement('section', { className: 'detail-panel' });
  errorSection.append(createElement('div', { text: '失败原因示例，可由接口返回后下载错误文件。' }), createElement('button', { text: '下载错误文件', attrs: { type: 'button' } }), errorsPre);
  wrapper.append(previewSection, errorSection);
  return wrapper;
}
