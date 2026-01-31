import React, { useContext } from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { AuthContext, AuthProvider } from '../contexts/AuthContext';

/**
 * ============================================================================
 * TEST MÉTIER : SYSTÈME D'AUTHENTIFICATION (FRONTEND)
 * Objectif : Valider la gestion des jetons (JWT) et la persistance de session.
 * Technique : Mocking de l'API globale (fetch) pour isoler les tests du backend.
 * ============================================================================
 */

// Simulation de l'API fetch pour éviter des appels réels vers le tunnel Minikube
global.fetch = jest.fn();

describe('🛡️ Test Métier : AuthContext', () => {
  
  // Avant chaque test : on réinitialise les mocks et le stockage local pour repartir à neuf
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  /**
   * TEST 1 : Initialisation de l'état
   * Objectif : Vérifier que l'application démarre sans session active par défaut.
   */
  it('✅ Doit initialiser avec un utilisateur nul', () => {
    // Composant temporaire pour consommer le contexte pendant le test
    const TestComponent = () => {
      const { user } = useContext(AuthContext);
      return <div data-testid="user">{user ? 'present' : 'null'}</div>;
    };

    const { getByTestId } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    
    expect(getByTestId('user').textContent).toBe('null');
  });

  /**
   * TEST 2 : Cycle de connexion (Login)
   * Objectif : Valider que le succès de l'API met à jour le State et le LocalStorage.
   */
  it('✅ Doit gérer le login avec succès', async () => {
    // 1. Définition des données simulées (Payload API)
    const fakeUser = { id: 1, username: 'Bakary' };
    const fakeResponse = {
      accessToken: 'access-123',
      refreshToken: 'refresh-456',
      user: fakeUser
    };

    // 2. Mocking de la réponse réussie de l'API Minikube
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

    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // 3. Déclenchement de l'action utilisateur
    act(() => {
      getByText('Guest').click();
    });

    // 4. ASSERTIONS : On vérifie la persistance et la mise à jour de l'UI
    await waitFor(() => {
      // Vérifie que le token est bien stocké dans le navigateur
      expect(localStorage.getItem('accessToken')).toBe('access-123');
      // Vérifie que le nom de l'utilisateur s'affiche bien à l'écran
      expect(getByText('Bakary')).toBeTruthy();
    });
  });
});