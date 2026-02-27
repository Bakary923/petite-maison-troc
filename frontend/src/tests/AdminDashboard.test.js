// AdminDashboard.test.js
import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from './AdminDashboard';

// ─── Mocks ────────────────────────────────────────────────────────────────────
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

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

// ─── Factory de rendu avec contexte ──────────────────────────────────────────
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

// ─── Setup ────────────────────────────────────────────────────────────────────
beforeEach(() => {
  jest.clearAllMocks();
  window.alert = jest.fn();
  window.confirm = jest.fn(() => true);
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. Contrôle d'accès
// ══════════════════════════════════════════════════════════════════════════════
describe('Contrôle d\'accès', () => {
  it('affiche "Accès refusé" si user est null', () => {
    render(
      <AuthContext.Provider value={{ user: null, authFetch: jest.fn() }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );
    expect(screen.getByText(/Accès refusé/i)).toBeInTheDocument();
  });

  it('affiche "Accès refusé" si user n\'est pas admin', () => {
    renderWithAuth(regularUser);
    expect(screen.getByText(/Accès refusé/i)).toBeInTheDocument();
  });

  it('affiche le dashboard si user est admin', async () => {
    renderWithAuth(adminUser);
    await waitFor(() => {
      expect(screen.getByText(/Tableau de Bord Admin/i)).toBeInTheDocument();
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Chargement des annonces
// ══════════════════════════════════════════════════════════════════════════════
describe('Chargement des annonces', () => {
  it('affiche les annonces récupérées', async () => {
    renderWithAuth(adminUser);
    await waitFor(() => {
      expect(screen.getByTestId('card-1')).toBeInTheDocument();
      expect(screen.getByTestId('card-2')).toBeInTheDocument();
    });
  });

  it('accepte une réponse { annonces: [...] }', async () => {
    const authFetch = jest.fn(() =>
      Promise.resolve(makeResponse({ annonces: [{ id: 3, title: 'Annonce C' }] }))
    );
    renderWithAuth(adminUser, authFetch);
    await waitFor(() => {
      expect(screen.getByTestId('card-3')).toBeInTheDocument();
    });
  });

  it('affiche le message vide si aucune annonce', async () => {
    const authFetch = jest.fn(() => Promise.resolve(makeResponse([])));
    renderWithAuth(adminUser, authFetch);
    await waitFor(() => {
      expect(screen.getByText(/Aucune annonce trouvée/i)).toBeInTheDocument();
    });
  });

  it('affiche une erreur si la requête échoue', async () => {
    const authFetch = jest.fn(() => Promise.resolve(makeResponse({}, 500)));
    renderWithAuth(adminUser, authFetch);
    await waitFor(() => {
      expect(screen.getByText(/Erreur lors du chargement/i)).toBeInTheDocument();
    });
  });

  it('affiche une erreur si fetch throw', async () => {
    const authFetch = jest.fn(() => Promise.reject(new Error('Network error')));
    renderWithAuth(adminUser, authFetch);
    await waitFor(() => {
      expect(screen.getByText(/Erreur lors du chargement/i)).toBeInTheDocument();
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Filtres
// ══════════════════════════════════════════════════════════════════════════════
describe('Filtres', () => {
  it('utilise l\'URL /admin/annonces/pending par défaut', async () => {
    const { authFetch } = renderWithAuth(adminUser);
    await waitFor(() => screen.getByTestId('card-1'));
    expect(authFetch).toHaveBeenCalledWith(
      expect.stringContaining('/admin/annonces/pending')
    );
  });

  it('utilise /admin/annonces quand filtre = all', async () => {
    const { authFetch } = renderWithAuth(adminUser);
    await waitFor(() => screen.getByText(/Toutes/i));

    await act(async () => {
      screen.getByText(/Toutes/i).click();
    });

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/annonces'),
      );
    });
    // S'assure que l'URL exacte sans filtre est appelée
    const calls = authFetch.mock.calls.map(c => c[0]);
    expect(calls.some(url => url.endsWith('/admin/annonces'))).toBe(true);
  });

  it('utilise /admin/annonces/validated quand filtre = validated', async () => {
    const { authFetch } = renderWithAuth(adminUser);
    await waitFor(() => screen.getByText(/Validées/i));

    await act(async () => {
      screen.getByText(/Validées/i).click();
    });

    await waitFor(() => {
      expect(authFetch).toHaveBeenCalledWith(
        expect.stringContaining('/admin/annonces/validated')
      );
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Actions (validate / reject / delete)
// ══════════════════════════════════════════════════════════════════════════════
describe('Actions sur les annonces', () => {
  it('valide une annonce et la retire de la liste', async () => {
    const authFetch = jest.fn()
      .mockResolvedValueOnce(makeResponse(mockAnnonces))          // fetch initial
      .mockResolvedValueOnce(makeResponse({ success: true }));    // PUT validate

    renderWithAuth(adminUser, authFetch);
    await waitFor(() => screen.getByTestId('card-1'));

    await act(async () => {
      screen.getAllByText('validate')[0].click();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('card-1')).not.toBeInTheDocument();
    });
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('validée'));
  });

  it('rejette une annonce et la retire de la liste', async () => {
    const authFetch = jest.fn()
      .mockResolvedValueOnce(makeResponse(mockAnnonces))
      .mockResolvedValueOnce(makeResponse({ success: true }));

    renderWithAuth(adminUser, authFetch);
    await waitFor(() => screen.getByTestId('card-1'));

    await act(async () => {
      screen.getAllByText('reject')[0].click();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('card-1')).not.toBeInTheDocument();
    });
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('rejetée'));
  });

  it('supprime une annonce après confirmation', async () => {
    const authFetch = jest.fn()
      .mockResolvedValueOnce(makeResponse(mockAnnonces))
      .mockResolvedValueOnce(makeResponse({ success: true }));

    renderWithAuth(adminUser, authFetch);
    await waitFor(() => screen.getByTestId('card-1'));

    await act(async () => {
      screen.getAllByText('delete')[0].click();
    });

    await waitFor(() => {
      expect(screen.queryByTestId('card-1')).not.toBeInTheDocument();
    });
    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('supprimée'));
  });

  it('ne supprime pas si l\'utilisateur annule la confirmation', async () => {
    window.confirm = jest.fn(() => false);
    const authFetch = jest.fn().mockResolvedValueOnce(makeResponse(mockAnnonces));

    renderWithAuth(adminUser, authFetch);
    await waitFor(() => screen.getByTestId('card-1'));

    await act(async () => {
      screen.getAllByText('delete')[0].click();
    });

    expect(screen.getByTestId('card-1')).toBeInTheDocument();
    expect(authFetch).toHaveBeenCalledTimes(1); // seulement le fetch initial
  });

  it('affiche une alerte si la validation échoue', async () => {
    const authFetch = jest.fn()
      .mockResolvedValueOnce(makeResponse(mockAnnonces))
      .mockResolvedValueOnce(makeResponse({}, 500));

    renderWithAuth(adminUser, authFetch);
    await waitFor(() => screen.getByTestId('card-1'));

    await act(async () => {
      screen.getAllByText('validate')[0].click();
    });

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Erreur'));
    });
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. Affichage du nom d'utilisateur
// ══════════════════════════════════════════════════════════════════════════════
describe('Affichage', () => {
  it('affiche le username de l\'admin dans le sous-titre', async () => {
    renderWithAuth(adminUser);
    await waitFor(() => {
      expect(screen.getByText(/SuperAdmin/)).toBeInTheDocument();
    });
  });
});