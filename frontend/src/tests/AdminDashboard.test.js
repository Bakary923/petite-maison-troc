import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from '../pages/AdminDashboard';

// ------------------------------------------------------------
// 📌 MOCK AdminCard (évite de rendre le vrai composant complexe)
// ------------------------------------------------------------
jest.mock('../components/AdminCard', () => {
  return function MockAdminCard({ annonce }) {
    return <div data-testid="admin-card">{annonce.titre}</div>;
  };
});

// Mock authFetch
const mockAuthFetch = jest.fn();

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1️⃣ Accès refusé
  it('affiche accès refusé si user non admin', () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'user' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/accès refusé/i)).toBeInTheDocument();
  });

  // 2️⃣ Chargement et affichage
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

    // On attend que les données soient affichées
    expect(await screen.findByText(/annonce a/i)).toBeInTheDocument();
    expect(await screen.findByText(/annonce b/i)).toBeInTheDocument();
  });

  // 3️⃣ Changement de filtre
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

    // Attendre que le chargement initial disparaisse
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument();
    });

    // On récupère les boutons
    const btnValidees = screen.getByText(/validées/i);
    const btnRejetees = screen.getByText(/rejetées/i);

    // Click sur Validées
    await userEvent.click(btnValidees);
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(2));

    // Click sur Rejetées
    await userEvent.click(btnRejetees);
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(3));
  });
});