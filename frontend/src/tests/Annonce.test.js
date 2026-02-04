import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import Annonces from '../pages/Annonces'; // ✅ Import remonté ici

// ✅ MOCK GLOBAL : Isolation de react-router-dom pour la CI
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }) => <div>{children}</div>
}));

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
        annonces: [{ id: 1, titre: 'Annonce A', description: 'Desc A', username: 'Bob' }]
      })
    });
    renderWithContext();
    // ✅ ESLint : findByText est plus performant que waitFor + getBy
    expect(await screen.findByText('Annonce A')).toBeTruthy();
  });

  // ============================================================
  // 7. Edition d’une annonce
  // ============================================================
  it('permet de modifier une annonce', async () => {
    fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ annonces: [{ id: 1, titre: 'Old', description: 'Old desc', user_id: 1 }] }) });
    mockAuthFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ annonces: [{ id: 1, titre: 'Old', description: 'Old desc', user_id: 1 }] }) });
    mockAuthFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ annonce: { id: 1, titre: 'New', description: 'New desc', user_id: 1 } }) });

    renderWithContext({ id: 1, username: 'bob' }, 'token');
    expect(await screen.findByText('Old')).toBeTruthy();

    fireEvent.click(screen.getByText(/modifier/i));
    fireEvent.change(screen.getByDisplayValue('Old'), { target: { value: 'New' } });
    fireEvent.change(screen.getByDisplayValue('Old desc'), { target: { value: 'New desc' } });
    fireEvent.click(screen.getByText(/sauvegarder/i));

    expect(await screen.findByText('New')).toBeTruthy();
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
    expect(await screen.findByText('A supprimer')).toBeTruthy();

    fireEvent.click(screen.getByText(/supprimer/i));
    await waitFor(() => expect(screen.queryByText('A supprimer')).toBeNull());
  });
});