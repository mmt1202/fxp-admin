const ADMIN_SESSION_KEY = 'fxp-admin-session';
const state = {
  session: localStorage.getItem(ADMIN_SESSION_KEY),
  activePage: 'dashboard',
  users: [
    { id: 'U1001', name: '林安安', phone: '138****1024', city: '上海', reviews: 12, status: 'enabled', joinedAt: '2026-03-12' },
    { id: 'U1002', name: '王小川', phone: '186****3345', city: '杭州', reviews: 5, status: 'enabled', joinedAt: '2026-04-02' },
    { id: 'U1003', name: '赵明', phone: '159****9876', city: '北京', reviews: 0, status: 'disabled', joinedAt: '2026-05-18' },
    { id: 'U1004', name: '陈可', phone: '131****4588', city: '深圳', reviews: 8, status: 'enabled', joinedAt: '2026-06-01' },
  ],
  listings: [
    { id: 'H2001', title: '静安寺一居室', city: '上海', address: '静安区愚园路', landlord: '李房东', status: 'online', reviews: 9 },
    { id: 'H2002', title: '滨江江景两居', city: '杭州', address: '滨江区闻涛路', landlord: '周女士', status: 'offline', reviews: 3 },
    { id: 'H2003', title: '望京合租主卧', city: '北京', address: '朝阳区广顺北大街', landlord: '刘先生', status: 'online', reviews: 6 },
    { id: 'H2004', title: '南山科技园公寓', city: '深圳', address: '南山区科苑路', landlord: '吴房东', status: 'online', reviews: 7 },
  ],
  reviews: [
    { id: 'R3001', user: '林安安', listing: '静安寺一居室', score: 4.5, content: '交通方便，隔音一般。', status: 'visible', createdAt: '2026-06-10' },
    { id: 'R3002', user: '王小川', listing: '滨江江景两居', score: 3.5, content: '景观不错，物业响应偏慢。', status: 'visible', createdAt: '2026-06-11' },
    { id: 'R3003', user: '陈可', listing: '南山科技园公寓', score: 2, content: '图片与实际有差距。', status: 'hidden', createdAt: '2026-06-13' },
    { id: 'R3004', user: '赵明', listing: '望京合租主卧', score: 4, content: '室友友好，通勤方便。', status: 'visible', createdAt: '2026-06-16' },
  ],
  reports: [
    { id: 'P4001', target: '评价 R3003', type: '虚假评价', reporter: '林安安', status: 'pending', detail: '评价内容可能与实际房源不符。' },
    { id: 'P4002', target: '房源 H2002', type: '房源失效', reporter: '王小川', status: 'pending', detail: '联系房东后确认暂不可租。' },
    { id: 'P4003', target: '用户 U1003', type: '骚扰信息', reporter: '陈可', status: 'processed', detail: '已核验并限制站内消息。' },
  ],
};
const navItems = [ ['dashboard', '数据看板', '📊'], ['users', '用户管理', '👥'], ['listings', '房源管理', '🏢'], ['reviews', '评价管理', '💬'], ['reports', '举报审核', '🚩'], ['settings', '系统配置', '⚙️'] ];
const root = document.getElementById('root');
const esc = (v) => String(v).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const badge = (status, text) => `<span class="badge ${status}">${text}</span>`;
function render() { state.session ? renderApp() : renderLogin(); }
function renderLogin() { root.innerHTML = `<div class="login-page"><form class="login-card" id="login-form"><div class="login-icon">🛡️</div><h1>房小评管理平台</h1><p>管理员登录入口。演示账号：admin / 任意密码。</p><label>管理员账号<input value="admin" required></label><label>密码<input type="password" value="fxp-admin" required></label><button>登录</button></form></div>`; document.getElementById('login-form').addEventListener('submit', (e)=>{e.preventDefault(); localStorage.setItem(ADMIN_SESSION_KEY,'demo-admin'); state.session='demo-admin'; render();}); }
function renderApp() { const title = navItems.find(([k]) => k === state.activePage)[1]; root.innerHTML = `<div class="app-shell"><aside class="sidebar"><div class="brand"><span>🛡️</span><div><strong>房小评</strong><span>管理平台 MVP</span></div></div><nav>${navItems.map(([key,label,icon]) => `<button data-page="${key}" class="${state.activePage===key?'active':''}"><span>${icon}</span>${label}</button>`).join('')}</nav><button class="logout" id="logout">↩️ 退出登录</button></aside><main><header class="topbar"><div><p>登录态校验通过</p><h1>${title}</h1></div><span class="admin-pill">👤 超级管理员</span></header><div id="page">${pageHtml()}</div></main></div>`; bindApp(); }
function bindApp(){ document.querySelectorAll('[data-page]').forEach((b)=>b.addEventListener('click',()=>{state.activePage=b.dataset.page; render();})); document.getElementById('logout').addEventListener('click',()=>{localStorage.removeItem(ADMIN_SESSION_KEY); state.session=null; state.activePage='dashboard'; render();}); bindPage(); }
function pageHtml(){ return ({dashboard,users,listings,reviews,reports,settings})[state.activePage](); }
function dashboard(){ const stats = [['用户总数',state.users.length,'👥','blue'],['房源总数',state.listings.length,'🏠','green'],['评价总数',state.reviews.length,'💬','purple'],['待处理举报数',state.reports.filter(r=>r.status==='pending').length,'🚩','orange']]; return `<section class="page-grid"><div class="stat-grid">${stats.map(([l,v,i,t])=>`<article class="stat ${t}"><span>${i}</span><span>${l}</span><strong>${v}</strong></article>`).join('')}</div><div class="panel"><h2>待办提醒</h2>${state.reports.filter(r=>r.status==='pending').map(r=>`<div class="todo"><span>🚩</span><div><strong>${esc(r.type)}</strong><p>${esc(r.target)} · ${esc(r.detail)}</p></div></div>`).join('')}</div></section>`; }
function searchBox(kind, placeholder){ return `<div class="toolbar"><label class="search">🔎<input id="search-input" data-kind="${kind}" placeholder="${placeholder}"></label></div>`; }
function users(){ return crud(searchBox('users','搜索用户姓名、手机号、城市或 ID') + table(['用户','手机号','城市','评价数','状态','用户详情','操作'], state.users, u=>[cellStrong(u.name,u.id),u.phone,u.city,u.reviews,badge(u.status,u.status==='enabled'?'启用':'禁用'),`注册于 ${u.joinedAt}`,`<button class="link-btn" data-toggle-user="${u.id}">${u.status==='enabled'?'禁用用户':'启用用户'}</button>`])); }
function listings(){ return crud(searchBox('listings','搜索房源标题、城市、地址或 ID') + table(['房源','城市','地址','房东','状态','房源详情','操作'], state.listings, l=>[cellStrong(l.title,l.id),l.city,l.address,l.landlord,badge(l.status,l.status==='online'?'已上架':'已下架'),`${l.reviews} 条评价`,`<button class="link-btn" data-toggle-listing="${l.id}">${l.status==='online'?'下架房源':'上架房源'}</button>`])); }
function reviews(){ return crud(searchBox('reviews','搜索评价用户、房源、内容或 ID') + table(['评价','用户','房源','评分','状态','时间','操作'], state.reviews, r=>[cellStrong(r.content,r.id),r.user,r.listing,r.score,badge(r.status,r.status==='visible'?'展示中':'已隐藏'),r.createdAt,`<button class="link-btn" data-toggle-review="${r.id}">${r.status==='visible'?'🙈 隐藏':'👁️ 恢复'}</button>`])); }
function reports(){ return crud(table(['举报编号','举报对象','类型','举报人','状态','举报详情','操作'], state.reports, r=>[`<strong>${r.id}</strong>`,r.target,r.type,r.reporter,badge(r.status,r.status==='pending'?'待处理':'已处理'),r.detail,`<button class="link-btn" ${r.status==='processed'?'disabled':''} data-process-report="${r.id}">✅ 标记已处理</button>`])); }
function settings(){ return `<section class="settings-grid"><article class="panel"><h2>基础平台配置展示</h2><dl><dt>平台名称</dt><dd>房小评</dd><dt>管理端版本</dt><dd>MVP v0.1</dd><dt>运营城市</dt><dd>上海、杭州、北京、深圳</dd><dt>内容审核策略</dt><dd>举报优先，人工复核后处理</dd></dl></article><article class="panel"><h2>后端接口地址配置说明</h2><p>生产环境建议通过 <code>VITE_API_BASE_URL</code> 注入接口地址，例如：</p><pre>VITE_API_BASE_URL=https://api.fangxiaoping.example.com</pre><p>当前页面使用前端模拟数据，后续可将登录、搜索、状态变更操作替换为真实 API 调用。</p></article></section>`; }
function crud(content){ return `<section class="panel crud-page">${content}</section>`; }
function cellStrong(a,b){ return `<strong>${esc(a)}</strong><small>${esc(b)}</small>`; }
function table(headers, rows, mapper){ return `<div class="table-wrap"><table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr data-row="${esc(Object.values(row).join(' '))}">${mapper(row).map(c=>`<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`; }
function bindPage(){ document.querySelectorAll('[data-toggle-user]').forEach(b=>b.onclick=()=>{const u=state.users.find(x=>x.id===b.dataset.toggleUser); u.status=u.status==='enabled'?'disabled':'enabled'; render();}); document.querySelectorAll('[data-toggle-listing]').forEach(b=>b.onclick=()=>{const l=state.listings.find(x=>x.id===b.dataset.toggleListing); l.status=l.status==='online'?'offline':'online'; render();}); document.querySelectorAll('[data-toggle-review]').forEach(b=>b.onclick=()=>{const r=state.reviews.find(x=>x.id===b.dataset.toggleReview); r.status=r.status==='visible'?'hidden':'visible'; render();}); document.querySelectorAll('[data-process-report]').forEach(b=>b.onclick=()=>{const r=state.reports.find(x=>x.id===b.dataset.processReport); r.status='processed'; render();}); const input=document.getElementById('search-input'); if(input) input.addEventListener('input',()=>{document.querySelectorAll('tbody tr').forEach(tr=>tr.style.display=tr.dataset.row.includes(input.value)?'':'none');}); }
render();
