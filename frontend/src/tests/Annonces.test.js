import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import Annonces from '../pages/annonces';

// ============================================================
// 🧪 MOCK DU NAVIGATE
// ============================================================
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// ============================================================
// 🧪 MOCK DU FETCH GLOBAL (annonces publiques)
// ============================================================
global.fetch = jest.fn();

describe('📦 Page Annonces', () => {
  const mockAuthFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------
  // 1) TEST : Chargement des annonces publiques
  // ---------------------------------------------------------
  it('charge et affiche les annonces publiques', async () => {
    // Mock du fetch public
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonces: [
          { id: 1, titre: 'Vélo', description: 'Bleu', username: 'Bob', created_at: new Date().toISOString() }
        ]
      })
    });

    // Mock du fetch privé (retourne vide)
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    render(
      <AuthContext.Provider value={{ user: { id: 1 }, authFetch: mockAuthFetch, accessToken: 'tok' }}>
        <Annonces />
      </AuthContext.Provider>
    );

    // Attendre la fin du chargement
    await waitFor(() => {
      expect(screen.getByText(/vélo/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------
  // 2) TEST : Chargement des annonces personnelles
  // ---------------------------------------------------------
  it('charge et affiche mes annonces', async () => {
    // Mock public
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    // Mock privé
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonces: [
          { id: 10, titre: 'Chaise', description: 'Bois', user_id: 1, username: 'Bakary', created_at: new Date().toISOString() }
        ]
      })
    });

    render(
      <AuthContext.Provider value={{ user: { id: 1 }, authFetch: mockAuthFetch, accessToken: 'tok' }}>
        <Annonces />
      </AuthContext.Provider>
    );

    // Cliquer sur l’onglet "Mes annonces"
    fireEvent.click(screen.getByText(/mes annonces/i));

    await waitFor(() => {
      expect(screen.getByText(/chaise/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------
  // 3) TEST : Changement d’onglet
  // ---------------------------------------------------------
  it('change d’onglet entre public et mes annonces', async () => {
    // Mock public
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonces: [
          { id: 1, titre: 'Livre', description: 'Roman', username: 'Alice', created_at: new Date().toISOString() }
        ]
      })
    });

    // Mock privé
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonces: [
          { id: 2, titre: 'Lampe', description: 'LED', user_id: 1, username: 'Bakary', created_at: new Date().toISOString() }
        ]
      })
    });

    render(
      <AuthContext.Provider value={{ user: { id: 1 }, authFetch: mockAuthFetch, accessToken: 'tok' }}>
        <Annonces />
      </AuthContext.Provider>
    );

    // Attendre l’affichage public
    await waitFor(() => {
      expect(screen.getByText(/livre/i)).toBeInTheDocument();
    });

    // Passer à mes annonces
    fireEvent.click(screen.getByText(/mes annonces/i));

    await waitFor(() => {
      expect(screen.getByText(/lampe/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------
  // 4) TEST : Bouton "Créer une annonce"
  // ---------------------------------------------------------
  it('redirige vers /create-annonce', async () => {
    // Mock public
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    // Mock privé
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    render(
      <AuthContext.Provider value={{ user: { id: 1 }, authFetch: mockAuthFetch, accessToken: 'tok' }}>
        <Annonces />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText(/\+ créer une annonce/i));

    expect(mockNavigate).toHaveBeenCalledWith('/create-annonce');
  });
});
