import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';

// ✅ MOCK GLOBAL CI
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  BrowserRouter: ({ children }) => <div>{children}</div>
}));

// Mock AdminCard
jest.mock('../components/AdminCard', () => ({ annonce, onValidate, onReject, onDelete }) => (
  <div data-testid="admin-card">
    <p>{annonce.titre}</p>
    <button onClick={() => onValidate(annonce.id)}>validate</button>
    <button onClick={() => onReject(annonce.id, 'bad')}>reject</button>
    <button onClick={() => onDelete(annonce.id)}>delete</button>
  </div>
));

import AdminDashboard from '../pages/AdminDashboard';

describe('AdminDashboard', () => {
  const mockAuthFetch = jest.fn();

  const renderWithContext = (user) =>
    render(
      <AuthContext.Provider value={{ user, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('refuse accès si non admin', () => {
    renderWithContext({ username: 'bob', role: 'user' });
    expect(screen.getByText(/accès refusé/i)).toBeTruthy();
  });

  it('affiche loader', () => {
    renderWithContext({ username: 'admin', role: 'admin' });
    expect(screen.getByText(/chargement/i)).toBeTruthy();
  });

  it('charge et affiche les annonces', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [{ id: 1, titre: 'A' }] })
    });
    renderWithContext({ username: 'admin', role: 'admin' });
    const card = await screen.findByTestId('admin-card');
    expect(card).toBeTruthy();
  });

  it('affiche une erreur si authFetch échoue', async () => {
    mockAuthFetch.mockResolvedValueOnce({ ok: false });
    renderWithContext({ username: 'admin', role: 'admin' });
    const error = await screen.findByText(/erreur lors du chargement/i);
    expect(error).toBeTruthy();
  });

  it('change le filtre et recharge les annonces', async () => {
    mockAuthFetch.mockResolvedValue({ ok: true, json: async () => ({ annonces: [] }) });
    renderWithContext({ username: 'admin', role: 'admin' });
    fireEvent.click(screen.getByText(/validées/i));
    expect(mockAuthFetch).toHaveBeenCalled();
  });

  it('supprime une annonce après validation', async () => {
    mockAuthFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ annonces: [{ id: 1, titre: 'A' }] }) })
                 .mockResolvedValueOnce({ ok: true });
    renderWithContext({ username: 'admin', role: 'admin' });
    await screen.findByTestId('admin-card');
    fireEvent.click(screen.getByText('validate'));
    expect(screen.queryByTestId('admin-card')).toBeNull();
  });

  it('supprime une annonce après rejet', async () => {
    mockAuthFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ annonces: [{ id: 1, titre: 'A' }] }) })
                 .mockResolvedValueOnce({ ok: true });
    renderWithContext({ username: 'admin', role: 'admin' });
    await screen.findByTestId('admin-card');
    fireEvent.click(screen.getByText('reject'));
    expect(screen.queryByTestId('admin-card')).toBeNull();
  });

  it('supprime une annonce après suppression', async () => {
    window.confirm = jest.fn(() => true);
    mockAuthFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ annonces: [{ id: 1, titre: 'A' }] }) })
                 .mockResolvedValueOnce({ ok: true });
    renderWithContext({ username: 'admin', role: 'admin' });
    await screen.findByTestId('admin-card');
    fireEvent.click(screen.getByText('delete'));
    expect(screen.queryByTestId('admin-card')).toBeNull();
  });
});