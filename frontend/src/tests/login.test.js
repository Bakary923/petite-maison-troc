import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import Login from '../pages/login';

// Mock global pour la CI
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  Link: ({ children }) => <div>{children}</div>
}));

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