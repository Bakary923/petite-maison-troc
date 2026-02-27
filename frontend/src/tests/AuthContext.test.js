import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AdminDashboard from '../pages/AdminDashboard';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mocks des fonctions globales
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

describe('AdminDashboard Coverage', () => {
  const adminUser = { username: 'Admin', role: 'admin' };
  const mockAnnonces = [{ id: 1, titre: 'Objet A', statut: 'pending' }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('affiche une erreur si l\'utilisateur n\'est pas admin', async () => {
    renderAdminDashboard({ username: 'User', role: 'user' });
    // findByText respecte la règle ESLint prefer-find-by
    expect(await screen.findByText(/pas autorisé à accéder/i)).toBeInTheDocument();
  });

  it('affiche les annonces après chargement', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnnonces,
    });
    renderAdminDashboard(adminUser);
    expect(await screen.findByText('Objet A')).toBeInTheDocument();
  });

  it('appelle la validation au clic', async () => {
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

  it('appelle le rejet avec un motif', async () => {
    window.prompt.mockReturnValueOnce('Mauvaise catégorie');
    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockAnnonces })
      .mockResolvedValueOnce({ ok: true });
    
    renderAdminDashboard(adminUser);
    const btn = await screen.findByText(/Refuser/i);
    fireEvent.click(btn);

    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining('/reject'),
      expect.objectContaining({ body: JSON.stringify({ reason: 'Mauvaise catégorie' }) })
    );
  });

  it('gère l\'erreur de chargement API', async () => {
    mockAuthFetch.mockRejectedValueOnce(new Error('API Error'));
    renderAdminDashboard(adminUser);
    expect(await screen.findByText(/Erreur lors du chargement/i)).toBeInTheDocument();
  });
});