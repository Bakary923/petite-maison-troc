import React from 'react';
import { render, act } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../contexts/AuthContext';

// Mock global fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value; },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('🔐 AuthContext', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderWithProvider = () => {
    let contextValue;
    render(
      <AuthProvider>
        <AuthContext.Consumer>
          {(value) => {
            contextValue = value;
            return null;
          }}
        </AuthContext.Consumer>
      </AuthProvider>
    );
    return contextValue;
  };

  // ============================================================
  // 1. Initialisation sécurisée
  // ============================================================
  it('initialise correctement les tokens depuis localStorage', () => {
    localStorage.setItem('accessToken', 'abc123');
    localStorage.setItem('refreshToken', 'ref123');
    localStorage.setItem('user', JSON.stringify({ username: 'bob' }));

    const ctx = renderWithProvider();

    expect(ctx.accessToken).toBe('abc123');
    expect(ctx.refreshToken).toBe('ref123');
    expect(ctx.user.username).toBe('bob');
  });

  // ============================================================
  // 2. LOGIN
  // ============================================================
  it('login stocke les tokens et le user', async () => {
    const ctx = renderWithProvider();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'newAccess',
        refreshToken: 'newRefresh',
        user: { username: 'alice', role: 'user' }
      })
    });

    await act(async () => {
      await ctx.login({ email: 'a@a.com', password: '123' });
    });

    expect(localStorage.getItem('accessToken')).toBe('newAccess');
    expect(localStorage.getItem('refreshToken')).toBe('newRefresh');
    expect(JSON.parse(localStorage.getItem('user')).username).toBe('alice');
  });

  it('login échoue si credentials invalides', async () => {
    const ctx = renderWithProvider();

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid' })
    });

    await expect(
      ctx.login({ email: 'bad', password: 'bad' })
    ).rejects.toThrow('Invalid');
  });

  // ============================================================
  // 3. REGISTER
  // ============================================================
  it('register stocke les tokens et le user', async () => {
    const ctx = renderWithProvider();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'regAccess',
        refreshToken: 'regRefresh',
        user: { username: 'newUser' }
      })
    });

    await act(async () => {
      await ctx.register({ username: 'x', email: 'x@x.com', password: '123' });
    });

    expect(localStorage.getItem('accessToken')).toBe('regAccess');
    expect(localStorage.getItem('refreshToken')).toBe('regRefresh');
    expect(JSON.parse(localStorage.getItem('user')).username).toBe('newUser');
  });

  // ============================================================
  // 4. LOGOUT
  // ============================================================
  it('logout nettoie les tokens et le user', async () => {
    localStorage.setItem('accessToken', 'abc');
    localStorage.setItem('refreshToken', 'ref');
    localStorage.setItem('user', JSON.stringify({ username: 'bob' }));

    const ctx = renderWithProvider();

    fetch.mockResolvedValueOnce({ ok: true });

    await act(async () => {
      await ctx.logout();
    });

    expect(localStorage.getItem('accessToken')).toBe(null);
    expect(localStorage.getItem('refreshToken')).toBe(null);
    expect(localStorage.getItem('user')).toBe(null);
    expect(ctx.user).toBe(null);
  });

  // ============================================================
  // 5. REFRESH TOKEN
  // ============================================================
  it('refreshAccessToken met à jour les tokens', async () => {
    localStorage.setItem('refreshToken', 'ref123');

    const ctx = renderWithProvider();

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'newA',
        refreshToken: 'newR'
      })
    });

    let newToken;
    await act(async () => {
      newToken = await ctx.refreshAccessToken();
    });

    expect(newToken).toBe('newA');
    expect(localStorage.getItem('accessToken')).toBe('newA');
    expect(localStorage.getItem('refreshToken')).toBe('newR');
  });

  it('refreshAccessToken appelle logout si refresh échoue', async () => {
    localStorage.setItem('refreshToken', 'ref123');

    const ctx = renderWithProvider();

    fetch.mockResolvedValueOnce({ ok: false });

    await act(async () => {
      await ctx.refreshAccessToken();
    });

    expect(ctx.user).toBe(null);
  });

  // ============================================================
  // 6. AUTHFETCH (avec refresh automatique)
  // ============================================================
  it('authFetch ajoute le header Authorization', async () => {
    localStorage.setItem('accessToken', 'abc');

    const ctx = renderWithProvider();

    fetch.mockResolvedValueOnce({ status: 200 });

    await act(async () => {
      await ctx.authFetch('/test');
    });

    expect(fetch).toHaveBeenCalledWith('/test', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer abc'
      })
    }));
  });

  it('authFetch tente un refresh si 401', async () => {
    localStorage.setItem('accessToken', 'oldA');
    localStorage.setItem('refreshToken', 'ref123');

    const ctx = renderWithProvider();

    // 1ère requête → 401
    fetch.mockResolvedValueOnce({ status: 401 });

    // refresh → OK
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'newA',
        refreshToken: 'newR'
      })
    });

    // 2ème requête → OK
    fetch.mockResolvedValueOnce({ status: 200 });

    await act(async () => {
      await ctx.authFetch('/secure');
    });

    expect(localStorage.getItem('accessToken')).toBe('newA');
  });

  it('authFetch déclenche logout si refresh échoue', async () => {
    localStorage.setItem('accessToken', 'oldA');
    localStorage.setItem('refreshToken', 'ref123');

    const ctx = renderWithProvider();

    // 1ère requête → 401
    fetch.mockResolvedValueOnce({ status: 401 });

    // refresh → échoue
    fetch.mockResolvedValueOnce({ ok: false });

    await expect(
      act(async () => {
        await ctx.authFetch('/secure');
      })
    ).rejects.toThrow('Accès refusé');

    expect(ctx.user).toBe(null);
  });
});
