import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react'; // Optionnel selon ta version de React, mais plus sûr pour ESLint
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from '../pages/AdminDashboard'; // ✅ ESLint : Import placé en haut du fichier

// Mock AdminCard (IMPORTANT : sans .js)
// On simule le composant enfant pour tester uniquement la logique du Dashboard
jest.mock('../components/AdminCard', () => ({ annonce, onValidate, onReject, onDelete }) => (
  <div data-testid="admin-card">
    <p>{annonce.titre}</p>
    <button onClick={() => onValidate(annonce.id)}>validate</button>
    <button onClick={() => onReject(annonce.id, 'bad')}>reject</button>
    <button onClick={() => onDelete(annonce.id)}>delete</button>
  </div>
));

// Mock navigate
// ✅ SOLUTION CI : On mocke totalement react-router-dom pour éviter l'erreur "Module not found"
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  // On remplace BrowserRouter par un simple conteneur pour isoler le test
  BrowserRouter: ({ children }) => <div>{children}</div>
}));

describe('AdminDashboard', () => {
  const mockAuthFetch = jest.fn();

  // Helper pour rendre le composant avec le Provider de test
  const renderWithContext = (user) =>
    render(
        <AuthContext.Provider value={{ user, authFetch: mockAuthFetch }}>
          <AdminDashboard />
        </AuthContext.Provider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // 1. Sécurité
  // ============================================================
  it('refuse accès si non admin', () => {
    renderWithContext({ username: 'bob', role: 'user' });
    expect(screen.getByText(/accès refusé/i)).toBeTruthy();
  });

  // ============================================================
  // 2. Feedback Utilisateur
  // ============================================================
  it('affiche loader', () => {
    renderWithContext({ username: 'admin', role: 'admin' });
    expect(screen.getByText(/chargement/i)).toBeTruthy();
  });

  // ============================================================
  // 3. Intégration API
  // ============================================================
  it('charge et affiche les annonces', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [{ id: 1, titre: 'A' }] })
    });

    renderWithContext({ username: 'admin', role: 'admin' });

    const card = await screen.findByTestId('admin-card'); // ✔ ESLint OK
    expect(card).toBeTruthy();
  });

  it('affiche une erreur si authFetch échoue', async () => {
    mockAuthFetch.mockResolvedValueOnce({ ok: false });

    renderWithContext({ username: 'admin', role: 'admin' });

    const error = await screen.findByText(/erreur lors du chargement/i);
    expect(error).toBeTruthy();
  });

  // ============================================================
  // 4. Logique métier : Filtres
  // ============================================================
  it('change le filtre et recharge les annonces', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    renderWithContext({ username: 'admin', role: 'admin' });

    fireEvent.click(screen.getByText(/validées/i));

    expect(mockAuthFetch).toHaveBeenCalled();
  });

  // ============================================================
  // 5. Actions de modération
  // ============================================================
  it('supprime une annonce après validation', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ annonces: [{ id: 1, titre: 'A' }] })
      })
      .mockResolvedValueOnce({ ok: true });

    renderWithContext({ username: 'admin', role: 'admin' });

    await screen.findByTestId('admin-card');

    fireEvent.click(screen.getByText('validate'));

    expect(screen.queryByTestId('admin-card')).toBeNull();
  });

  it('supprime une annonce après rejet', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ annonces: [{ id: 1, titre: 'A' }] })
      })
      .mockResolvedValueOnce({ ok: true });

    renderWithContext({ username: 'admin', role: 'admin' });

    await screen.findByTestId('admin-card');

    fireEvent.click(screen.getByText('reject'));

    expect(screen.queryByTestId('admin-card')).toBeNull();
  });

  it('supprime une annonce après suppression', async () => {
    window.confirm = jest.fn(() => true);

    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ annonces: [{ id: 1, titre: 'A' }] })
      })
      .mockResolvedValueOnce({ ok: true });

    renderWithContext({ username: 'admin', role: 'admin' });

    await screen.findByTestId('admin-card');

    fireEvent.click(screen.getByText('delete'));

    expect(screen.queryByTestId('admin-card')).toBeNull();
  });
});