import React, { useContext } from 'react';
import { render, act, screen } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../contexts/AuthContext';

global.fetch = jest.fn();

const TestComponent = () => {
  const ctx = useContext(AuthContext);
  return (
    <div>
      <button onClick={() => ctx.login({ email: 'a', password: 'b' })}>login</button>
      <button onClick={() => ctx.logout()}>logout</button>
      <button onClick={() => ctx.refreshAccessToken()}>refresh</button>
      <button onClick={() => ctx.authFetch('/test')}>fetch</button>
      <span data-testid="username">{ctx.user ? ctx.user.username : ''}</span>
    </div>
  );
};

const renderWithProvider = () =>
  render(
    <AuthProvider>
      <TestComponent />
    </AuthProvider>
  );

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('login stocke les tokens et le user', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'A',
        refreshToken: 'R',
        user: { username: 'bob' }
      })
    });

    renderWithProvider();

    await act(async () => {
      screen.getByText('login').click();
    });

    expect(localStorage.getItem('accessToken')).toBe('A');
    expect(localStorage.getItem('refreshToken')).toBe('R');

    const username = await screen.findByTestId('username');
    expect(username.textContent).toBe('bob');
  });

  it('logout nettoie tout', async () => {
    localStorage.setItem('accessToken', 'A');
    localStorage.setItem('refreshToken', 'R');
    localStorage.setItem('user', JSON.stringify({ username: 'bob' }));

    renderWithProvider();

    await act(async () => {
      screen.getByText('logout').click();
    });

    expect(localStorage.getItem('accessToken')).toBe(null);
    expect(localStorage.getItem('refreshToken')).toBe(null);
    expect(localStorage.getItem('user')).toBe(null);

    const username = await screen.findByTestId('username');
    expect(username.textContent).toBe('');
  });

  it('refreshAccessToken met à jour les tokens', async () => {
    localStorage.setItem('refreshToken', 'R');

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'NEW',
        refreshToken: 'NEW_R'
      })
    });

    renderWithProvider();

    await act(async () => {
      screen.getByText('refresh').click();
    });

    expect(localStorage.getItem('accessToken')).toBe('NEW');
    expect(localStorage.getItem('refreshToken')).toBe('NEW_R');
  });

  it('authFetch ajoute Authorization', async () => {
    localStorage.setItem('accessToken', 'A');

    fetch.mockResolvedValueOnce({ status: 200 });

    renderWithProvider();

    await act(async () => {
      screen.getByText('fetch').click();
    });

    expect(fetch).toHaveBeenCalledWith('/test', expect.objectContaining({
      headers: expect.objectContaining({
        Authorization: 'Bearer A'
      })
    }));
  });
});
