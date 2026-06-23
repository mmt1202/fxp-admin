const TOKEN_KEY = 'fxp_admin_token';

type AuthListener = (token: string | null) => void;

let currentToken = window.localStorage.getItem(TOKEN_KEY);
const listeners = new Set<AuthListener>();

function notify(): void {
  listeners.forEach((listener) => listener(currentToken));
}

export const authState = {
  get token(): string | null {
    return currentToken;
  },
  isAuthenticated(): boolean {
    return Boolean(currentToken);
  },
  login(token: string): void {
    currentToken = token;
    window.localStorage.setItem(TOKEN_KEY, token);
    notify();
  },
  logout(): void {
    currentToken = null;
    window.localStorage.removeItem(TOKEN_KEY);
    notify();
  },
  subscribe(listener: AuthListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
};
