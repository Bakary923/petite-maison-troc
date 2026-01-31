import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import Signup from '../pages/Signup';

/**
 * TEST MÉTIER : INSCRIPTION (SIGNUP)
 * ✅ Conformité ESLint : Utilisation exclusive de l'objet 'screen'.
 */
describe('📝 Test UI Métier : Page Signup', () => {
  const mockRegister = jest.fn();

  it('⚠️ Doit bloquer l’inscription si les mots de passe ne correspondent pas', async () => {
    render(
      <AuthContext.Provider value={{ register: mockRegister }}>
        <BrowserRouter>
          <Signup />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    // Saisie des données via screen
    fireEvent.change(screen.getByPlaceholderText("Nom d'utilisateur"), { target: { value: 'Bakary' } });
    fireEvent.change(screen.getByPlaceholderText('ton@email.com'), { target: { value: 'test@test.com' } });
    
    // Récupération des deux champs Password & Confirm via placeholder commun
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(passwordInputs[0], { target: { value: 'Password123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'Different456' } });

    fireEvent.click(screen.getByText("S'inscrire"));

    // Validation de l'erreur locale
    await waitFor(() => {
      expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeTruthy();
    });
    
    expect(mockRegister).not.toHaveBeenCalled();
  });
});