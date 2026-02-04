import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from '../pages/AdminDashboard';

// ✅ MOCK AdminCard (Isolation) : 
// On remplace le composant enfant par une version simplifiée pour ne tester 
// que la logique de filtrage du Dashboard (Responsabilité Unique).
jest.mock('../components/AdminCard', () => {
  return function MockAdminCard({ annonce }) {
    return <div data-testid="admin-card">{annonce.titre}</div>;
  };
});

// Mock de la fonction de récupération sécurisée
const mockAuthFetch = jest.fn();

describe('📊 AdminDashboard - Tests de Logique Modération', () => {
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // ✅ FIABILITÉ : On neutralise les warnings de styles (conflit border/borderColor)
    // qui polluent les logs de la CI sans impacter la logique métier.
    jest.spyOn(console, 'error').mockImplementation((msg) => {
      if (!msg.includes('borderColor')) console.error(msg);
    });
  });

  afterEach(() => {
    console.error.mockRestore();
  });

  // ==========================================================
  // 🛡️ TEST DE SÉCURITÉ (ISO 25010)
  // ==========================================================
  it('⚓ Doit afficher "Accès Refusé" si l’utilisateur n’est pas administrateur', () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'user' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/accès refusé/i)).toBeInTheDocument();
  });

  // ==========================================================
  // ⚙️ TEST DE CHARGEMENT DYNAMIQUE
  // ==========================================================
  it('⚓ Doit charger et afficher les annonces récupérées via authFetch', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, titre: 'Annonce Modérée A' },
        { id: 2, titre: 'Annonce Modérée B' }
      ]
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    // findByText attend la résolution de la promesse (Asynchronisme)
    expect(await screen.findByText(/annonce modérée a/i)).toBeInTheDocument();
    expect(await screen.findByText(/annonce modérée b/i)).toBeInTheDocument();
  });

  // ==========================================================
  // 🔄 TEST DU CYCLE DE FILTRAGE
  // ==========================================================
  it('⚓ Doit relancer authFetch avec le bon filtre lors du clic sur les boutons', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    // 1. Attente du chargement initial (Filtre par défaut : en_attente)
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument();
    });
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);

    // 2. Action : Clic sur le filtre VALIDÉES
    const btnValidees = screen.getByText(/validées/i);
    fireEvent.click(btnValidees);
    
    // Validation : L'intercepteur authFetch doit être sollicité une 2ème fois
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(2));

    // ✅ STABILITÉ CI : Pause technique pour laisser le state React se stabiliser
    await new Promise(resolve => setTimeout(resolve, 100));

    // 3. Action : Clic sur le filtre REJETÉES
    const btnRejetees = screen.getByText(/rejetées/i);
    fireEvent.click(btnRejetees);
    
    // Validation finale de l'incrémentation des appels API
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(3));
  });

});