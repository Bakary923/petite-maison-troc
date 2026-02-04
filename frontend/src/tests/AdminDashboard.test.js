import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from '../pages/AdminDashboard';

// On remplace AdminCard par un mock simple pour éviter son rendu complet
jest.mock('../components/AdminCard', () => ({ annonce }) => (
  <div data-testid="admin-card">{annonce.titre}</div>
));

const mockAuthFetch = jest.fn();

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // --- 1) Accès refusé si l’utilisateur n’est pas admin ---
  it('affiche accès refusé si user non admin', () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'user' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    // Le message doit apparaître immédiatement
    expect(screen.getByText(/accès refusé/i)).toBeInTheDocument();
  });

  // --- 2) Chargement et affichage des annonces ---
  it('charge et affiche les annonces admin', async () => {
    // Simulation d’une réponse API contenant deux annonces
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

    // On attend que les annonces soient rendues
    expect(await screen.findByText(/annonce a/i)).toBeInTheDocument();
    expect(await screen.findByText(/annonce b/i)).toBeInTheDocument();
  });

  // --- 3) Changement de filtre ---
  it('relance authFetch quand on change de filtre', async () => {
    // Réponse API vide pour simplifier
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    // On attend que les boutons soient présents
    const btnPending = await screen.findByText(/en attente/i);
    const btnValidated = await screen.findByText(/validées/i);
    const btnRejected = await screen.findByText(/rejetées/i);
    const btnAll = await screen.findByText(/toutes/i);

    // Premier appel automatique au chargement
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);

    // Clic sur "Validées"
    await userEvent.click(btnValidated);
    // On attend que React ait fini son re-render
    await screen.findByText(/validées/i);
    expect(mockAuthFetch).toHaveBeenCalledTimes(2);

    // Clic sur "Rejetées"
    await userEvent.click(btnRejected);
    await screen.findByText(/rejetées/i);
    expect(mockAuthFetch).toHaveBeenCalledTimes(3);

    // Clic sur "Toutes"
    await userEvent.click(btnAll);
    await screen.findByText(/toutes/i);
    expect(mockAuthFetch).toHaveBeenCalledTimes(4);
  });

  // --- 4) État vide ---
  it('affiche un état vide si aucune annonce', async () => {
    // API renvoie une liste vide
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    // Le message d’état vide doit apparaître
    expect(await screen.findByText(/aucune annonce trouvée/i)).toBeInTheDocument();
  });
});
