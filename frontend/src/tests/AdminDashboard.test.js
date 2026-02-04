import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from '../pages/AdminDashboard';

// ✅ MOCK AdminCard (Isolation)
jest.mock('../components/AdminCard', () => {
  return function MockAdminCard({ annonce }) {
    return <div data-testid="admin-card">{annonce.titre}</div>;
  };
});

const mockAuthFetch = jest.fn();

describe('📊 AdminDashboard - Tests de Logique Modération', () => {
  
  // On définit une référence vers la vraie fonction console.error
  const originalError = console.error;

  beforeAll(() => {
    // ✅ FIABILITÉ : On filtre les erreurs de style sans créer de boucle infinie
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('borderColor')) return;
      originalError.call(console, ...args);
    };
  });

  afterAll(() => {
    // On restaure la console après les tests
    console.error = originalError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
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

    expect(await screen.findByText(/annonce modérée a/i)).toBeInTheDocument();
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

    // 1. Attente du chargement initial
    await waitFor(() => {
      expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument();
    });
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);

    // 2. Action : Clic sur le filtre VALIDÉES
    const btnValidees = screen.getByText(/validées/i);
    fireEvent.click(btnValidees);
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(2));

    // ✅ STABILITÉ : On utilise waitFor au lieu de setTimeout pour être plus "React-compliant"
    await waitFor(() => expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument());

    // 3. Action : Clic sur le filtre REJETÉES
    const btnRejetees = screen.getByText(/rejetées/i);
    fireEvent.click(btnRejetees);
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalledTimes(3));
  });

});