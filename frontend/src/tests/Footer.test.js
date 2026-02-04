import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import Footer from '../components/Footer';

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

// ============================================================
// 🧪 MOCK DU MODAL DE CONTACT
// ------------------------------------------------------------
// On remplace ContactModal par un composant simple pour éviter
// les styles, portails ou animations qui cassent les tests.
// ============================================================
jest.mock('../components/ContactModal', () => ({ isOpen }) =>
  isOpen ? <div data-testid="contact-modal">Modal Ouvert</div> : null
);

describe('🦇 Footer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------
  // 1) Navigation : Accueil
  // ---------------------------------------------------------
  it('redirige vers / quand on clique sur Accueil', () => {
    render(<Footer />);

    fireEvent.click(screen.getByText(/accueil/i));

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  // ---------------------------------------------------------
  // 2) Navigation : Annonces
  // ---------------------------------------------------------
  it('redirige vers /annonces quand on clique sur Annonces', () => {
    render(<Footer />);

    fireEvent.click(screen.getByText(/annonces/i));

    expect(mockNavigate).toHaveBeenCalledWith('/annonces');
  });

  // ---------------------------------------------------------
  // 3) Navigation : Connexion
  // ---------------------------------------------------------
  it('redirige vers /login quand on clique sur Connexion', () => {
    render(<Footer />);

    fireEvent.click(screen.getByText(/connexion/i));

    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  // ---------------------------------------------------------
  // 4) Navigation : S’inscrire
  // ---------------------------------------------------------
  it('redirige vers /signup quand on clique sur S\'inscrire', () => {
    render(<Footer />);

    fireEvent.click(screen.getByText(/s'inscrire/i));

    expect(mockNavigate).toHaveBeenCalledWith('/signup');
  });

  // ---------------------------------------------------------
  // 5) Ouverture du modal de contact
  // ---------------------------------------------------------
  it('ouvre le modal de contact quand on clique sur Nous contacter', () => {
    render(<Footer />);

    // Avant clic → modal absent
    expect(screen.queryByTestId('contact-modal')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText(/nous contacter/i));

    // Après clic → modal présent
    expect(screen.getByTestId('contact-modal')).toBeInTheDocument();
  });
});
