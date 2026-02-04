import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Home from '../pages/Home';

// ============================================================
// 🧪 MOCK DU NAVIGATE
// ------------------------------------------------------------
// On surcharge uniquement useNavigate, le reste est mocké via
// __mocks__/react-router-dom.js (déjà présent dans ton projet).
// ============================================================
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

// ============================================================
// 🧪 MOCK DU FETCH GLOBAL
// ------------------------------------------------------------
// Home.js utilise fetch() directement dans useEffect.
// On doit donc le mocker pour contrôler la réponse.
// ============================================================
global.fetch = jest.fn();

describe('🏠 Page Home', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------
  // 1) TEST : Affichage du compteur d’annonces
  // ---------------------------------------------------------
  it('affiche le nombre d’annonces récupéré depuis l’API', async () => {
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

  // ---------------------------------------------------------
  // 2) TEST : Gestion d’erreur → fallback à 0 annonce
  // ---------------------------------------------------------
  it('affiche 0 annonce en cas d’erreur réseau', async () => {
    // Simule une erreur réseau
    fetch.mockRejectedValueOnce(new Error('Network error'));

    render(<Home />);

    // Badge initial
    expect(screen.getByText('...')).toBeInTheDocument();

    // Après erreur → fallback à "0 annonce"
    await waitFor(() => {
      expect(screen.getByText(/0 annonce/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------
  // 3) TEST : Navigation vers /annonces
  // ---------------------------------------------------------
  it('redirige vers /annonces quand on clique sur Voir les annonces', async () => {
    // Mock d’une réponse API vide
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    render(<Home />);

    fireEvent.click(screen.getByText(/voir les annonces/i));

    expect(mockNavigate).toHaveBeenCalledWith('/annonces');
  });

  // ---------------------------------------------------------
  // 4) TEST : Navigation vers /signup
  // ---------------------------------------------------------
  it('redirige vers /signup quand on clique sur Créer un compte', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    render(<Home />);

    fireEvent.click(screen.getByText(/créer un compte/i));

    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });
});
