import { loginApi } from '../api/auth';
import { authState } from '../state/auth';
import { createElement } from '../utils/dom';

export function LoginPage(onLoggedIn: () => void): HTMLElement {
  const page = createElement('div', { className: 'login-page' });
  const form = createElement('form', { className: 'login-card' });
  const error = createElement('div', { className: 'error-text' });
  error.hidden = true;

  const username = createElement('input', { attrs: { placeholder: '请输入账号' } });
  username.value = 'admin';
  const password = createElement('input', { attrs: { type: 'password', placeholder: '请输入密码' } });
  const button = createElement('button', { text: '登录', attrs: { type: 'submit' } });

  const usernameLabel = createElement('label', { text: '账号' });
  usernameLabel.append(username);
  const passwordLabel = createElement('label', { text: '密码' });
  passwordLabel.append(password);

  form.append(
    createElement('p', { className: 'eyebrow', text: '房小评运营平台' }),
    createElement('h1', { text: '管理员登录' }),
    usernameLabel,
    passwordLabel,
    error,
    button,
  );

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.hidden = true;
    button.setAttribute('disabled', 'true');
    button.textContent = '登录中...';

    try {
      const result = await loginApi(username.value, password.value);
      authState.login(result.token);
      onLoggedIn();
    } catch {
      error.textContent = '登录失败，请检查账号、密码或后端接口配置。';
      error.hidden = false;
    } finally {
      button.removeAttribute('disabled');
      button.textContent = '登录';
    }
  });

  page.append(form);
  return page;
}
