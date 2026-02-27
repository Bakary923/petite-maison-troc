import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from '../pages/AdminDashboard';

jest.mock('../config', () => ({ API_BASE_URL: 'http://localhost:4000' }));
jest.mock('../components/AdminCard', () => ({ annonce, onValidate, onReject, onDelete }) => (
  <div data-testid={`card-${annonce.id}`}>
    <span>{annonce.title}</span>
    <button onClick={() => onValidate(annonce.id)}>validate</button>
    <button onClick={() => onReject(annonce.id, 'raison')}>reject</button>
    <button onClick={() => onDelete(annonce.id)}>delete</button>
  </div>
));
jest.mock('../styles/AdminDashboard.css', () => ({}));

const makeResponse = (body, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(body),
});

const adminUser = { id: 1, username: 'SuperAdmin', email: 'admin@test.com', role: 'admin' };
const regularUser = { id: 2, username: 'JohnDoe', email: 'john@test.com', role: 'user' };
const mockAnnonces = [
  { id: 1, title: 'Annonce A', status: 'pending' },
  { id: 2, title: 'Annonce B', status: 'pending' },
];

function renderWithAuth(user, authFetchImpl) {
  const authFetch = authFetchImpl || jest.fn(() => Promise.resolve(makeResponse(mockAnnonces)));
  return {
    authFetch,
    ...render(
      <AuthContext.Provider value={{ user, authFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    ),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  window.alert = jest.fn();
  window.confirm = jest.fn(() => true);
});

describe("Contrôle d'accès", () => {
  it("affiche 'Accès refusé' si user est null", () => {
    render(
      <AuthContext.Provider value={{ user: null, authFetch: jest.fn() }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );
    expect(screen.getByText(/Accès refusé/i)).toBeInTheDocument();
  });

  it("affiche 'Accès refusé' si user n'est pas admin", () => {
    renderWithAuth(regularUser);
    expect(screen.getByText(/Accès refusé/i)).toBeInTheDocument();
  });

  it('affiche le dashboard si user est admin', async () => {
    renderWithAuth(adminUser);
    expect(await screen.findByText(/Tableau de Bord Admin/i)).toBeInTheDocument();
  });
});

describe('Chargement des annonces', () => {
  it('affiche les annonces récupérées', async () => {
    renderWithAuth(adminUser);
    expect(await screen.findByTestId('card-1')).toBeInTheDocument();
    expect(await screen.findByTestId('card-2')).toBeInTheDocument();
  });

  it('accepte une réponse { annonces: [...] }', async () => {
    const authFetch = jest.fn(() =>
      Promise.resolve(makeResponse({ annonces: [{ id: 3, title: 'Annonce C' }] }))
    );
    renderWithAuth(adminUser, authFetch);
    expect(await screen.findByTestId('card-3')).toBeInTheDocument();
  });

  it('affiche le message vide si aucune annonce', async () => {
    const authFetch = jest.fn(() => Promise.resolve(makeResponse([])));
    renderWithAuth(adminUser, authFetch);
    expect(await screen.findByText(/Aucune annonce trouvée/i)).toBeInTheDocument();
  });

  it('affiche une erreur si la requête échoue (500)', async () => {
    const authFetch = jest.fn(() => Promise.resolve(makeResponse({}, 500)));
    renderWithAuth(adminUser, authFetch);
    expect(await screen.findByText(/Erreur lors du chargement/i)).toBeInTheDocument();
  });

  it('affiche une erreur si fetch throw', async () => {
    const authFetch = jest.fn(() => Promise.reject(new Error('Network error')));
    renderWithAuth(adminUser, authFetch);
    expect(await screen.findByText(/Erreur lors du chargement/i)).toBeInTheDocument();
  });
});

describe('Filtres', () => {
  it("utilise l'URL /admin/annonces/pending par défaut", async () => {
    const { authFetch } = renderWithAuth(adminUser);
    await screen.findByTestId('card-1');
    expect(authFetch).toHaveBeenCalledWith(expect.stringContaining('/admin/annonces/pending'));
  });

  it('utilise /admin/annonces quand filtre = all', async () => {
    const { authFetch } = renderWithAuth(adminUser);
    await screen.findByText(/Toutes/i);

    await act(async () => { screen.getByText(/Toutes/i).click(); });

    await waitFor(() => {
      const calls = authFetch.mock.calls.map(c => c[0]);
      expect(calls.some(url => url.endsWith('/admin/annonces'))).toBe(true);
    });
  });

  it('utilise /admin/annonces/validated quand filtre = validated', async () => {
    const { authFetch } = renderWithAuth(adminUser);
    await screen.findByText(/Validées/i);

    await act(async () => { screen.getByText(/Validées/i).click(); });

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(expect.stringContaining('/admin/annonces/validated'));
    });
  });
});

describe('Actions sur les annonces', () => {
  it('valide une annonce et la retire de la liste', async () => {
    const authFetch = jest.fn()
      .mockResolvedValueOnce(makeResponse(mockAnnonces))
      .mockResolvedValueOnce(makeResponse({ success: true }));

    renderWithAuth(adminUser, authFetch);
    await screen.findByTestId('card-1');

    await act(async () => { screen.getAllByText('validate')[0].click(); });

    expect(await screen.findByTestId('card-2')).toBeInTheDocument();
    expect(screen.queryByTestId('card-1')).not.toBeInTheDocument();
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('validée'));
  });

  it('rejette une annonce et la retire de la liste', async () => {
    const authFetch = jest.fn()
      .mockResolvedValueOnce(makeResponse(mockAnnonces))
      .mockResolvedValueOnce(makeResponse({ success: true }));

    renderWithAuth(adminUser, authFetch);
    await screen.findByTestId('card-1');

    await act(async () => { screen.getAllByText('reject')[0].click(); });

    expect(await screen.findByTestId('card-2')).toBeInTheDocument();
    expect(screen.queryByTestId('card-1')).not.toBeInTheDocument();
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('rejetée'));
  });

  it('supprime une annonce après confirmation', async () => {
    const authFetch = jest.fn()
      .mockResolvedValueOnce(makeResponse(mockAnnonces))
      .mockResolvedValueOnce(makeResponse({ success: true }));

    renderWithAuth(adminUser, authFetch);
    await screen.findByTestId('card-1');

    await act(async () => { screen.getAllByText('delete')[0].click(); });

    expect(await screen.findByTestId('card-2')).toBeInTheDocument();
    expect(screen.queryByTestId('card-1')).not.toBeInTheDocument();
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('supprimée'));
  });

  it("ne supprime pas si l'utilisateur annule la confirmation", async () => {
    window.confirm = jest.fn(() => false);
    const authFetch = jest.fn().mockResolvedValueOnce(makeResponse(mockAnnonces));

    renderWithAuth(adminUser, authFetch);
    await screen.findByTestId('card-1');

    await act(async () => { screen.getAllByText('delete')[0].click(); });

    expect(screen.getByTestId('card-1')).toBeInTheDocument();
    expect(authFetch).toHaveBeenCalledTimes(1);
  });

  it('affiche une alerte si la validation échoue', async () => {
    const authFetch = jest.fn()
      .mockResolvedValueOnce(makeResponse(mockAnnonces))
      .mockResolvedValueOnce(makeResponse({}, 500));

    renderWithAuth(adminUser, authFetch);
    await screen.findByTestId('card-1');

    await act(async () => { screen.getAllByText('validate')[0].click(); });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Erreur'));
    });
  });
});

describe('Affichage', () => {
  it("affiche le username de l'admin dans le sous-titre", async () => {
    renderWithAuth(adminUser);
    expect(await screen.findByText(/SuperAdmin/)).toBeInTheDocument();
  });
});