import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Annonces from '../pages/Annonces';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock global fetch
global.fetch = jest.fn();

// Mock navigate()
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('📦 Page Annonces', () => {

  const mockAuthFetch = jest.fn();

  const renderWithContext = (user = null, accessToken = null) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user, authFetch: mockAuthFetch, accessToken }}>
          <Annonces />
        </AuthContext.Provider>
      </BrowserRouter>
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
    // Public
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    // Privé
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
    // Public
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    // Privé
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
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    renderWithContext({ id: 1, username: 'bob' }, 'token');

    const btn = screen.getByText(/\+ créer une annonce/i);
    fireEvent.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith('/create-annonce');
  });

  // ============================================================
  // 7. Edition d’une annonce
  // ============================================================
  it('permet de modifier une annonce', async () => {
    // Public
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonces: [{ id: 1, titre: 'Old', description: 'Old desc', user_id: 1 }]
      })
    });

    // Privé
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonces: [{ id: 1, titre: 'Old', description: 'Old desc', user_id: 1 }]
      })
    });

    // PUT
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonce: { id: 1, titre: 'New', description: 'New desc', user_id: 1 }
      })
    });

    renderWithContext({ id: 1, username: 'bob' }, 'token');

    await waitFor(() => {
      expect(screen.getByText('Old')).toBeTruthy();
    });

    fireEvent.click(screen.getByText(/modifier/i));

    const titreInput = screen.getByDisplayValue('Old');
    fireEvent.change(titreInput, { target: { value: 'New' } });

    const descInput = screen.getByDisplayValue('Old desc');
    fireEvent.change(descInput, { target: { value: 'New desc' } });

    fireEvent.click(screen.getByText(/sauvegarder/i));

    await waitFor(() => {
      expect(screen.getByText('New')).toBeTruthy();
    });
  });

  // ============================================================
  // 8. Suppression d’une annonce
  // ============================================================
  it('supprime une annonce', async () => {
    window.confirm = jest.fn(() => true);

    // Public
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonces: [{ id: 1, titre: 'A supprimer', description: '...' }]
      })
    });

    // Privé
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonces: [{ id: 1, titre: 'A supprimer', description: '...' }]
      })
    });

    // DELETE
    mockAuthFetch.mockResolvedValueOnce({ ok: true });

    renderWithContext({ id: 1, username: 'bob' }, 'token');

    await waitFor(() => {
      expect(screen.getByText('A supprimer')).toBeTruthy();
    });

    fireEvent.click(screen.getByText(/supprimer/i));

    await waitFor(() => {
      expect(screen.queryByText('A supprimer')).toBeNull();
    });
  });
});
