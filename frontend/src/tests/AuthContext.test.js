// AuthContext.test.js
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth, AuthContext } from './AuthContext';

// ─── Mock config ───────────────────────────────────────────────────────────
jest.mock('../config', () => ({ API_BASE_URL: 'http://localhost:4000' }));

// ─── Helpers ───────────────────────────────────────────────────────────────
const mockFetch = (responses) => {
  let i = 0;
  global.fetch = jest.fn(() => {
    const r = Array.isArray(responses) ? responses[i++] || responses[responses.length - 1] : responses;
    return Promise.resolve(r);
  });
};

const makeResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

// Composant consommateur minimal pour les tests
function Consumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="user">{auth.user ? auth.user.email : 'null'}</span>
      <span data-testid="access">{auth.accessToken || 'null'}</span>
      <button onClick={() => auth.login({ email: 'a@b.com', password: 'pass' })}>login</button>
      <button onClick={() => auth.logout()}>logout</button>
      <button onClick={() => auth.register({ username: 'Jo', email: 'jo@b.com', password: 'pw' })}>register</button>
    </div>
  );
}

// ─── Setup / Teardown ──────────────────────────────────────────────────────
beforeEach(() => {
  localStorage.clear();
  jest.clearAllMocks();
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. Initialisation depuis localStorage
// ══════════════════════════════════════════════════════════════════════════════
describe('Initialisation depuis localStorage', () => {
  it('charge user/tokens depuis localStorage si présents', () => {
    const user = { email: 'stored@test.com', id: 1 };
    localStorage.setItem('accessToken', 'tok_stored');
    localStorage.setItem('refreshToken', 'ref_stored');
    localStorage.setItem('user', JSON.stringify(user));

    render(<AuthProvider><Consumer /></AuthProvider>);
    expect(screen.getByTestId('user').textContent).toBe('stored@test.com');
    expect(screen.getByTestId('access').textContent).toBe('tok_stored');
  });

  it('renvoie null si tokens valent "null" en string', () => {
    localStorage.setItem('accessToken', 'null');
    localStorage.setItem('refreshToken', 'null');
    localStorage.setItem('user', 'null');

    render(<AuthProvider><Consumer /></AuthProvider>);
    expect(screen.getByTestId('access').textContent).toBe('null');
    expect(screen.getByTestId('user').textContent).toBe('null');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Login
// ══════════════════════════════════════════════════════════════════════════════
describe('login()', () => {
  it('met à jour user et tokens après un login réussi', async () => {
    mockFetch(makeResponse({
      accessToken: 'acc_new',
      refreshToken: 'ref_new',
      user: { email: 'a@b.com', id: 42 },
    }));

    render(<AuthProvider><Consumer /></AuthProvider>);

    await act(async () => {
      screen.getByText('login').click();
    });

    expect(screen.getByTestId('user').textContent).toBe('a@b.com');
    expect(screen.getByTestId('access').textContent).toBe('acc_new');
    expect(localStorage.getItem('accessToken')).toBe('acc_new');
    expect(localStorage.getItem('refreshToken')).toBe('ref_new');
  });

  it('lève une erreur si les identifiants sont invalides (401)', async () => {
    mockFetch(makeResponse({ message: 'Identifiants invalides' }, 401));

    let error = null;
    function BadLogin() {
      const { login } = useAuth();
      return (
        <button onClick={async () => {
          try { await login({ email: 'x@x.com', password: 'bad' }); }
          catch (e) { error = e.message; }
        }}>go</button>
      );
    }

    render(<AuthProvider><BadLogin /></AuthProvider>);
    await act(async () => { screen.getByText('go').click(); });
    expect(error).toBe('Identifiants invalides');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Register
// ══════════════════════════════════════════════════════════════════════════════
describe('register()', () => {
  it('enregistre les tokens et user après inscription réussie', async () => {
    mockFetch(makeResponse({
      accessToken: 'acc_reg',
      refreshToken: 'ref_reg',
      user: { email: 'jo@b.com', id: 99 },
    }));

    render(<AuthProvider><Consumer /></AuthProvider>);
    await act(async () => { screen.getByText('register').click(); });

    expect(screen.getByTestId('user').textContent).toBe('jo@b.com');
    expect(localStorage.getItem('accessToken')).toBe('acc_reg');
  });

  it('lève une erreur en cas d\'échec', async () => {
    mockFetch(makeResponse({ message: 'Email déjà utilisé' }, 400));

    let error = null;
    function BadReg() {
      const { register } = useAuth();
      return (
        <button onClick={async () => {
          try { await register({ username: 'X', email: 'x@x.com', password: '123' }); }
          catch (e) { error = e.message; }
        }}>go</button>
      );
    }

    render(<AuthProvider><BadReg /></AuthProvider>);
    await act(async () => { screen.getByText('go').click(); });
    expect(error).toBe('Email déjà utilisé');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Logout
// ══════════════════════════════════════════════════════════════════════════════
describe('logout()', () => {
  it('vide le state et le localStorage', async () => {
    // Pré-remplir un état connecté
    localStorage.setItem('accessToken', 'tok_x');
    localStorage.setItem('refreshToken', 'ref_x');
    localStorage.setItem('user', JSON.stringify({ email: 'x@x.com' }));

    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }));

    render(<AuthProvider><Consumer /></AuthProvider>);
    expect(screen.getByTestId('user').textContent).toBe('x@x.com');

    await act(async () => { screen.getByText('logout').click(); });

    expect(screen.getByTestId('user').textContent).toBe('null');
    expect(screen.getByTestId('access').textContent).toBe('null');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('ne fait pas de requête si pas de refreshToken', async () => {
    global.fetch = jest.fn();
    render(<AuthProvider><Consumer /></AuthProvider>);
    await act(async () => { screen.getByText('logout').click(); });
    expect(global.fetch).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. authFetch – refresh automatique
// ══════════════════════════════════════════════════════════════════════════════
describe('authFetch()', () => {
  it('ajoute le header Authorization avec le token courant', async () => {
    localStorage.setItem('accessToken', 'tok_valid');
    localStorage.setItem('refreshToken', 'ref_valid');

    let capturedHeaders = null;
    global.fetch = jest.fn((url, opts) => {
      capturedHeaders = opts.headers;
      return Promise.resolve(makeResponse({ data: 'ok' }));
    });

    function FetchTester() {
      const { authFetch } = useAuth();
      return (
        <button onClick={() => authFetch('http://localhost:4000/api/test')}>fetch</button>
      );
    }

    render(<AuthProvider><FetchTester /></AuthProvider>);
    await act(async () => { screen.getByText('fetch').click(); });

    expect(capturedHeaders.Authorization).toBe('Bearer tok_valid');
  });

  it('tente un refresh si le premier appel retourne 401', async () => {
    localStorage.setItem('accessToken', 'tok_expired');
    localStorage.setItem('refreshToken', 'ref_ok');

    global.fetch = jest.fn()
      // 1er appel : 401 (token expiré)
      .mockResolvedValueOnce(makeResponse({}, 401))
      // appel refresh
      .mockResolvedValueOnce(makeResponse({ accessToken: 'tok_fresh', refreshToken: 'ref_ok2' }))
      // retry avec nouveau token
      .mockResolvedValueOnce(makeResponse({ data: 'ok' }));

    let result = null;
    function FetchTester() {
      const { authFetch } = useAuth();
      return (
        <button onClick={async () => {
          const res = await authFetch('http://localhost:4000/api/test');
          result = res.status;
        }}>fetch</button>
      );
    }

    render(<AuthProvider><FetchTester /></AuthProvider>);
    await act(async () => { screen.getByText('fetch').click(); });

    expect(global.fetch).toHaveBeenCalledTimes(3);
    expect(result).toBe(200);
  });

  it('appelle logout si refresh échoue', async () => {
    localStorage.setItem('accessToken', 'tok_expired');
    localStorage.setItem('refreshToken', 'ref_bad');

    global.fetch = jest.fn()
      .mockResolvedValueOnce(makeResponse({}, 401)) // appel initial
      .mockResolvedValueOnce(makeResponse({}, 403)); // refresh échoue

    function FetchTester() {
      const { authFetch } = useAuth();
      return (
        <button onClick={async () => {
          try { await authFetch('http://localhost:4000/api/test'); }
          catch (_) {}
        }}>fetch</button>
      );
    }

    render(<AuthProvider><Consumer /><FetchTester /></AuthProvider>);
    await act(async () => { screen.getByText('fetch').click(); });

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('null');
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. useAuth hook
// ══════════════════════════════════════════════════════════════════════════════
describe('useAuth()', () => {
  it('expose les bonnes clés du contexte', () => {
    let ctx = null;
    function Inspector() {
      ctx = useAuth();
      return null;
    }
    render(<AuthProvider><Inspector /></AuthProvider>);
    expect(ctx).toHaveProperty('user');
    expect(ctx).toHaveProperty('accessToken');
    expect(ctx).toHaveProperty('refreshToken');
    expect(ctx).toHaveProperty('login');
    expect(ctx).toHaveProperty('logout');
    expect(ctx).toHaveProperty('register');
    expect(ctx).toHaveProperty('authFetch');
  });
});