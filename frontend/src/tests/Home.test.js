import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Home from '../pages/Home'; // ✅ Import placé en haut pour ESLint

// ✅ SOLUTION CI : Mock global complet pour isoler react-router-dom
// On ne fait plus de "requireActual" pour ne pas dépendre du module physique sur Ubuntu
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  // On remplace BrowserRouter par un simple conteneur
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

// Mock du fetch global
global.fetch = jest.fn();

describe('🏠 Page Home', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderHome = () =>
    render(
        <Home />
    );

  // ============================================================
  // 1. Loader
  // ============================================================
  it('affiche le loader au début', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    renderHome();

    expect(screen.getByText('...')).toBeTruthy();
  });

  // ============================================================
  // 2. Fetch réussi → compteur d’annonces
  // ============================================================
  it('affiche le nombre d’annonces après chargement', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [{ id: 1 }, { id: 2 }] })
    });

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('2 annonces')).toBeTruthy();
    });
  });

  // ============================================================
  // 3. Fetch en erreur → fallback à 0
  // ============================================================
  it('affiche 0 annonce en cas d’erreur API', async () => {
    fetch.mockRejectedValueOnce(new Error('network error'));

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('0 annonce')).toBeTruthy();
    });
  });

  // ============================================================
  // 4. Navigation : Voir les annonces
  // ============================================================
  it('navigue vers /annonces au clic', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    renderHome();

    const btn = screen.getByText(/voir les annonces/i);
    fireEvent.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith('/annonces');
  });

  // ============================================================
  // 5. Navigation : Créer un compte
  // ============================================================
  it('navigue vers /signup au clic', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    renderHome();

    const btn = screen.getByText(/créer un compte/i);
    fireEvent.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  // ============================================================
  // 6. Navigation : Rejoindre maintenant (CTA final)
  // ============================================================
  it('navigue vers /signup via le bouton CTA final', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    renderHome();

    const btn = screen.getByText(/rejoindre maintenant/i);
    fireEvent.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  // ============================================================
  // 7. Vérification du titre principal
  // ============================================================
  it('affiche le titre principal', () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    renderHome();

    expect(
      screen.getByText(/la maison/i)
    ).toBeTruthy();
  });

  // ============================================================
  // 8. Vérification de la section "Comment ça marche ?"
  // ============================================================
  it('affiche la section "Comment ça marche"', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    renderHome();

    expect(screen.getByText(/comment ça marche/i)).toBeTruthy();
    expect(screen.getByText(/créer ton profil/i)).toBeTruthy();
    expect(screen.getByText(/publier un objet/i)).toBeTruthy();
    expect(screen.getByText(/échanger et discuter/i)).toBeTruthy();
  });

  // ============================================================
  // 9. Vérification de la section CTA finale
  // ============================================================
  it('affiche la section CTA finale', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    renderHome();

    expect(screen.getByText(/prêt à entrer dans la maison/i)).toBeTruthy();
  });
});