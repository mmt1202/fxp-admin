import { FormEvent, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { loginApi } from '../api/auth';
import { useAuthStore } from '../store/auth';

export function Login() {
  const { token, login } = useAuthStore();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await loginApi(username, password);
      login(result.token);
      navigate('/dashboard', { replace: true });
    } catch {
      setError('登录失败，请检查账号、密码或后端接口配置。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={handleSubmit}>
        <p className="eyebrow">房小评运营平台</p>
        <h1>管理员登录</h1>
        <label>
          账号
          <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="请输入账号" />
        </label>
        <label>
          密码
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入密码" />
        </label>
        {error && <div className="error-text">{error}</div>}
        <button type="submit" disabled={loading}>{loading ? '登录中...' : '登录'}</button>
      </form>
    </div>
  );
}
