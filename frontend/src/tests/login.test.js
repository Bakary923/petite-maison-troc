import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import Login from '../pages/login';

// Mock du composant Signup pour éviter d'importer tout le fichier
jest.mock('../pages/signup', () => () => <div data-testid="signup-page">Signup Page</div>);

// Mock du useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('🔐 Page Login', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------
  // 1) Connexion réussie
  // ---------------------------------------------------------
  it('effectue un login et redirige vers /', async () => {
    mockLogin.mockResolvedValueOnce({ username: 'Bakary' });

    render(
      <AuthContext.Provider value={{ login: mockLogin }}>
        <Login />
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/@email\.com/i), {
      target: { value: 'test@email.com' }
    });

    fireEvent.change(screen.getByPlaceholderText(/••••••••/i), {
      target: { value: 'secret' }
    });

    fireEvent.click(screen.getByText(/se connecter/i));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@email.com',
        password: 'secret'
      });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // ---------------------------------------------------------
  // 2) Connexion échouée → affiche une erreur
  // ---------------------------------------------------------
  it('affiche une erreur si login échoue', async () => {
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

    await waitFor(() => {
      expect(screen.getByText(/identifiants invalides/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------
  // 3) Affichage du composant Signup
  // ---------------------------------------------------------
  it('affiche la page Signup quand on clique sur Créer un compte', () => {
    render(
      <AuthContext.Provider value={{ login: mockLogin }}>
        <Login />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText(/créer un compte/i));

    expect(screen.getByTestId('signup-page')).toBeInTheDocument();
  });
});
