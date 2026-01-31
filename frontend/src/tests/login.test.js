import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/login';

/**
 * TEST UI : Page Login
 *
 * Objectif :
 * - Vérifier la gestion des erreurs d'identifiants invalides
 * - Validation de l'interface et de la résilience
 * ✅ Compatible CI : Node + Jest, MemoryRouter utilisé pour simuler le routing
 */
describe('📝 Page Login', () => {
  const mockLogin = jest.fn();

  const renderLogin = () => render(
    <AuthContext.Provider value={{ login: mockLogin }}>
      <MemoryRouter><Login /></MemoryRouter>
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
