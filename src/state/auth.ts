const TOKEN_KEY = 'fxp_admin_token';

type AuthListener = (token: string | null) => void;

let authToken = window.localStorage.getItem(TOKEN_KEY);
const listeners = new Set<AuthListener>();

function notify(): void {
  listeners.forEach((listener) => listener(authToken));
}

export const authState = {
  getToken(): string | null {
    return authToken;
  },
  isAuthenticated(): boolean {
    return Boolean(authToken);
  },
  login(token: string): void {
    authToken = token;
    window.localStorage.setItem(TOKEN_KEY, token);
    notify();
  },
  logout(): void {
    authToken = null;
    window.localStorage.removeItem(TOKEN_KEY);
    notify();
  },
  subscribe(listener: AuthListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
