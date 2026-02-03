import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import Login from '../pages/login';

// ✅ MOCK CI : Remplace totalement react-router-dom pour éviter les erreurs Ubuntu
jest.mock('react-router-dom', () => ({
  MemoryRouter: ({ children }) => <div>{children}</div>,
  useNavigate: () => jest.fn(),
  Link: ({ children }) => <a>{children}</a>,
  Navigate: () => null,
}));

/**
 * TEST UI : Page Login
 *
 * Objectif :
 * - Vérifier la gestion des erreurs d'identifiants invalides
 * - Validation de l'interface et de la résilience
 * ✅ Compatible CI : Node + Jest, MemoryRouter simulé
 */
describe('📝 Page Login', () => {
  const mockLogin = jest.fn();

  const renderLogin = () => render(
    <AuthContext.Provider value={{ login: mockLogin }}>
      <Login />
    </AuthContext.Provider>
  );

  it('⚠️ Affiche une erreur si identifiants invalides', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Identifiants invalides'));
    renderLogin();
    
    fireEvent.change(screen.getByPlaceholderText('ton@email.com'), { target: { value: 'bad@email.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByText('Se connecter'));

    await waitFor(() => {
      expect(screen.getByText('Identifiants invalides')).toBeTruthy();
    });
  });
});
