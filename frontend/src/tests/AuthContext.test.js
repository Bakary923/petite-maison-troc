import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../contexts/AuthContext';

global.fetch = jest.fn();

function TestComponent() {
  const { user, accessToken, login, logout, register, authFetch } = React.useContext(AuthContext);
  
  const handleLogin = async () => {
    try { await login({ email: 't@t.com', password: '1' }); } catch (e) {}
  };

  const handleAuthFetch = async () => {
    try { await authFetch('/api/test'); } catch (e) {}
  };

  return (
    <div>
      <div data-testid="user">{user ? user.username : 'guest'}</div>
      <div data-testid="token">{accessToken || 'no-token'}</div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={() => logout()}>Logout</button>
      <button onClick={() => register({ username: 'Baka', email: 'b@b.com' })}>Register</button>
      <button onClick={handleAuthFetch}>AuthFetch</button>
    </div>
  );
}

describe('🔐 AuthContext - Couverture Totale', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('✅ État initial : guest et no-token', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    expect(screen.getByTestId('user').textContent).toBe('guest');
  });

  // --- TESTS DE LOGIN ---
  it('✅ Login réussi : stocke les tokens', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'at', refreshToken: 'rt', user: { username: 'Baka' } })
    });
    render(<AuthProvider><TestComponent /></AuthProvider>);
    fireEvent.click(screen.getByText('Login'));
    await waitFor(() => expect(localStorage.getItem('accessToken')).toBe('at'));
  });

  it('❌ Login échoué : lève une erreur (Couvre le bloc catch)', async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: 'Identifiants invalides' })
    });
    render(<AuthProvider><TestComponent /></AuthProvider>);
    fireEvent.click(screen.getByText('Login'));
    
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    // Le texte reste 'guest' car le login a échoué
    expect(screen.getByTestId('user').textContent).toBe('guest');
  });

  // --- TESTS DE LOGOUT ---
  it('✅ Logout : nettoie le localStorage', async () => {
    localStorage.setItem('accessToken', 'at');
    render(<AuthProvider><TestComponent /></AuthProvider>);
    fireEvent.click(screen.getByText('Logout'));
    await waitFor(() => expect(localStorage.getItem('accessToken')).toBeNull());
  });

  // --- TESTS DE REFRESH TOKEN ---
  it('✅ authFetch : rafraîchit le token si 401 et relance la requête', async () => {
    localStorage.setItem('accessToken', 'expired_token');
    localStorage.setItem('refreshToken', 'valid_refresh');

    fetch.mockResolvedValueOnce({ status: 401, ok: false }); // 401 initial
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ accessToken: 'new_at' }) }); // Refresh success
    fetch.mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ data: 'ok' }) }); // Retry success

    render(<AuthProvider><TestComponent /></AuthProvider>);
    fireEvent.click(screen.getByText('AuthFetch'));

    await waitFor(() => expect(localStorage.getItem('accessToken')).toBe('new_at'));
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('❌ authFetch : déconnecte si le refresh échoue', async () => {
    localStorage.setItem('accessToken', 'expired');
    localStorage.setItem('refreshToken', 'bad_refresh');

    fetch.mockResolvedValueOnce({ status: 401, ok: false }); // 401
    fetch.mockResolvedValueOnce({ ok: false }); // Refresh fails (ex: throw session expirée)

    render(<AuthProvider><TestComponent /></AuthProvider>);
    fireEvent.click(screen.getByText('AuthFetch'));

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBeNull();
    });
  });

  // --- TEST REGISTER ---
  it('✅ Register réussi', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ accessToken: 'reg', user: { username: 'Baka' } })
    });
    render(<AuthProvider><TestComponent /></AuthProvider>);
    fireEvent.click(screen.getByText('Register'));
    await waitFor(() => expect(screen.getByTestId('user').textContent).toBe('Baka'));
  });
});