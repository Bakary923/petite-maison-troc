import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import Navbar from '../components/Navbar';

// ============================================================
// 🧪 MOCK DU NAVIGATE
// ------------------------------------------------------------
// On surcharge uniquement useNavigate, car CRA + Jest + ESM
// ne supportent pas jest.requireActual().
// ============================================================
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}));

describe('🧭 Navbar', () => {
  const mockLogout = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------
  // 1) Navbar quand user = null
  // ---------------------------------------------------------
  it('affiche Connexion et Créer un compte quand user = null', () => {
    render(
      <AuthContext.Provider value={{ user: null, logout: mockLogout }}>
        <Navbar />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/connexion/i)).toBeInTheDocument();
    expect(screen.getByText(/créer un compte/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------
  // 2) Navigation vers /login
  // ---------------------------------------------------------
  it('redirige vers /login quand on clique sur Connexion', () => {
    render(
      <AuthContext.Provider value={{ user: null, logout: mockLogout }}>
        <Navbar />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText(/connexion/i));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  // ---------------------------------------------------------
  // 3) Navigation vers /signup
  // ---------------------------------------------------------
  it('redirige vers /signup quand on clique sur Créer un compte', () => {
    render(
      <AuthContext.Provider value={{ user: null, logout: mockLogout }}>
        <Navbar />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText(/créer un compte/i));
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  // ---------------------------------------------------------
  // 4) Navbar quand user connecté
  // ---------------------------------------------------------
  it('affiche le nom de l’utilisateur et le bouton déconnexion', () => {
    render(
      <AuthContext.Provider value={{ user: { username: 'Bakary', role: 'user' }, logout: mockLogout }}>
        <Navbar />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/bonsoir, bakary/i)).toBeInTheDocument();
    expect(screen.getByText(/se déconnecter/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------
  // 5) Déconnexion → logout() + navigate('/')
  // ---------------------------------------------------------
  it('appelle logout et redirige vers / lors de la déconnexion', () => {
    render(
      <AuthContext.Provider value={{ user: { username: 'Bakary', role: 'user' }, logout: mockLogout }}>
        <Navbar />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText(/se déconnecter/i));

    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // ---------------------------------------------------------
  // 6) Affichage du bouton Admin (user.role === "admin")
  // ---------------------------------------------------------
  it('affiche le bouton Admin pour un utilisateur admin', () => {
    render(
      <AuthContext.Provider value={{ user: { username: 'Admin', role: 'admin' }, logout: mockLogout }}>
        <Navbar />
      </AuthContext.Provider>
    );

    // 🎯 On cible UNIQUEMENT le bouton Admin, pas "Bonsoir, Admin"
    const adminButton = screen.getByRole('button', { name: /admin/i });
    expect(adminButton).toBeInTheDocument();
  });

  // ---------------------------------------------------------
  // 7) Navigation vers /admin via le bouton Admin
  // ---------------------------------------------------------
  it('redirige vers /admin quand on clique sur le bouton Admin', () => {
    render(
      <AuthContext.Provider value={{ user: { username: 'Admin', role: 'admin' }, logout: mockLogout }}>
        <Navbar />
      </AuthContext.Provider>
    );

    // 🎯 Même logique : on cible le bouton, pas le texte dans "Bonsoir, Admin"
    const adminButton = screen.getByRole('button', { name: /admin/i });

    fireEvent.click(adminButton);

    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  // ---------------------------------------------------------
  // 8) Navigation vers /annonces
  // ---------------------------------------------------------
  it('redirige vers /annonces quand on clique sur Annonces', () => {
    render(
      <AuthContext.Provider value={{ user: null, logout: mockLogout }}>
        <Navbar />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText(/annonces/i));
    expect(mockNavigate).toHaveBeenCalledWith('/annonces');
  });

  // ---------------------------------------------------------
  // 9) Navigationn vers / via le logo
  // ---------------------------------------------------------
  it('redirige vers / quand on clique sur le logo', () => {
    render(
      <AuthContext.Provider value={{ user: null, logout: mockLogout }}>
        <Navbar />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText(/la petite maison épouvante/i));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});
