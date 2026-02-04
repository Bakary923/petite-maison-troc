import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import Signup from '../pages/signup';

// ============================================================
// 🧪 MOCK DU NAVIGATE
// ============================================================
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

describe('📝 Page Signup', () => {
  const mockRegister = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------
  // 1) TEST : Erreur si champs vides
  // ---------------------------------------------------------
  it('affiche une erreur si des champs sont vides', async () => {
    render(
      <AuthContext.Provider value={{ register: mockRegister }}>
        <Signup />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText(/s'inscrire/i));

    expect(screen.getByText(/tous les champs sont requis/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------
  // 2) TEST : Erreur si mots de passe différents
  // ---------------------------------------------------------
  it('affiche une erreur si les mots de passe ne correspondent pas', async () => {
    render(
      <AuthContext.Provider value={{ register: mockRegister }}>
        <Signup />
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/mon pseudo/i), {
      target: { value: 'Baka' }
    });

    fireEvent.change(screen.getByPlaceholderText(/@email\.com/i), {
      target: { value: 'test@email.com' }
    });

    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/i)[0], {
      target: { value: 'pass1' }
    });

    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/i)[1], {
      target: { value: 'pass2' }
    });

    fireEvent.click(screen.getByText(/s'inscrire/i));

    expect(screen.getByText(/les mots de passe ne correspondent pas/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------
  // 3) TEST : Inscription réussie → navigate('/')
  // ---------------------------------------------------------
  it('appelle register et redirige vers / en cas de succès', async () => {
    mockRegister.mockResolvedValueOnce({ username: 'Baka' });

    render(
      <AuthContext.Provider value={{ register: mockRegister }}>
        <Signup />
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/mon pseudo/i), {
      target: { value: 'Baka' }
    });

    fireEvent.change(screen.getByPlaceholderText(/@email\.com/i), {
      target: { value: 'test@email.com' }
    });

    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/i)[0], {
      target: { value: 'secret' }
    });

    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/i)[1], {
      target: { value: 'secret' }
    });

    fireEvent.click(screen.getByText(/s'inscrire/i));

    // Vérifier que register() a été appelé
    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        username: 'Baka',
        email: 'test@email.com',
        password: 'secret'
      });
    });

    // Attendre la redirection (setTimeout 500ms)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  // ---------------------------------------------------------
  // 4) TEST : Erreur API → message affiché
  // ---------------------------------------------------------
  it('affiche une erreur si register échoue', async () => {
    mockRegister.mockRejectedValueOnce(new Error('Email déjà utilisé'));

    render(
      <AuthContext.Provider value={{ register: mockRegister }}>
        <Signup />
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/mon pseudo/i), {
      target: { value: 'Baka' }
    });

    fireEvent.change(screen.getByPlaceholderText(/@email\.com/i), {
      target: { value: 'test@email.com' }
    });

    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/i)[0], {
      target: { value: 'secret' }
    });

    fireEvent.change(screen.getAllByPlaceholderText(/••••••••/i)[1], {
      target: { value: 'secret' }
    });

    fireEvent.click(screen.getByText(/s'inscrire/i));

    await waitFor(() => {
      expect(screen.getByText(/email déjà utilisé/i)).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------
  // 5) TEST : Bouton "Se connecter" → onCancel()
  // ---------------------------------------------------------
  it('appelle onCancel quand on clique sur Se connecter', () => {
    const mockCancel = jest.fn();

    render(
      <AuthContext.Provider value={{ register: mockRegister }}>
        <Signup onCancel={mockCancel} />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText(/se connecter/i));

    expect(mockCancel).toHaveBeenCalled();
  });
});
