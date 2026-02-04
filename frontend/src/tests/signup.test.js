import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import Signup from '../pages/signup';

// ✅ SOLUTION CI : Simulation du routeur pour l'inscription
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

/**
 * TEST MÉTIER : Inscription (Signup)
 * Objectif : Valider la vérification de sécurité des mots de passe.
 */
describe('📝 Page Signup', () => {
  const mockRegister = jest.fn();

  it('⚠️ Bloque l’inscription si les mots de passe ne correspondent pas', async () => {
    render(
      <AuthContext.Provider value={{ register: mockRegister }}>
          <Signup />
      </AuthContext.Provider>
    );

    // Utilisation du placeholder réel défini dans le composant
    fireEvent.change(screen.getByPlaceholderText("Mon pseudo"), { target: { value: 'Bakary' } });
    fireEvent.change(screen.getByPlaceholderText('ton@email.com'), { target: { value: 'test@test.com' } });
    
    const passwordInputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(passwordInputs[0], { target: { value: 'Password123' } });
    fireEvent.change(passwordInputs[1], { target: { value: 'Different456' } });

    fireEvent.click(screen.getByText("S'inscrire"));

    await waitFor(() => {
      expect(screen.getByText('Les mots de passe ne correspondent pas')).toBeTruthy();
    });
    expect(mockRegister).not.toHaveBeenCalled();
  });
});