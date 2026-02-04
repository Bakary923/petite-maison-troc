import React, { useContext } from 'react';
import { render, screen, waitFor } from '@testing-library/react'; // ✅ waitFor ajouté ici
import { AuthProvider, AuthContext } from '../contexts/AuthContext';

// ✅ Mock global de fetch pour simuler les appels API (Login, Refresh, etc.)
global.fetch = jest.fn();

/**
 * Composant de test interne pour accéder au contexte
 */
const TestComponent = () => {
  const ctx = useContext(AuthContext);
  return (
    <div>
      <button onClick={() => ctx.login({ email: 'a', password: 'b' })}>login</button>
      <button onClick={() => ctx.logout()}>logout</button>
      {/* Vérification sécurisée de l'existence de la fonction */}
      <button onClick={() => ctx.refreshAccessToken && ctx.refreshAccessToken()}>refresh</button>
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

/**
 * TEST MÉTIER : Authentification & Persistance
 * Objectif : 
 * - Vérifier le stockage LocalStorage (Sécurité)
 * - Valider le cycle de vie du token JWT
 */
describe('🛡️ AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  // 1. Connexion (Login)
  it('login stocke les tokens et le user dans le localStorage', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'A',
        refreshToken: 'R',
        user: { username: 'bob' }
      })
    });

    renderWithProvider();

    // ✅ ESLint : Pas de act() autour de click(), c'est automatique
    screen.getByText('login').click();

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe('A');
    });
    expect(localStorage.getItem('refreshToken')).toBe('R');

    const username = await screen.findByTestId('username');
    expect(username.textContent).toBe('bob');
  });

  // 2. Déconnexion (Logout)
  it('logout nettoie tout le stockage local', async () => {
    localStorage.setItem('accessToken', 'A');
    localStorage.setItem('refreshToken', 'R');
    localStorage.setItem('user', JSON.stringify({ username: 'bob' }));

    renderWithProvider();

    screen.getByText('logout').click();

    await waitFor(() => {
      expect(localStorage.getItem('accessToken')).toBe(null);
    });
    expect(localStorage.getItem('refreshToken')).toBe(null);
    expect(localStorage.getItem('user')).toBe(null);

    const username = await screen.findByTestId('username');
    expect(username.textContent).toBe('');
  });

  // 3. Rafraîchissement (Token Refresh)
  it('refreshAccessToken met à jour les tokens JWT', async () => {
    localStorage.setItem('refreshToken', 'R');

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'NEW',
        refreshToken: 'NEW_R'
      })
    });

    renderWithProvider();

    screen.getByText('refresh').click();

    // ✅ Attente que les effets du contexte se terminent
    await waitFor(() => {
        expect(localStorage.getItem('accessToken')).toBe('NEW');
    });
    expect(localStorage.getItem('refreshToken')).toBe('NEW_R');
  });

  // 4. Fetch Sécurisé (authFetch)
  it('authFetch ajoute le header Authorization Bearer', async () => {
    localStorage.setItem('accessToken', 'A');

    fetch.mockResolvedValueOnce({ status: 200, ok: true, json: async () => ({}) });

    renderWithProvider();

    screen.getByText('fetch').click();

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/test'), expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer A'
        })
      }));
    });
  });
});