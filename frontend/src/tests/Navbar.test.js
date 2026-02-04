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
  // 1) Navbar quand l'utilisateur n'est PAS connecté
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
  // 4) Navbar quand l'utilisateur est connecté (non admin)
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
  // 6) Affichage du bouton Admin si user.role === "admin"
  // ---------------------------------------------------------
  it('affiche le bouton Admin pour un utilisateur admin', () => {
    render(
      <AuthContext.Provider value={{ user: { username: 'Admin', role: 'admin' }, logout: mockLogout }}>
        <Navbar />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/admin/i)).toBeInTheDocument();
  });

  // ---------------------------------------------------------
  // 7) Navigation vers /admin
  // ---------------------------------------------------------
  it('redirige vers /admin quand on clique sur le bouton Admin', () => {
    render(
      <AuthContext.Provider value={{ user: { username: 'Admin', role: 'admin' }, logout: mockLogout }}>
        <Navbar />
      </AuthContext.Provider>
    );

    fireEvent.click(screen.getByText(/admin/i));

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
  // 9) Navigation vers / (logo)
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
