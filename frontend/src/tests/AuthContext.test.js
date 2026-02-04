import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../contexts/AuthContext';

global.fetch = jest.fn();

//
// Petit composant de test pour accéder facilement au contexte
//
function TestComponent() {
  const { user, accessToken, login, logout, register, authFetch } =
    React.useContext(AuthContext);

  return (
    <div>
      <div data-testid="user">{user ? user.username : 'guest'}</div>
      <div data-testid="token">{accessToken || 'no-token'}</div>

      <button onClick={() => login({ email: 'test@test.com', password: 'pass' })}>
        Login
      </button>

      <button onClick={() => logout()}>
        Logout
      </button>

      <button
        onClick={() =>
          register({ username: 'Baka', email: 'b@b.com', password: '123' })
        }
      >
        Register
      </button>

      <button
        onClick={() =>
          authFetch('/api/test', { method: 'GET' })
        }
      >
        AuthFetch
      </button>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // ----------------------------------------------------------
  // 1) ÉTAT INITIAL
  // ----------------------------------------------------------
  it('initialise correctement avec guest et no-token', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user').textContent).toBe('guest');
    expect(screen.getByTestId('token').textContent).toBe('no-token');
  });

  // ----------------------------------------------------------
  // 2) LOGIN
  // ----------------------------------------------------------
  it('met à jour les tokens et user après login', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'abc123',
        refreshToken: 'ref123',
        user: { username: 'Bakary' }
      })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Login'));

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('abc123');
    });

    expect(screen.getByTestId('user').textContent).toBe('Bakary');
    expect(screen.getByTestId('token').textContent).toBe('abc123');
  });

  // ----------------------------------------------------------
  // 3) LOGOUT
  // ----------------------------------------------------------
  it('nettoie tout au logout', async () => {
    localStorage.setItem('accessToken', 'tok');
    localStorage.setItem('refreshToken', 'ref');
    localStorage.setItem('user', JSON.stringify({ username: 'X' }));

    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Logout'));

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBeNull();
    });

    expect(screen.getByTestId('user').textContent).toBe('guest');
    expect(screen.getByTestId('token').textContent).toBe('no-token');
  });

  // ----------------------------------------------------------
  // 4) REGISTER
  // ----------------------------------------------------------
  it('crée un compte et stocke les tokens', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'newTok',
        refreshToken: 'newRef',
        user: { username: 'Baka' }
      })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Register'));

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('newTok');
    });

    expect(screen.getByTestId('user').textContent).toBe('Baka');
  });

  // ----------------------------------------------------------
  // 5) AUTHFETCH avec token valide
  // ----------------------------------------------------------
  it('envoie Authorization dans authFetch', async () => {
    localStorage.setItem('accessToken', 'tok123');

    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true })
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('AuthFetch'));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    const call = fetch.mock.calls[0];
    expect(call[1].headers.Authorization).toBe('Bearer tok123');
  });
});
