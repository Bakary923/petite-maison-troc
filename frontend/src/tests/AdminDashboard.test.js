import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AdminDashboard from '../pages/AdminDashboard';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// ==========================================================
// MOCKS & CONFIGURATION
// ==========================================================

// On mocke les fonctions globales pour éviter les erreurs dans la console de test
// et satisfaire les règles de sécurité SonarCloud sur les fonctions bloquantes.
console.error = jest.fn();
window.confirm = jest.fn(() => true); // Simule "OK" sur la boîte de confirmation
window.alert = jest.fn();

const mockAuthFetch = jest.fn();

/**
 * Helper pour injecter le contexte Auth et le Router
 */
const renderAdminDashboard = (user) => {
  return render(
    <AuthContext.Provider value={{ user, authFetch: mockAuthFetch }}>
      <BrowserRouter>
        <AdminDashboard />
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('🛠 AdminDashboard - Couverture Totale SonarCloud', () => {
  const adminUser = { username: 'Admin', role: 'admin' };
  const mockAnnonces = [
    { 
      id: 1, 
      titre: 'Annonce Test', 
      description: 'Description de test', 
      statut: 'pending',
      prix: 10,
      categorie: 'Meubles'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // 1. TEST DE SÉCURITÉ (COUVRE LE PREMIER USEEFFECT)
  it('❌ affiche un message d\'erreur si l\'utilisateur n\'est pas admin', async () => {
    renderAdminDashboard({ username: 'User', role: 'user' });
    expect(screen.getByText(/pas autorisé à accéder à cette page/i)).toBeInTheDocument();
  });

  // 2. TEST DE CHARGEMENT RÉUSSI
  it('✅ affiche les annonces chargées avec succès', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAnnonces,
    });

    renderAdminDashboard(adminUser);

    // Vérifie que le titre de l'annonce apparaît
    await waitFor(() => {
      expect(screen.getByText('Annonce Test')).toBeInTheDocument();
    });
  });

  // 3. TEST DE FILTRAGE (COUVRE LA LOGIQUE DE CONSTRUCTION D'URL)
  it('🔍 change le filtre d\'API lors du clic sur les boutons de navigation', async () => {
    mockAuthFetch.mockResolvedValue({
      ok: true,
      json: async () => mockAnnonces,
    });

    renderAdminDashboard(adminUser);
    await waitFor(() => screen.getByText('Annonce Test'));

    // Clic sur le bouton "Validées"
    const validBtn = screen.getByText(/validées/i);
    fireEvent.click(validBtn);

    // Vérifie que authFetch a été appelé avec le bon paramètre d'URL
    expect(mockAuthFetch).toHaveBeenCalledWith(
      expect.stringContaining('filter=validated'),
      expect.anything()
    );
  });

  // 4. TEST D'ACTION : VALIDATION (COUVRE HANDLEVALIDATE)
  it('✔️ appelle l\'API de validation quand on clique sur le bouton Valider', async () => {
    // 1er appel : chargement initial / 2ème appel : l'action de validation
    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockAnnonces })
      .mockResolvedValueOnce({ ok: true });

    renderAdminDashboard(adminUser);
    await waitFor(() => screen.getByText('Annonce Test'));

    // On clique sur le bouton "Valider" (assure-toi que le texte existe dans AdminCard)
    const btn = screen.getByText(/valider/i);
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/validate'),
        expect.objectContaining({ method: 'PUT' })
      );
    });
  });

  // 5. TEST D'ACTION : REJET (COUVRE HANDLEREJECT ET PROMPT)
  it('🚫 appelle l\'API de rejet quand on clique sur Refuser', async () => {
    window.prompt = jest.fn(() => 'Motif du test');
    mockAuthFetch
      .mockResolvedValueOnce({ ok: true, json: async () => mockAnnonces })
      .mockResolvedValueOnce({ ok: true });

    renderAdminDashboard(adminUser);
    await waitFor(() => screen.getByText('Annonce Test'));

    const btn = screen.getByText(/refuser/i);
    fireEvent.click(btn);

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalledWith(
        expect.stringContaining('/reject'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ reason: 'Motif du test' })
        })
      );
    });
  });

  // 6. TEST DE GESTION DES ERREURS (COUVRE LES BLOCS CATCH)
  it('⚠️ gère les erreurs de chargement réseau', async () => {
    mockAuthFetch.mockRejectedValueOnce(new Error('Erreur Serveur'));

    renderAdminDashboard(adminUser);

    await waitFor(() => {
      expect(screen.getByText(/erreur lors du chargement/i)).toBeInTheDocument();
    });
    expect(console.error).toHaveBeenCalled();
  });
});