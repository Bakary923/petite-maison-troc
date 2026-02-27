import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
// Import sans accolades car "export default AdminDashboard" dans ton code
import AdminDashboard from '../pages/AdminDashboard';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mocks globaux pour éviter les alertes et les erreurs de console
console.error = jest.fn();
window.confirm = jest.fn(() => true);
window.alert = jest.fn();
window.prompt = jest.fn();

const mockAuthFetch = jest.fn();

/**
 * Helper pour injecter le contexte d'authentification et le Router
 */
const renderAdminDashboard = (user) => {
  return render(
    <AuthContext.Provider value={{ user, authFetch: mockAuthFetch }}>
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('AdminDashboard - Full Coverage & CI Friendly', () => {
  const adminUser = { username: 'AdminTest', role: 'admin' };
  const mockAnnonces = [
    { 
      id: 1, 
      titre: 'Annonce Test', 
      description: 'Desc', 
      statut: 'pending' 
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Couverture de la sécurité (RBAC)
  it('affiche un message d\'erreur si l\'utilisateur n\'est pas admin', async () => {
    renderAdminDashboard({ username: 'User', role: 'user' });
    // findByText est utilisé pour satisfaire le Linter (testing-library/prefer-find-by)
    const errorMsg = await screen.findByText(/Vous devez être administrateur/i);
    expect(errorMsg).toBeInTheDocument();
  });

  // 2. Couverture du chargement initial (useEffect)
  it('affiche les annonces chargées avec succès', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnnonces,
    });

    renderAdminDashboard(adminUser);
    
    const item = await screen.findByText('Annonce Test');
    expect(item).toBeInTheDocument();
  });

  // 3. Couverture des filtres (Logique d'URL)
  it('change le filtre quand on clique sur Validées', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => mockAnnonces,
    });

    renderAdminDashboard(adminUser);
    await screen.findByText('Annonce Test');

    const btn = screen.getByText(/Validées/i);
    fireEvent.click(btn);

    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining('/validated'),
      expect.anything()
    );
  });

  // 4. Couverture de handleValidate (PUT)
  it('appelle l\'API de validation au clic sur Valider', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockAnnonces })
      .mockResolvedValueOnce({ ok: true });

    renderAdminDashboard(adminUser);
    const btn = await screen.findByText(/Valider/i);
    fireEvent.click(btn);

    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining('/validate'),
      expect.objectContaining({ method: 'PUT' })
    );
  });

  // 5. Couverture de handleReject (Motif de refus)
  it('appelle l\'API de rejet avec un motif', async () => {
    window.prompt.mockReturnValueOnce('Refusé pour test');
    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockAnnonces })
      .mockResolvedValueOnce({ ok: true });

    renderAdminDashboard(adminUser);
    const btn = await screen.findByText(/Refuser/i);
    fireEvent.click(btn);

    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining('/reject'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ reason: 'Refusé pour test' })
      })
    );
  });

  // 6. Couverture des blocs "catch" (Erreurs API)
  it('affiche une erreur si le chargement échoue', async () => {
    mockAuthFetch.mockRejectedValueOnce(new Error('Crash API'));

    renderAdminDashboard(adminUser);

    const errorMsg = await screen.findByText(/Erreur lors du chargement des annonces/i);
    expect(errorMsg).toBeInTheDocument();
  });
});