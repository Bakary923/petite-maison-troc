import React, { useContext } from 'react';
import { render, act, waitFor, screen } from '@testing-library/react';
import { AuthContext, AuthProvider } from '../contexts/AuthContext';

/**
 * TEST MÉTIER : AuthContext (FRONTEND)
 *
 * Objectif :
 * - Vérifier l'initialisation du contexte utilisateur
 * - Valider le login et le stockage des tokens dans localStorage
 * ✅ Conformité CI : Compatible Node/Jest, sans BrowserRouter
 * ✅ Conformité ESLint : Utilisation de `screen` pour les requêtes DOM
 */
global.fetch = jest.fn();

describe('🛡️ AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('✅ Initialise avec un utilisateur nul', () => {
    const TestComponent = () => {
      const { user } = useContext(AuthContext);
      return <div data-testid="user">{user ? 'present' : 'null'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('✅ Gère correctement le login avec succès', async () => {
    const fakeUser = { id: 1, username: 'Bakary' };
    const fakeResponse = { accessToken: 'access-123', refreshToken: 'refresh-456', user: fakeUser };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => fakeResponse,
    });

    const TestComponent = () => {
      const { login, user } = useContext(AuthContext);
      return (
        <button onClick={() => login({ email: 'test@test.com', password: 'password' })}>
          {user ? user.username : 'Guest'}
        </button>
      );
    };

    render(<AuthProvider><TestComponent /></AuthProvider>);

    act(() => { screen.getByText('Guest').click(); });

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('access-123');
    });
    
    expect(screen.getByText('Bakary')).toBeTruthy();
  });
});
