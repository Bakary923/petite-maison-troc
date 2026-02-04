import { render, screen, fireEvent } from '@testing-library/react';
import AdminDashboard from '../pages/AdminDashboard';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock AdminCard (IMPORTANT : sans .js)
jest.mock('../components/AdminCard', () => ({ annonce, onValidate, onReject, onDelete }) => (
  <div data-testid="admin-card">
    <p>{annonce.titre}</p>
    <button onClick={() => onValidate(annonce.id)}>validate</button>
    <button onClick={() => onReject(annonce.id, 'bad')}>reject</button>
    <button onClick={() => onDelete(annonce.id)}>delete</button>
  </div>
));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('AdminDashboard', () => {
  const mockAuthFetch = jest.fn();

  const renderWithContext = (user) =>
    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user, authFetch: mockAuthFetch }}>
          <AdminDashboard />
        </AuthContext.Provider>
      </BrowserRouter>
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

    const card = await screen.findByTestId('admin-card'); // ✔ ESLint OK
    expect(card).toBeTruthy();
  });

  it('affiche une erreur si authFetch échoue', async () => {
    mockAuthFetch.mockResolvedValueOnce({ ok: false });

    renderWithContext({ username: 'admin', role: 'admin' });

    const error = await screen.findByText(/erreur lors du chargement/i);
    expect(error).toBeTruthy();
  });

  it('change le filtre et recharge les annonces', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ annonces: [] })
    });

    renderWithContext({ username: 'admin', role: 'admin' });

    fireEvent.click(screen.getByText(/validées/i));

    expect(mockAuthFetch).toHaveBeenCalled();
  });

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
