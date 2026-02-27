import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from '../pages/AdminDashboard';

// --- MOCKS ---
// Mock des alertes et confirm pour éviter de bloquer le test
window.alert = jest.fn();
window.confirm = jest.fn(() => true);
console.error = jest.fn();

const mockAuthFetch = jest.fn();

const renderAdminDashboard = (user) => {
  return render(
    <AuthContext.Provider value={{ user, authFetch: mockAuthFetch }}>
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('AdminDashboard - Test de Couverture Sonar', () => {
  const adminUser = { username: 'AdminTest', role: 'admin' };
  const mockAnnonces = [
    { id: 1, titre: 'Annonce 1', description: 'Description 1', statut: 'pending' },
    { id: 2, titre: 'Annonce 2', description: 'Description 2', statut: 'pending' }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. TEST SÉCURITÉ (RBAC)
  it('affiche un message d\'erreur si l\'utilisateur n\'est pas administrateur', async () => {
    renderAdminDashboard({ username: 'User', role: 'user' });
    const errorMsg = await screen.findByText(/Vous devez être administrateur/i);
    expect(errorMsg).toBeInTheDocument();
  });

  // 2. TEST CHARGEMENT INITIAL (SUCCESS)
  it('charge et affiche les annonces après un appel API réussi', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnnonces,
    });

    renderAdminDashboard(adminUser);

    // On attend que le texte apparaisse (satisfait le linter et gère l'asynchrone)
    expect(await screen.findByText('Annonce 1')).toBeInTheDocument();
    expect(screen.getByText('Annonce 2')).toBeInTheDocument();
  });

  // 3. TEST GESTION DES FILTRES
  it('change l\'URL de fetch lors du clic sur un bouton de filtre', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    renderAdminDashboard(adminUser);

    const btnValidees = await screen.findByText(/Validées/i);
    fireEvent.click(btnValidees);

    // Vérifie que l'URL appelée contient le filtre "validated"
    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/annonces/validated')
    );
  });

  // 4. TEST ACTION : VALIDER
  it('appelle l\'API de validation et retire l\'annonce de la liste', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockAnnonces }) // Fetch initial
      .mockResolvedValueOnce({ ok: true }); // Mock du PUT validate

    renderAdminDashboard(adminUser);

    const validateBtn = await screen.findAllByText(/Valider/i);
    fireEvent.click(validateBtn[0]);

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/validate'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('validée'));
  });

  // 5. TEST ACTION : REJETER
  it('appelle l\'API de rejet lors du clic', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockAnnonces })
      .mockResolvedValueOnce({ ok: true });

    renderAdminDashboard(adminUser);

    const rejectBtns = await screen.findAllByText(/Rejeter/i); // Ou "Refuser" selon AdminCard
    fireEvent.click(rejectBtns[0]);

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/reject'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  // 6. TEST ACTION : SUPPRIMER
  it('appelle l\'API de suppression après confirmation', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockAnnonces })
      .mockResolvedValueOnce({ ok: true });

    renderAdminDashboard(adminUser);

    const deleteBtns = await screen.findAllByText(/Supprimer/i);
    fireEvent.click(deleteBtns[0]);

    expect(window.confirm).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/annonces/1'),
        expect.objectContaining({ method: 'DELETE' })
      );
    });
  });

  // 7. TEST GESTION D'ERREUR API (COVERAGE DU CATCH)
  it('affiche un message d\'erreur si le fetch échoue', async () => {
    mockAuthFetch.mockRejectedValueOnce(new Error('Erreur Réseau'));

    renderAdminDashboard(adminUser);

    const errorMsg = await screen.findByText(/Erreur lors du chargement des annonces/i);
    expect(errorMsg).toBeInTheDocument();
    expect(console.error).toHaveBeenCalled();
  });
});