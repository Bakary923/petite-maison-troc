import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import ContactModal from '../components/ContactModal';

describe('📞 Test Complet - ContactModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers(); // Permet de manipuler le setTimeout de 2000ms
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('✅ Ne doit rien afficher si isOpen est false', () => {
    render(<ContactModal isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText(/Nous contacter/i)).not.toBeInTheDocument();
  });

  it('✅ Doit afficher le formulaire et gérer la saisie des champs', () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);
    
    const inputNom = screen.getByPlaceholderText(/Ton nom/i);
    fireEvent.change(inputNom, { target: { name: 'nom', value: 'Bakary' } });
    
    expect(inputNom.value).toBe('Bakary');
    expect(screen.getByText(/Nous contacter/i)).toBeInTheDocument();
  });

  it('✅ Doit fermer la modale via le bouton "✕"', () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);
    const closeBtn = screen.getByLabelText('Fermer');
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('✅ Doit fermer la modale via le clic sur le fond (Backdrop)', () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);
    const backdrop = screen.getByLabelText(/Fermer la fenêtre en cliquant sur le fond/i);
    fireEvent.click(backdrop);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('✅ Doit fermer la modale via la touche "Entrée" sur le fond (Accessibilité)', () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);
    const backdrop = screen.getByLabelText(/Fermer la fenêtre en cliquant sur le fond/i);
    fireEvent.keyDown(backdrop, { key: 'Enter', code: 'Enter' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('✅ Doit soumettre le formulaire et afficher le succès (Timer inclus)', async () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);

    // Remplissage simulé du formulaire
    fireEvent.change(screen.getByPlaceholderText(/Ton nom/i), { target: { name: 'nom', value: 'Testeur' } });
    fireEvent.change(screen.getByPlaceholderText(/ton@email.com/i), { target: { name: 'email', value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: Question/i), { target: { name: 'sujet', value: 'Demande' } });
    fireEvent.change(screen.getByPlaceholderText(/Ton message/i), { target: { name: 'message', value: 'Ceci est un test' } });

    // Clic sur envoyer
    const submitBtn = screen.getByRole('button', { name: /Envoyer/i });
    fireEvent.click(submitBtn);

    // On attend directement l'écran de succès (on ignore l'état "Envoi..." qui est trop furtif)
    await waitFor(() => {
      expect(screen.getByText(/Message envoyé avec succès !/i)).toBeInTheDocument();
    });

    // On simule l'écoulement des 2 secondes du setTimeout pour vérifier la fermeture auto
    jest.advanceTimersByTime(2000);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('✅ Doit fermer la modale via le bouton Annuler', () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);
    const cancelBtn = screen.getByText(/Annuler/i);
    fireEvent.click(cancelBtn);
    expect(mockOnClose).toHaveBeenCalled();
  });
});