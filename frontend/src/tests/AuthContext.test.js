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

  it('initialise correctement les tokens depuis localStorage', () => {
    localStorage.setItem('accessToken', 'abc123');
    localStorage.setItem('refreshToken', 'ref123');
    localStorage.setItem('user', JSON.stringify({ username: 'bob' }));

    const utils = renderWithProvider(); // ← correction

    expect(utils.accessToken).toBe('abc123');
    expect(utils.refreshToken).toBe('ref123');
    expect(utils.user.username).toBe('bob');
  });

  it('login stocke les tokens et le user', async () => {
    const utils = renderWithProvider(); // ← correction

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'newAccess',
        refreshToken: 'newRefresh',
        user: { username: 'alice', role: 'user' }
      })
    });

    await act(async () => {
      await utils.login({ email: 'a@a.com', password: '123' });
    });

    expect(localStorage.getItem('accessToken')).toBe('newAccess');
    expect(localStorage.getItem('refreshToken')).toBe('newRefresh');
    expect(JSON.parse(localStorage.getItem('user')).username).toBe('alice');
  });

  it('login échoue si credentials invalides', async () => {
    const utils = renderWithProvider(); // ← correction

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Invalid' })
    });

    await expect(
      utils.login({ email: 'bad', password: 'bad' })
    ).rejects.toThrow('Invalid');
  });

  it('register stocke les tokens et le user', async () => {
    const utils = renderWithProvider(); // ← correction

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'regAccess',
        refreshToken: 'regRefresh',
        user: { username: 'newUser' }
      })
    });

    await act(async () => {
      await utils.register({ username: 'x', email: 'x@x.com', password: '123' });
    });

    expect(localStorage.getItem('accessToken')).toBe('regAccess');
    expect(localStorage.getItem('refreshToken')).toBe('regRefresh');
    expect(JSON.parse(localStorage.getItem('user')).username).toBe('newUser');
  });

  it('logout nettoie les tokens et le user', async () => {
    localStorage.setItem('accessToken', 'abc');
    localStorage.setItem('refreshToken', 'ref');
    localStorage.setItem('user', JSON.stringify({ username: 'bob' }));

    const utils = renderWithProvider(); // ← correction

    fetch.mockResolvedValueOnce({ ok: true });

    await act(async () => {
      await utils.logout();
    });

    expect(localStorage.getItem('accessToken')).toBe(null);
    expect(localStorage.getItem('refreshToken')).toBe(null);
    expect(localStorage.getItem('user')).toBe(null);
    expect(utils.user).toBe(null);
  });

  it('refreshAccessToken met à jour les tokens', async () => {
    localStorage.setItem('refreshToken', 'ref123');

    const utils = renderWithProvider(); // ← correction

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'newA',
        refreshToken: 'newR'
      })
    });

    let newToken;
    await act(async () => {
      newToken = await utils.refreshAccessToken();
    });

    expect(newToken).toBe('newA');
    expect(localStorage.getItem('accessToken')).toBe('newA');
    expect(localStorage.getItem('refreshToken')).toBe('newR');
  });

  it('refreshAccessToken appelle logout si refresh échoue', async () => {
    localStorage.setItem('refreshToken', 'ref123');

    const utils = renderWithProvider(); // ← correction

    fetch.mockResolvedValueOnce({ ok: false });

    await act(async () => {
      await utils.refreshAccessToken();
    });

    expect(utils.user).toBe(null);
  });

  it('authFetch ajoute le header Authorization', async () => {
    localStorage.setItem('accessToken', 'abc');

    const utils = renderWithProvider(); // ← correction

    fetch.mockResolvedValueOnce({ status: 200 });

    await act(async () => {
      await utils.authFetch('/test');
    });

    expect(fetch).toHaveBeenCalledWith('/test', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer abc'
      })
    }));
  });
});
