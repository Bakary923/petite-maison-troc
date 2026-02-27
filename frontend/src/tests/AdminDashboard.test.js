import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from '../pages/AdminDashboard';

// ✅ MOCK AdminCard
jest.mock('../components/AdminCard', () => {
  return function MockAdminCard({ annonce }) {
    return <div data-testid="admin-card">{annonce.titre}</div>;
  };
});

const mockAuthFetch = jest.fn();

describe('📊 AdminDashboard - Couverture Maximale', () => {
  
  const originalError = console.error;
  beforeAll(() => {
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('borderColor')) return;
      originalError.call(console, ...args);
    };
  });

  afterAll(() => {
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. TEST SÉCURITÉ : "Accès refusé" au lieu de "Vous n'êtes pas autorisé"
  it('⚓ Doit afficher le message de refus si l’utilisateur n’est pas admin', async () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'user' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );
    // Texte corrigé selon ton rendu : "Accès refusé"
    expect(screen.getByText(/Accès refusé/i)).toBeInTheDocument();
  });

  // 2. TEST CHARGEMENT : Succès
  it('⚓ Doit charger et afficher les annonces récupérées', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, titre: 'Objet A', statut: 'pending' }
      ]
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    expect(await screen.findByText(/Objet A/i)).toBeInTheDocument();
  });

  // 3. TEST ÉTAT VIDE : "Aucune annonce trouvée" au lieu de "Aucune annonce en attente"
  it('⚓ Doit afficher un message si aucune annonce ne correspond au filtre', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    // Texte corrigé selon ton rendu : "Aucune annonce trouvée"
    await waitFor(() => {
      expect(screen.getByText(/Aucune annonce trouvée/i)).toBeInTheDocument();
    });
  });

  // 4. TEST ERREUR API : "Erreur lors du chargement"
  it('⚓ Doit afficher un message d\'erreur si l\'API échoue', async () => {
    mockAuthFetch.mockRejectedValueOnce(new Error('Erreur Serveur'));

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Erreur lors du chargement/i)).toBeInTheDocument();
    });
  });

  // 5. TEST FILTRAGE : On attend que le chargement soit fini avant de cliquer
  it('⚓ Doit changer le filtre et recharger les données', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    // CRUCIAL : Attendre que l'écran de chargement disparaisse AVANT de chercher les boutons
    await waitFor(() => {
      expect(screen.queryByText(/Chargement/i)).not.toBeInTheDocument();
    });

    const btnValidees = screen.getByText(/Validées/i);
    fireEvent.click(btnValidees);

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(2));
  });
});