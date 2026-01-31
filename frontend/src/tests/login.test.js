import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import Login from '../pages/Login';

/**
 * TEST UI : PAGE LOGIN
 * ✅ Justification Lead Dev : Validation de la résilience de l'interface.
 */
describe('📝 Test UI Métier : Page Login', () => {
  const mockLogin = jest.fn();

  const renderLogin = () => render(
    <AuthContext.Provider value={{ login: mockLogin }}>
      <BrowserRouter><Login /></BrowserRouter>
    </AuthContext.Provider>
  );

  it('⚠️ Doit afficher une erreur en cas d’identifiants invalides', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Identifiants invalides'));
    renderLogin();
    
    // ✅ Meilleure pratique : Requêtes via screen.getBy...
    fireEvent.change(screen.getByPlaceholderText('ton@email.com'), { target: { value: 'bad@email.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByText('Se connecter'));

    await waitFor(() => {
      expect(screen.getByText('Identifiants invalides')).toBeTruthy();
    });
  });
});