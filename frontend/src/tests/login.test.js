import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';

/**
 * ============================================================================
 * TEST UI MÉTIER : COMPOSANT DE CONNEXION (LOGIN)
 * Objectif : Valider le comportement du formulaire et la gestion des erreurs.
 * Technique : Injection de dépendances via le Provider du Context API.
 * ============================================================================
 */

describe('📝 Test UI Métier : Page Login', () => {
  // Création d'une fonction simulée pour intercepter l'appel au service d'authentification
  const mockLogin = jest.fn();

  /**
   * UTILITAIRE : Rendu du composant Login dans un environnement contrôlé.
   * On injecte le mockLogin pour isoler le test de la vraie logique AuthContext.
   */
  const renderLogin = () => render(
    <AuthContext.Provider value={{ login: mockLogin }}>
      <BrowserRouter>
        <Login />
      </BrowserRouter>
    </AuthContext.Provider>
  );

  /**
   * SCÉNARIO : Gestion des erreurs d'authentification.
   * Objectif : Vérifier que l'UI informe correctement l'utilisateur en cas d'échec.
   */
  it('⚠️ Doit afficher une erreur en cas d’identifiants invalides', async () => {
    // 1. On simule un rejet de la promesse (erreur 401 ou 403 envoyée par l'API)
    mockLogin.mockRejectedValueOnce(new Error('Identifiants invalides'));
    
    const { getByPlaceholderText, getByText } = renderLogin();
    
    // 2. Simulation des interactions utilisateur (Saisie des champs)
    fireEvent.change(getByPlaceholderText('ton@email.com'), { target: { value: 'bad@email.com' } });
    fireEvent.change(getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    
    // 3. Déclenchement de la soumission du formulaire
    fireEvent.click(getByText('Se connecter'));

    // 4. ASSERTION : On attend que le message d'erreur apparaisse dans le DOM
    await waitFor(() => {
      // On vérifie que le texte d'erreur capturé depuis le catch du composant est affiché
      expect(getByText('Identifiants invalides')).toBeTruthy();
    });
  });
});