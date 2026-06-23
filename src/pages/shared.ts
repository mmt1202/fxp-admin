import { createElement } from '../utils/dom';

export function createModulePage(title: string, description: string, slots: string[] = ['列表检索', '详情编辑', '批量操作', '数据导出']): HTMLElement {
  const wrapper = createElement('div', { className: 'module-page' });
  wrapper.append(
    createElement('p', { className: 'eyebrow', text: '业务模块预留' }),
    createElement('h1', { text: title }),
    createElement('p', { text: description }),
  );

  const grid = createElement('div', { className: 'placeholder-grid' });
  slots.forEach((slot) => grid.append(createElement('div', { text: slot })));
  wrapper.append(grid);

  return wrapper;
}
