import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../contexts/AuthContext';

// --- IMPORTANT ---
// On mocke AdminDashboard AVANT de l'importer
jest.mock('../pages/AdminDashboard', () => {
  const original = jest.requireActual('../pages/AdminDashboard');
  return {
    __esModule: true,
    ...original,
    styles: {} // styles neutralisés
  };
});

// Maintenant on peut importer le composant
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

  it('affiche accès refusé si user non admin', () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'user' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/accès refusé/i)).toBeInTheDocument();
  });

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

    expect(await screen.findByText(/annonce a/i)).toBeInTheDocument();
    expect(await screen.findByText(/annonce b/i)).toBeInTheDocument();
  });

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
    await screen.findByText(/en attente/i);

    expect(mockAuthFetch).toHaveBeenCalledTimes(1);

    // VALIDÉES
    await userEvent.click(screen.getByText(/validées/i));
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(2));

    // REJETÉES
    await userEvent.click(screen.getByText(/rejetées/i));
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(3));

    // TOUTES
    await userEvent.click(screen.getByText(/toutes/i));
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(4));
  });

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
