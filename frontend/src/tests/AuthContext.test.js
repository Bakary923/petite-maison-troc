import React, { useContext } from 'react';
import { render, act, waitFor, screen } from '@testing-library/react';
import { AuthContext, AuthProvider } from '../contexts/AuthContext';

/**
 * TEST MÉTIER : AUTHCONTEXT (FRONTEND)
 * ✅ Conformité ESLint : Utilisation de l'objet 'screen' pour les requêtes DOM.
 */
global.fetch = jest.fn();

describe('🛡️ Test Métier : AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('✅ Doit initialiser avec un utilisateur nul', () => {
    const TestComponent = () => {
      const { user } = useContext(AuthContext);
      return <div data-testid="user">{user ? 'present' : 'null'}</div>;
    };

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    // Utilisation de screen pour une meilleure accessibilité
    expect(screen.getByTestId('user').textContent).toBe('null');
  });

  it('✅ Doit gérer le login avec succès', async () => {
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

    // ✅ Règle ESLint : Une seule assertion logique par waitFor pour la stabilité
    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('access-123');
    });
    
    expect(screen.getByText('Bakary')).toBeTruthy();
  });
});