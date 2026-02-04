import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';

// ✅ MOCK GLOBAL : Isolation de react-router-dom pour la CI
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }) => <div>{children}</div>
}));

import Annonces from '../pages/Annonces';

// Mock global fetch
global.fetch = jest.fn();

describe('📦 Page Annonces', () => {

  const mockAuthFetch = jest.fn();

  const renderWithContext = (user = null, accessToken = null) => {
    return render(
      <AuthContext.Provider value={{ user, authFetch: mockAuthFetch, accessToken }}>
        <Annonces />
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // 1. Loader
  // ============================================================
  it('affiche le loader au début', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    renderWithContext();

    expect(screen.getByText(/chargement des annonces/i)).toBeTruthy();
  });

  // ============================================================
  // 2. Chargement des annonces publiques
  // ============================================================
  it('charge et affiche les annonces publiques', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonces: [
          { id: 1, titre: 'Annonce A', description: 'Desc A', username: 'Bob' }
        ]
      })
    });

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText('Annonce A')).toBeTruthy();
    });
  });

  // ============================================================
  // 3. Erreur API → message d’erreur
  // ============================================================
  it('affiche une erreur si le fetch public échoue', async () => {
    fetch.mockRejectedValueOnce(new Error('Erreur chargement'));

    renderWithContext();

    await waitFor(() => {
      expect(screen.getByText(/erreur/i)).toBeTruthy();
    });
  });

  // ============================================================
  // 4. Chargement des annonces privées (user connecté)
  // ============================================================
  it('charge mes annonces si user connecté', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ annonces: [] }) });
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonces: [{ id: 10, titre: 'Mon annonce', description: 'Privée' }]
      })
    });

    renderWithContext({ id: 1, username: 'bob', role: 'user' }, 'validToken');

    await waitFor(() => {
      expect(screen.getByText('Mon annonce')).toBeTruthy();
    });
  });

  // ============================================================
  // 5. Changement d’onglet
  // ============================================================
  it('change d’onglet et affiche mes annonces', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ annonces: [] }) });
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonces: [{ id: 99, titre: 'Annonce privée', description: '...' }]
      })
    });

    renderWithContext({ id: 1, username: 'bob', role: 'user' }, 'validToken');
    const tab = screen.getByText(/mes annonces/i);
    fireEvent.click(tab);

    await waitFor(() => {
      expect(screen.getByText('Annonce privée')).toBeTruthy();
    });
  });

  // ============================================================
  // 6. Bouton "Créer une annonce"
  // ============================================================
  it('navigue vers /create-annonce au clic', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ annonces: [] }) });
    renderWithContext({ id: 1, username: 'bob' }, 'token');
    const btn = screen.getByText(/\+ créer une annonce/i);
    fireEvent.click(btn);
    expect(mockNavigate).toHaveBeenCalledWith('/create-annonce');
  });

  // ============================================================
  // 7. Edition d’une annonce
  // ============================================================
  it('permet de modifier une annonce', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ annonces: [{ id: 1, titre: 'Old', description: 'Old desc', user_id: 1 }] }) });
    mockAuthFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ annonces: [{ id: 1, titre: 'Old', description: 'Old desc', user_id: 1 }] }) });
    mockAuthFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ annonce: { id: 1, titre: 'New', description: 'New desc', user_id: 1 } }) });

    renderWithContext({ id: 1, username: 'bob' }, 'token');
    await waitFor(() => expect(screen.getByText('Old')).toBeTruthy());

    fireEvent.click(screen.getByText(/modifier/i));
    fireEvent.change(screen.getByDisplayValue('Old'), { target: { value: 'New' } });
    fireEvent.change(screen.getByDisplayValue('Old desc'), { target: { value: 'New desc' } });
    fireEvent.click(screen.getByText(/sauvegarder/i));

    await waitFor(() => expect(screen.getByText('New')).toBeTruthy());
  });

  // ============================================================
  // 8. Suppression d’une annonce
  // ============================================================
  it('supprime une annonce', async () => {
    window.confirm = jest.fn(() => true);
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ annonces: [{ id: 1, titre: 'A supprimer', description: '...' }] }) });
    mockAuthFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ annonces: [{ id: 1, titre: 'A supprimer', description: '...' }] }) });
    mockAuthFetch.mockResolvedValueOnce({ ok: true });

    renderWithContext({ id: 1, username: 'bob' }, 'token');
    await waitFor(() => expect(screen.getByText('A supprimer')).toBeTruthy());

    fireEvent.click(screen.getByText(/supprimer/i));
    await waitFor(() => expect(screen.queryByText('A supprimer')).toBeNull());
  });
});