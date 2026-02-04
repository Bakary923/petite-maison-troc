import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import AdminDashboard from '../pages/AdminDashboard';

/*  
============================================================
🧪 MOCK AdminCard
------------------------------------------------------------
On ne veut PAS rendre le vrai composant AdminCard car :
- il contient du style
- il contient des boutons
- il peut déclencher des effets secondaires

Donc on le remplace par un composant simple qui affiche juste
le titre de l’annonce. Cela rend le test plus stable.
============================================================
*/
jest.mock('../components/AdminCard', () => ({ annonce }) => (
  <div data-testid="admin-card">{annonce.titre}</div>
));

/*
============================================================
🧪 MOCK authFetch
------------------------------------------------------------
AdminDashboard utilise authFetch pour appeler l’API admin.
On le mocke pour contrôler les réponses et éviter les vrais appels réseau.
============================================================
*/
const mockAuthFetch = jest.fn();

describe('🔐 AdminDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks(); // Nettoyage entre chaque test
  });

  /*
  ============================================================
  1) TEST : Accès refusé si user NON admin
  ------------------------------------------------------------
  Le composant doit afficher un message d’erreur et NE PAS
  tenter de charger les annonces.
  ============================================================
  */
  it('affiche un message d’accès refusé si user non admin', () => {
    render(
      <AuthContext.Provider value={{ user: { role: 'user' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/accès refusé/i)).toBeInTheDocument();
    expect(screen.getByText(/administrateur/i)).toBeInTheDocument();
  });

  /*
  ============================================================
  2) TEST : Chargement et affichage des annonces admin
  ------------------------------------------------------------
  On simule une réponse API contenant deux annonces.
  On utilise findByText car :
  - il attend automatiquement que l’élément apparaisse
  - il remplace waitFor + getByText (ESLint l’exige)
  ============================================================
  */
  it('charge et affiche les annonces admin', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => [
        { id: 1, titre: 'Annonce A' },
        { id: 2, titre: 'Annonce B' }
      ]
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin', username: 'Bakary' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    // ✔️ findByText attend automatiquement la fin du chargement
    expect(await screen.findByText(/annonce a/i)).toBeInTheDocument();
    expect(await screen.findByText(/annonce b/i)).toBeInTheDocument();
  });

  /*
  ============================================================
  3) TEST : Changement de filtre
  ------------------------------------------------------------
  On doit vérifier que :
  - cliquer sur "Validées" rappelle authFetch
  - cliquer sur "Rejetées" rappelle authFetch
  - cliquer sur "Toutes" rappelle authFetch

  IMPORTANT :
  On attend d’abord que les boutons soient visibles AVANT de cliquer.
  Sinon React n’a pas fini de charger → erreurs act() et éléments introuvables.
  ============================================================
  */
  it('rappelle authFetch quand on change de filtre', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => []
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    // ✔️ On attend que TOUS les boutons de filtre soient visibles
    const btnPending = await screen.findByText(/en attente/i);
    const btnValidated = await screen.findByText(/validées/i);
    const btnRejected = await screen.findByText(/rejetées/i);
    const btnAll = await screen.findByText(/toutes/i);

    // Premier appel automatique au chargement
    expect(mockAuthFetch).toHaveBeenCalledTimes(1);

    // VALIDÉES
    fireEvent.click(btnValidated);
    expect(mockAuthFetch).toHaveBeenCalledTimes(2);

    // REJETÉES
    fireEvent.click(btnRejected);
    expect(mockAuthFetch).toHaveBeenCalledTimes(3);

    // TOUTES
    fireEvent.click(btnAll);
    expect(mockAuthFetch).toHaveBeenCalledTimes(4);
  });

  /*
  ============================================================
  4) TEST : État vide
  ------------------------------------------------------------
  Si l’API renvoie [], le dashboard doit afficher :
  "Aucune annonce trouvée pour ce filtre."
  ============================================================
  */
  it('affiche un état vide si aucune annonce', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });

    render(
      <AuthContext.Provider value={{ user: { role: 'admin' }, authFetch: mockAuthFetch }}>
        <AdminDashboard />
      </AuthContext.Provider>
    );

    expect(await screen.findByText(/aucune annonce trouvée/i)).toBeInTheDocument();
  });
});
