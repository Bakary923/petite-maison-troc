import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
// ✅ ESLint : L'import doit être en haut avant les jest.mock
import Navbar from '../components/Navbar';

// ✅ SOLUTION CI : Mock global complet
// On déclare mockNavigate ici pour qu'il soit accessible dans les tests
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  // On crée un composant factice pour remplacer BrowserRouter
  BrowserRouter: ({ children }) => <div>{children}</div>,
  Link: ({ children, to }) => <a href={to}>{children}</a>
}));

describe('🧭 Navbar', () => {

  const renderNavbar = (user = null, logout = jest.fn()) => {
    return render(
      <AuthContext.Provider value={{ user, logout }}>
        <Navbar />
      </AuthContext.Provider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================================
  // 1. Affichage quand user = null
  // ============================================================
  it('affiche Connexion et Créer un compte si user non connecté', () => {
    renderNavbar(null);
    expect(screen.getByText(/connexion/i)).toBeTruthy();
    expect(screen.getByText(/créer un compte/i)).toBeTruthy();
  });

  // ============================================================
  // 2. Navigation : Connexion
  // ============================================================
  it('navigue vers /login au clic sur Connexion', () => {
    renderNavbar(null);
    fireEvent.click(screen.getByText(/connexion/i));
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  // ============================================================
  // 3. Navigation : Signup
  // ============================================================
  it('navigue vers /signup au clic sur Créer un compte', () => {
    renderNavbar(null);
    fireEvent.click(screen.getByText(/créer un compte/i));
    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  // ============================================================
  // 4. Affichage quand user connecté
  // ============================================================
  it('affiche le nom de l’utilisateur connecté', () => {
    renderNavbar({ username: 'Bakary', role: 'user' });
    expect(screen.getByText(/bonsoir, bakary/i)).toBeTruthy();
  });

  // ============================================================
  // 5. Bouton Admin visible uniquement si role = admin
  // ============================================================
  it('affiche le bouton Admin si user est admin', () => {
    renderNavbar({ username: 'AdminUser', role: 'admin' });
    expect(screen.getByText(/admin/i)).toBeTruthy();
  });

  it('n’affiche pas le bouton Admin si user non admin', () => {
    renderNavbar({ username: 'User', role: 'user' });
    expect(screen.queryByText(/admin/i)).toBeNull();
  });

  // ============================================================
  // 6. Navigation : Admin
  // ============================================================
  it('navigue vers /admin au clic sur Admin', () => {
    renderNavbar({ username: 'AdminUser', role: 'admin' });
    fireEvent.click(screen.getByText(/admin/i));
    expect(mockNavigate).toHaveBeenCalledWith('/admin');
  });

  // ============================================================
  // 7. Navigation : Annonces
  // ============================================================
  it('navigue vers /annonces au clic sur Annonces', () => {
    renderNavbar({ username: 'User', role: 'user' });
    fireEvent.click(screen.getByText(/annonces/i));
    expect(mockNavigate).toHaveBeenCalledWith('/annonces');
  });

  // ============================================================
  // 8. Logout
  // ============================================================
  it('appelle logout et navigue vers / au clic sur Se déconnecter', () => {
    const mockLogout = jest.fn();
    renderNavbar({ username: 'User', role: 'user' }, mockLogout);
    fireEvent.click(screen.getByText(/se déconnecter/i));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // ============================================================
  // 9. Navigation via le logo
  // ============================================================
  it('navigue vers / au clic sur le logo', () => {
    renderNavbar(null);
    fireEvent.click(screen.getByText(/la petite maison épouvante/i));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});