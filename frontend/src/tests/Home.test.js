// ============================================================================
// 🧪 TESTS DE LA PAGE HOME
// ----------------------------------------------------------------------------
// Ce fichier teste :
//  - le compteur d’annonces
//  - la gestion d’erreur réseau
//  - la navigation (useNavigate)
//  - l’affichage conditionnel selon connexion (useAuth)
//  - le CTA dynamique
// ============================================================================

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Home from '../pages/Home';
import { useAuth } from '../contexts/AuthContext';

// ============================================================================
// 🧪 MOCK DU NAVIGATE (react-router-dom)
// ----------------------------------------------------------------------------
// On remplace useNavigate par une fonction mockée pour vérifier les redirections
// ============================================================================
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// ============================================================================
// 🧪 MOCK DU CONTEXT AUTH
// ----------------------------------------------------------------------------
// Home.jsx utilise useAuth() → on le mocke pour simuler connecté / non connecté
// ============================================================================
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

// ============================================================================
// 🧪 MOCK DU FETCH GLOBAL
// ----------------------------------------------------------------------------
// Home.jsx utilise fetch() dans useEffect → on le mocke pour contrôler la réponse
// ============================================================================
global.fetch = jest.fn();

// ============================================================================
// 🧪 SUITE DE TESTS
// ============================================================================
describe('🏠 Page Home', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // reset des mocks avant chaque test
  });

  // --------------------------------------------------------------------------
  // 1) TEST : Affichage du compteur d’annonces
  // --------------------------------------------------------------------------
  it('affiche le nombre d’annonces récupéré depuis l’API', async () => {
    useAuth.mockReturnValue({ user: null }); // utilisateur non connecté

    // Simule une réponse API contenant 3 annonces
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonces: [{ id: 1 }, { id: 2 }, { id: 3 }]
      })
    });

    render(<Home />);

    // Pendant le chargement → badge affiche "..."
    expect(screen.getByText('...')).toBeInTheDocument();

    // Après le fetch → badge affiche "3 annonces"
    await waitFor(() => {
      expect(screen.getByText(/3 annonces/i)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 2) TEST : Gestion d’erreur → fallback à 0 annonce
  // --------------------------------------------------------------------------
  it('affiche 0 annonce en cas d’erreur réseau', async () => {
    useAuth.mockReturnValue({ user: null });

    // Simule une erreur réseau
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Home />);

    expect(screen.getByText('...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/0 annonce/i)).toBeInTheDocument();
    });
  });

  // --------------------------------------------------------------------------
  // 3) TEST : Navigation vers /annonces
  // --------------------------------------------------------------------------
  it('redirige vers /annonces quand on clique sur Voir les annonces', async () => {
    useAuth.mockReturnValue({ user: null });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    render(<Home />);

    fireEvent.click(screen.getByText(/voir les annonces/i));

    expect(mockNavigate).toHaveBeenCalledWith('/annonces');
  });

  // --------------------------------------------------------------------------
  // 4) TEST : Navigation vers /signup (si NON connecté)
  // --------------------------------------------------------------------------
  it('redirige vers /signup quand on clique sur Créer un compte (non connecté)', async () => {
    useAuth.mockReturnValue({ user: null });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    render(<Home />);

    fireEvent.click(screen.getByText(/créer un compte/i));

    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  // --------------------------------------------------------------------------
  // 5) TEST : "Créer un compte" n’apparaît PAS si connecté
  // --------------------------------------------------------------------------
  it('ne montre pas "Créer un compte" si utilisateur connecté', async () => {
    useAuth.mockReturnValue({ user: { id: 1 } });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    render(<Home />);

    expect(screen.queryByText(/créer un compte/i)).toBeNull();
  });

  // --------------------------------------------------------------------------
  // 6) TEST : "Créer une annonce" apparaît si connecté
  // --------------------------------------------------------------------------
  it('affiche "Créer une annonce" si utilisateur connecté', async () => {
    useAuth.mockReturnValue({ user: { id: 1 } });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    render(<Home />);

    expect(screen.getByText(/créer une annonce/i)).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // 7) TEST : CTA → "Voir mes annonces" si connecté
  // --------------------------------------------------------------------------
  it('affiche "Voir mes annonces" dans le CTA si connecté', async () => {
    useAuth.mockReturnValue({ user: { id: 1 } });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    render(<Home />);

    expect(screen.getByText(/voir mes annonces/i)).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // 8) TEST : CTA → "Rejoindre maintenant" si NON connecté
  // --------------------------------------------------------------------------
  it('affiche "Rejoindre maintenant" si non connecté', async () => {
    useAuth.mockReturnValue({ user: null });

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    render(<Home />);

    expect(screen.getByText(/rejoindre maintenant/i)).toBeInTheDocument();
  });
});
