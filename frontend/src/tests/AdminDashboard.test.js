import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from '../pages/AdminDashboard';

// ✅ SOLUTION DEFINITIVE POUR LES STYLES : On mocke l'objet styles interne du fichier
// pour éviter les conflits border/borderColor de React 18/19
jest.mock('../pages/AdminDashboard', () => {
  const original = jest.requireActual('../pages/AdminDashboard');
  return {
    ...original,
    styles: {} 
  };
});

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
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    expect(await screen.findByText(/annonce a/i)).toBeInTheDocument();
  });

  it('relance authFetch quand on change de filtre', async () => {
    // On utilise mockResolvedValue (sans Once) pour que tous les clics fonctionnent
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    // 1. Attendre le chargement initial
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument();
    });

    // VALIDÉES
    const btnValidees = screen.getByText(/validées/i);
    await userEvent.click(btnValidees);
    // ✅ Crucial : on attend que l'appel soit fait ET que le chargement disparaisse
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(2));
    await screen.findByText(/en attente/i); // On s'assure que l'UI est revenue

    // REJETÉES
    const btnRejetees = screen.getByText(/rejetées/i);
    await userEvent.click(btnRejetees);
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(3));
    await screen.findByText(/en attente/i);

    // TOUTES
    const btnToutes = screen.getByText(/toutes/i);
    await userEvent.click(btnToutes);
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(4));
  });
});