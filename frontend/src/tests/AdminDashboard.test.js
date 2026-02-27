import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminDashboard from '../pages/AdminDashboard';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mocks globaux pour éviter les alertes Sonar et les erreurs de console
console.error = jest.fn();
window.confirm = jest.fn(() => true);
window.alert = jest.fn();
window.prompt = jest.fn();

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

describe('AdminDashboard - Full Coverage & Lint Friendly', () => {
  const adminUser = { username: 'Admin', role: 'admin' };
  const mockAnnonces = [
    { 
      id: 1, 
      titre: 'Objet Test', 
      description: 'Test Desc', 
      statut: 'pending' 
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. Test de sécurité (Role-Based Access Control)
  it('affiche un message d\'erreur si l\'utilisateur n\'est pas admin', async () => {
    renderAdminDashboard({ username: 'User', role: 'user' });
    const errorMsg = await screen.findByText(/pas autorisé à accéder à cette page/i);
    expect(errorMsg).toBeInTheDocument();
  });

  // 2. Test de chargement et affichage
  it('affiche les annonces chargées avec succès', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnnonces,
    });

    renderAdminDashboard(adminUser);
    
    // findByText est asynchrone et respecte la règle ESLint prefer-find-by
    const item = await screen.findByText('Objet Test');
    expect(item).toBeInTheDocument();
  });

  // 3. Test de filtrage
  it('change le filtre d\'API lors du clic sur les boutons', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => mockAnnonces,
    });

    renderAdminDashboard(adminUser);
    await screen.findByText('Objet Test');

    const validBtn = screen.getByText(/validées/i);
    fireEvent.click(validBtn);

    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining('filter=validated'),
      expect.anything()
    );
  });

  // 4. Test d'action : Validation (PUT)
  it('appelle l\'API de validation au clic sur Valider', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockAnnonces })
      .mockResolvedValueOnce({ ok: true });

    renderAdminDashboard(adminUser);
    const btn = await screen.findByText(/valider/i);
    fireEvent.click(btn);

    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining('/validate'),
      expect.objectContaining({ method: 'PUT' })
    );
  });

  // 5. Test d'action : Rejet (PUT avec motif)
  it('appelle l\'API de rejet au clic sur Refuser', async () => {
    window.prompt.mockReturnValueOnce('Motif de refus');
    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockAnnonces })
      .mockResolvedValueOnce({ ok: true });

    renderAdminDashboard(adminUser);
    const btn = await screen.findByText(/refuser/i);
    fireEvent.click(btn);

    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining('/reject'),
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ reason: 'Motif de refus' })
      })
    );
  });

  // 6. Test de gestion d'erreur réseau (Catch block)
  it('gère les erreurs de chargement réseau', async () => {
    mockAuthFetch.mockRejectedValueOnce(new Error('Network Error'));

    renderAdminDashboard(adminUser);

    const errorMsg = await screen.findByText(/erreur lors du chargement/i);
    expect(errorMsg).toBeInTheDocument();
  });
});