import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminDashboard from '../pages/AdminDashboard';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock AdminCard pour simplifier les tests
jest.mock('../components/AdminCard', () => ({ annonce, onValidate, onReject, onDelete }) => (
  <div data-testid="admin-card">
    <p>{annonce.titre}</p>
    <button onClick={() => onValidate(annonce.id)}>validate</button>
    <button onClick={() => onReject(annonce.id, 'bad')}>reject</button>
    <button onClick={() => onDelete(annonce.id)}>delete</button>
  </div>
));

// Mock navigate()
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('🔐 AdminDashboard', () => {

  const mockAuthFetch = jest.fn();

  const renderWithContext = (user) => {
    return render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user, authFetch: mockAuthFetch }}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // 1. Accès refusé si non admin
  // ============================================================
  it('affiche un message d’erreur si user non admin', () => {
    renderWithContext({ username: 'bob', role: 'user' });

    expect(screen.getByText(/accès refusé/i)).toBeTruthy();
  });

  // ============================================================
  // 2. Loader
  // ============================================================
  it('affiche le loader pendant le chargement', () => {
    renderWithContext({ username: 'admin', role: 'admin' });

    expect(screen.getByText(/chargement des données sécurisées/i)).toBeTruthy();
  });

  // ============================================================
  // 3. Chargement des annonces
  // ============================================================
  it('charge et affiche les annonces', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        annonces: [
          { id: 1, titre: 'Annonce A' },
          { id: 2, titre: 'Annonce B' }
        ]
      })
    });

    renderWithContext({ username: 'admin', role: 'admin' });

    await waitFor(() => {
      expect(screen.getAllByTestId('admin-card').length).toBe(2);
    });
  });

  // ============================================================
  // 4. Erreur API
  // ============================================================
  it('affiche une erreur si authFetch échoue', async () => {
    mockAuthFetch.mockResolvedValueOnce({ ok: false });

    renderWithContext({ username: 'admin', role: 'admin' });

    await waitFor(() => {
      expect(screen.getByText(/erreur lors du chargement/i)).toBeTruthy();
    });
  });

  // ============================================================
  // 5. Changement de filtre
  // ============================================================
  it('change le filtre et recharge les annonces', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    renderWithContext({ username: 'admin', role: 'admin' });

    const validatedBtn = screen.getByText(/validées/i);
    fireEvent.click(validatedBtn);

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalled();
    });
  });

  // ============================================================
  // 6. Action : validate
  // ============================================================
  it('supprime une annonce après validation', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ annonces: [{ id: 1, titre: 'Annonce A' }] })
      })
      .mockResolvedValueOnce({ ok: true }); // validate

    renderWithContext({ username: 'admin', role: 'admin' });

    await waitFor(() => {
      expect(screen.getByTestId('admin-card')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('validate'));

    await waitFor(() => {
      expect(screen.queryByTestId('admin-card')).toBeNull();
    });
  });

  // ============================================================
  // 7. Action : reject
  // ============================================================
  it('supprime une annonce après rejet', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ annonces: [{ id: 1, titre: 'Annonce A' }] })
      })
      .mockResolvedValueOnce({ ok: true }); // reject

    renderWithContext({ username: 'admin', role: 'admin' });

    await waitFor(() => {
      expect(screen.getByTestId('admin-card')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('reject'));

    await waitFor(() => {
      expect(screen.queryByTestId('admin-card')).toBeNull();
    });
  });

  // ============================================================
  // 8. Action : delete
  // ============================================================
  it('supprime une annonce après suppression', async () => {
    window.confirm = jest.fn(() => true);

    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ annonces: [{ id: 1, titre: 'Annonce A' }] })
      })
      .mockResolvedValueOnce({ ok: true }); // delete

    renderWithContext({ username: 'admin', role: 'admin' });

    await waitFor(() => {
      expect(screen.getByTestId('admin-card')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('delete'));

    await waitFor(() => {
      expect(screen.queryByTestId('admin-card')).toBeNull();
    });
  });
});
