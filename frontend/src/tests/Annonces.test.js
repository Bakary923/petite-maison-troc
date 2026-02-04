import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import Annonces from '../pages/Annonces';

// Mock navigate()
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// Mock fetch public
global.fetch = jest.fn();

describe('📦 Page Annonces', () => {
  const mockAuthFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------
  // Helper : attendre la fin du chargement
  // ---------------------------------------------------------
  async function waitForLoaded() {
    await waitFor(() => {
      expect(screen.queryByText(/chargement des annonces/i)).not.toBeInTheDocument();
    });
  }

  // ---------------------------------------------------------
  // 1) Public annonces
  // ---------------------------------------------------------
  it('affiche les annonces publiques', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonces: [{ id: 1, titre: 'Vélo', description: 'Bleu', username: 'Bob', created_at: new Date().toISOString() }]
      })
    });

    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    render(
      <AuthContext.Provider value={{ user: { id: 1 }, authFetch: mockAuthFetch, accessToken: 'tok' }}>
        <Annonces />
      </AuthContext.Provider>
    );

    await waitForLoaded();

    expect(screen.getByText(/vélo/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------
  // 2) Mes annonces
  // ---------------------------------------------------------
  it('affiche mes annonces après clic sur l’onglet', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonces: [{ id: 10, titre: 'Chaise', description: 'Bois', user_id: 1, username: 'Bakary', created_at: new Date().toISOString() }]
      })
    });

    render(
      <AuthContext.Provider value={{ user: { id: 1 }, authFetch: mockAuthFetch, accessToken: 'tok' }}>
        <Annonces />
      </AuthContext.Provider>
    );

    await waitForLoaded();

    fireEvent.click(screen.getByText(/mes annonces/i));

    expect(screen.getByText(/chaise/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------
  // 3) Navigation vers création
  // ---------------------------------------------------------
  it('redirige vers /create-annonce', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    render(
      <AuthContext.Provider value={{ user: { id: 1 }, authFetch: mockAuthFetch, accessToken: 'tok' }}>
        <Annonces />
      </AuthContext.Provider>
    );

    await waitForLoaded();

    fireEvent.click(screen.getByText(/\+ créer une annonce/i));

    expect(mockNavigate).toHaveBeenCalledWith('/create-annonce');
  });
});
