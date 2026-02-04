import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AdminDashboard from '../pages/AdminDashboard';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

jest.mock('../components/AdminCard.js', () => ({ annonce, onValidate, onReject, onDelete }) => (
  <div data-testid="admin-card">
    <p>{annonce.titre}</p>
    <button onClick={() => onValidate(annonce.id)}>validate</button>
    <button onClick={() => onReject(annonce.id, 'bad')}>reject</button>
    <button onClick={() => onDelete(annonce.id)}>delete</button>
  </div>
));

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

  it('charge annonces', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonces: [{ id: 1, titre: 'A' }] })
    });

    renderWithContext({ username: 'admin', role: 'admin' });

    await waitFor(() => {
      expect(screen.getByTestId('admin-card')).toBeTruthy();
    });
  });

  it('validate supprime annonce', async () => {
    mockAuthFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ annonces: [{ id: 1, titre: 'A' }] })
      })
      .mockResolvedValueOnce({ ok: true });

    renderWithContext({ username: 'admin', role: 'admin' });

    await waitFor(() => screen.getByTestId('admin-card'));

    fireEvent.click(screen.getByText('validate'));

    await waitFor(() => {
      expect(screen.queryByTestId('admin-card')).toBeNull();
    });
  });
});
