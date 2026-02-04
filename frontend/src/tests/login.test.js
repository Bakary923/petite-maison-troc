import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import Login from '../pages/login';

// ============================================================
// 🧪 MOCK DU COMPOSANT SIGNUP
// ------------------------------------------------------------
// On remplace le vrai composant Signup par un composant factice.
// Cela évite de charger toute la logique d'inscription pendant ce test.
// ============================================================
jest.mock('../pages/signup', () => () => <div data-testid="signup-page">Signup Page</div>);

// ============================================================
// 🧪 MOCK DE useNavigate()
// ------------------------------------------------------------
// CRA + Jest + ESM ne supportent pas jest.requireActual().
// On surcharge uniquement useNavigate, le reste est mocké
// automatiquement via __mocks__/react-router-dom.js.
// ============================================================
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

describe('🔐 Page Login', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // 1) TEST : Connexion réussie
  // ------------------------------------------------------------
  // Objectif :
  // - remplir email + mot de passe
  // - cliquer sur "Se connecter"
  // - vérifier que login() est appelé avec les bons paramètres
  // - vérifier que navigate('/') est appelé
  // ============================================================
  it('effectue un login et redirige vers /', async () => {
    // Simule une connexion réussie
    mockLogin.mockResolvedValueOnce({ username: 'Bakary' });

    render(
      <AuthContext.Provider value={{ login: mockLogin }}>
        <Login />
      </AuthContext.Provider>
    );

    // Remplir l'email
    fireEvent.change(screen.getByPlaceholderText(/@email\.com/i), {
      target: { value: 'test@email.com' }
    });

    // Remplir le mot de passe
    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'secret' }
    });

    // Cliquer sur "Se connecter"
    fireEvent.click(screen.getByText(/se connecter/i));

    // Vérifier que login() a été appelé avec les bons arguments
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@email.com',
        password: 'secret'
      });
    });

    // Vérifier la redirection
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // ============================================================
  // 2) TEST : Connexion échouée
  // ------------------------------------------------------------
  // Objectif :
  // - simuler une erreur dans login()
  // - vérifier que le message d'erreur s'affiche
  // ============================================================
  it('affiche une erreur si login échoue', async () => {
    // Simule une erreur renvoyée par login()
    mockLogin.mockRejectedValueOnce(new Error('Identifiants invalides'));

    render(
      <AuthContext.Provider value={{ login: mockLogin }}>
        <Login />
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/@email\.com/i), {
      target: { value: 'wrong@email.com' }
    });

    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'badpass' }
    });

    fireEvent.click(screen.getByText(/se connecter/i));

    // Vérifie que le message d'erreur apparaît
    await waitFor(() => {
      expect(screen.getByText(/identifiants invalides/i)).toBeInTheDocument();
    });
  });

  // ============================================================
  // 3) TEST : Affichage du composant Signup
  // ------------------------------------------------------------
  // Objectif :
  // - cliquer sur "Créer un compte"
  // - vérifier que le composant Signup mocké s'affiche
  // ============================================================
  it('affiche la page Signup quand on clique sur Créer un compte', () => {
    render(
      <AuthContext.Provider value={{ login: mockLogin }}>
        <Login />
      </AuthContext.Provider>
    );

    // Cliquer sur "Créer un compte"
    fireEvent.click(screen.getByText(/créer un compte/i));

    // Vérifier que le composant Signup mocké apparaît
    expect(screen.getByTestId('signup-page')).toBeInTheDocument();
  });
});
