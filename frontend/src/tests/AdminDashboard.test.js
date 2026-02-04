import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from '../pages/AdminDashboard';

// Mock simple d’AdminCard
jest.mock('../components/AdminCard', () => ({ annonce }) => (
  <div data-testid="admin-card">{annonce.titre}</div>
));

const mockAuthFetch = jest.fn();

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- Accès refusé si user non admin ---
  it('affiche accès refusé si user non admin', () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'user' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/accès refusé/i)).toBeInTheDocument();
  });

  // --- Chargement des annonces ---
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

    // findByText attend automatiquement la fin du chargement
    expect(await screen.findByText(/annonce a/i)).toBeInTheDocument();
    expect(await screen.findByText(/annonce b/i)).toBeInTheDocument();
  });

  // --- Changement de filtre ---
  it('relance authFetch quand on change de filtre', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    // Attendre que les boutons soient visibles
    const btnPending = await screen.findByText(/en attente/i);
    const btnValidated = await screen.findByText(/validées/i);
    const btnRejected = await screen.findByText(/rejetées/i);
    const btnAll = await screen.findByText(/toutes/i);

    // Premier appel
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);

    // Validées
    fireEvent.click(btnValidated);
    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledTimes(2)
    );

    // Rejetées
    fireEvent.click(btnRejected);
    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledTimes(3)
    );

    // Toutes
    fireEvent.click(btnAll);
    await waitFor(() =>
      expect(mockAuthFetch).toHaveBeenCalledTimes(4)
    );
  });

  // --- État vide ---
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
