import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from '../pages/AdminDashboard';

// ============================================================
// 🧪 MOCK AdminCard
// ------------------------------------------------------------
// On évite de rendre le vrai composant (trop complexe).
// On affiche juste un placeholder simple.
// ============================================================
jest.mock('../components/AdminCard', () => ({ annonce }) => (
  <div data-testid="admin-card">{annonce.titre}</div>
));

// ============================================================
// 🧪 MOCK authFetch
// ============================================================
const mockAuthFetch = jest.fn();

describe('🔐 AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------
  // 1) Accès refusé si user n’est pas admin
  // ---------------------------------------------------------
  it('affiche un message d’accès refusé si user non admin', () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'user' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/accès refusé/i)).toBeInTheDocument();
    expect(screen.getByText(/vous devez être administrateur/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------
  // 2) Chargement des annonces admin
  // ---------------------------------------------------------
  it('charge et affiche les annonces admin', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, titre: 'Annonce A' },
        { id: 2, titre: 'Annonce B' }
      ]
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin', username: 'Bakary' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    // Attendre la fin du chargement
    await waitFor(() => {
      expect(screen.getByText(/annonce a/i)).toBeInTheDocument();
      expect(screen.getByText(/annonce b/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------
  // 3) Changement de filtre (pending → validated → rejected → all)
  // ---------------------------------------------------------
  it('rappelle authFetch quand on change de filtre', async () => {
    // Réponse initiale
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    // Attendre le premier fetch
    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalled();
    });

    // Cliquer sur "Validées"
    fireEvent.click(screen.getByText(/validées/i));

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledTimes(2);
    });

    // Cliquer sur "Rejetées"
    fireEvent.click(screen.getByText(/rejetées/i));

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledTimes(3);
    });

    // Cliquer sur "Toutes"
    fireEvent.click(screen.getByText(/toutes/i));

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledTimes(4);
    });
  });

  // ---------------------------------------------------------
  // 4) Affichage de l’état vide
  // ---------------------------------------------------------
  it('affiche un état vide si aucune annonce', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/aucune annonce trouvée/i)).toBeInTheDocument();
    });
  });
});
