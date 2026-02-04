import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from '../pages/AdminDashboard';

// ============================================================
// 🧪 MOCK AdminCard
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
  // 1) Accès refusé si user non admin
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
  // 2) Chargement et affichage des annonces admin
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

    // ✔️ findByText remplace waitFor + getByText
    expect(await screen.findByText(/annonce a/i)).toBeInTheDocument();
    expect(await screen.findByText(/annonce b/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------
  // 3) Changement de filtre
  // ---------------------------------------------------------
  it('rappelle authFetch quand on change de filtre', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    // ✔️ findByText pour attendre le premier rendu
    await screen.findByText(/toutes/i);

    // Validées
    fireEvent.click(screen.getByText(/validées/i));
    expect(mockAuthFetch).toHaveBeenCalledTimes(2);

    // Rejetées
    fireEvent.click(screen.getByText(/rejetées/i));
    expect(mockAuthFetch).toHaveBeenCalledTimes(3);

    // Toutes
    fireEvent.click(screen.getByText(/toutes/i));
    expect(mockAuthFetch).toHaveBeenCalledTimes(4);
  });

  // ---------------------------------------------------------
  // 4) État vide
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

    expect(await screen.findByText(/aucune annonce trouvée/i)).toBeInTheDocument();
  });
});
