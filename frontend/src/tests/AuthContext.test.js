import React, { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, AuthContext } from '../contexts/AuthContext';

// On mocke fetch pour simuler l'API
global.fetch = jest.fn();

const TestComponent = () => {
  const { user, login, logout, accessToken } = useContext(AuthContext);
  return (
    <div>
      <div data-testid="user">{user ? user.username : 'guest'}</div>
      <div data-testid="token">{accessToken || 'no-token'}</div>
      <button onClick={() => login({ email: 'test@test.com', password: 'password' })}>Login</button>
      <button onClick={() => logout()}>Logout</button>
    </div>
  );
};

describe('🛡️ AuthContext Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('✅ Doit initialiser avec guest et sans token', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    expect(screen.getByTestId('user').textContent).toBe('guest');
    expect(screen.getByTestId('token').textContent).toBe('no-token');
  });

  it('✅ Doit stocker les jetons après un login réussi', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'fake-access-token',
        refreshToken: 'fake-refresh-token',
        user: { username: 'Bakary' }
      })
    });

    render(<AuthProvider><TestComponent /></AuthProvider>);
    screen.getByText('Login').click();

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('fake-access-token');
      expect(screen.getByTestId('user').textContent).toBe('Bakary');
    });
  });

  it('✅ Doit nettoyer le localStorage au logout', async () => {
    localStorage.setItem('accessToken', 'token-a-effacer');
    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    screen.getByText('Logout').click();

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBeNull();
      expect(screen.getByTestId('user').textContent).toBe('guest');
    });
  });
});