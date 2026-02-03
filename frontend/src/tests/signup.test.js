import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import Signup from '../pages/signup';

// ✅ SOLUTION CI : Mock manuel pour éviter l'erreur "Cannot find module react-router-dom"
// On simule MemoryRouter pour que le test puisse s'exécuter sans le module physique
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn(),
  MemoryRouter: ({ children }) => <div>{children}</div>,
  Link: ({ children }) => <a>{children}</a>,
  Navigate: () => null,
}));

/**
 * TEST MÉTIER : Inscription (Signup)
 *
 * Objectif :
 * - Vérifier la validation des mots de passe
 * - Assurer la résilience de l'interface lors d'erreurs
 * ✅ Compatible CI : Node + Jest, MemoryRouter utilisé
 * ✅ Conformité ESLint : Utilisation exclusive de `screen`
 */
describe('📝 Page Signup', () => {
  const mockRegister = jest.fn();

  it('⚠️ Bloque l’inscription si les mots de passe ne correspondent pas', async () => {
    render(
      <AuthContext.Provider value={{ register: mockRegister }}>
          <Signup />
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByPlaceholderText("Nom d'utilisateur"), { target: { value: 'Bakary' } });
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
