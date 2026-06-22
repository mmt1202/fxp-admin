import { loginApi } from '../api/auth';
import { authState } from '../state/auth';
import { createElement, qs } from '../utils/dom';

export function LoginPage(onSuccess: () => void): HTMLElement {
  const page = createElement('div', { className: 'login-page' });
  page.innerHTML = `
    <form class="login-card">
      <p class="eyebrow">房小评运营平台</p>
      <h1>管理员登录</h1>
      <label>账号<input name="username" value="admin" placeholder="请输入账号" /></label>
      <label>密码<input name="password" type="password" placeholder="请输入密码" /></label>
      <div class="error-text" hidden></div>
      <button type="submit">登录</button>
    </form>
  `;

  const form = qs<HTMLFormElement>('form', page);
  const error = qs<HTMLDivElement>('.error-text', page);
  const button = qs<HTMLButtonElement>('button', page);

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    button.disabled = true;
    button.textContent = '登录中...';

    const data = new FormData(form);

    try {
      const result = await loginApi(String(data.get('username') ?? ''), String(data.get('password') ?? ''));
      authState.login(result.token);
      onSuccess();
    } catch {
      error.textContent = '登录失败，请检查账号、密码或后端接口配置。';
      error.hidden = false;
    } finally {
      button.disabled = false;
      button.textContent = '登录';
    }
  });

  return page;
}
