// ------------------------------------------------------------
// 📌 IMPORTS (doivent TOUJOURS être en haut du fichier)
// ------------------------------------------------------------
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext } from '../contexts/AuthContext';

// ------------------------------------------------------------
// 📌 MOCK COMPLET DES STYLES AVANT L’IMPORT DU COMPOSANT
// ------------------------------------------------------------
// Ton AdminDashboard utilise des styles inline dynamiques.
// React 18 déclenche des warnings et casse les tests.
// On neutralise donc TOUT l’objet styles uniquement pour les tests.
jest.mock('../pages/AdminDashboard', () => {
  const original = jest.requireActual('../pages/AdminDashboard');
  return {
    __esModule: true,
    ...original,
    styles: {} // ⛔ styles désactivés → plus de conflits border/borderColor
  };
});

// ------------------------------------------------------------
// 📌 IMPORT DU COMPOSANT APRÈS LE MOCK
// ------------------------------------------------------------
import AdminDashboard from '../pages/AdminDashboard';

// ------------------------------------------------------------
// 📌 MOCK AdminCard (évite de rendre le vrai composant)
// ------------------------------------------------------------
jest.mock('../components/AdminCard', () => ({ annonce }) => (
  <div data-testid="admin-card">{annonce.titre}</div>
));

// ------------------------------------------------------------
// 📌 MOCK authFetch
// ------------------------------------------------------------
const mockAuthFetch = jest.fn();

describe('AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ------------------------------------------------------------
  // 1️⃣ Accès refusé si l’utilisateur n’est pas admin
  // ------------------------------------------------------------
  it('affiche accès refusé si user non admin', () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'user' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/accès refusé/i)).toBeInTheDocument();
  });

  // ------------------------------------------------------------
  // 2️⃣ Chargement et affichage des annonces admin
  // ------------------------------------------------------------
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

  // ------------------------------------------------------------
  // 3️⃣ Changement de filtre (pending → validated → rejected → all)
  // ------------------------------------------------------------
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

    // On attend que les boutons soient rendus
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

  // ------------------------------------------------------------
  // 4️⃣ État vide (aucune annonce)
  // ------------------------------------------------------------
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
