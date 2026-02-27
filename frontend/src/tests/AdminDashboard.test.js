import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from '../pages/AdminDashboard';

// ✅ MOCK AdminCard pour isoler le test du dashboard
jest.mock('../components/AdminCard', () => {
  return function MockAdminCard({ annonce }) {
    return <div data-testid="admin-card">{annonce.titre}</div>;
  };
});

const mockAuthFetch = jest.fn();

describe('📊 AdminDashboard - Couverture Maximale', () => {
  
  const originalError = console.error;
  beforeAll(() => {
    // Empêche les avertissements de style JSDOM de polluer la console
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

  // 1. TEST SÉCURITÉ : Accès non autorisé
  it('⚓ Doit afficher le message de refus si l’utilisateur n’est pas admin', async () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'user' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );
    // Vérifie la branche : if (user && user.role !== 'admin')
    expect(screen.getByText(/Vous n'êtes pas autorisé/i)).toBeInTheDocument();
  });

  // 2. TEST CHARGEMENT : Succès API avec données
  it('⚓ Doit charger et afficher les annonces récupérées', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, titre: 'Objet A', statut: 'pending' },
        { id: 2, titre: 'Objet B', statut: 'pending' }
      ]
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    expect(await screen.findByText(/Objet A/i)).toBeInTheDocument();
    expect(screen.getAllByTestId('admin-card')).toHaveLength(2);
  });

  // 3. TEST ÉTAT VIDE : Couvre la branche où aucune annonce n'est trouvée
  it('⚓ Doit afficher un message si aucune annonce ne correspond au filtre', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [] // Liste vide
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Aucune annonce en attente/i)).toBeInTheDocument();
    });
  });

  // 4. TEST ERREUR API : Couvre le bloc "catch (err)"
  it('⚓ Doit afficher un message d\'erreur si l\'API échoue', async () => {
    // On simule un rejet de la promesse pour entrer dans le catch(err)
    mockAuthFetch.mockRejectedValueOnce(new Error('Erreur Serveur'));

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/Erreur lors du chargement des annonces/i)).toBeInTheDocument();
    });
  });

  // 5. TEST FILTRAGE : Changement d'état
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

    // Attente chargement initial (En attente)
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(1));

    // Clic sur "Validées" pour changer le state 'filter'
    const btnValidees = screen.getByText(/validées/i);
    fireEvent.click(btnValidees);

    // Vérifie que fetch est rappelé une 2ème fois avec le nouveau filtre
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(2));
  });
});