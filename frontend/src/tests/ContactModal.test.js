import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import ContactModal from '../components/ContactModal'; // Ajuste le chemin si nécessaire

describe('📞 Test Complet - ContactModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('✅ Ne doit rien afficher si isOpen est false', () => {
    render(<ContactModal isOpen={false} onClose={mockOnClose} />);
    expect(screen.queryByText(/Nous contacter/i)).not.toBeInTheDocument();
  });

  it('✅ Doit afficher le formulaire et gérer la saisie', () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);
    
    const inputNom = screen.getByPlaceholderText(/Ton nom/i);
    fireEvent.change(inputNom, { target: { name: 'nom', value: 'Bakary' } });
    expect(inputNom.value).toBe('Bakary');
  });

  it('✅ Doit fermer la modale via le bouton "✕" (Accessibilité)', () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);
    const closeBtn = screen.getByLabelText('Fermer');
    fireEvent.click(closeBtn);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('✅ Doit fermer la modale via le clic sur le fond (Backdrop)', () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);
    const backdrop = screen.getByLabelText(/Fermer la fenêtre/i);
    fireEvent.click(backdrop);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('✅ Doit fermer la modale via la touche "Entrée" sur le fond', () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);
    const backdrop = screen.getByLabelText(/Fermer la fenêtre/i);
    fireEvent.keyDown(backdrop, { key: 'Enter', code: 'Enter' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('✅ Doit soumettre le formulaire et gérer le succès avec le timer', async () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);

    // Remplissage du formulaire
    fireEvent.change(screen.getByPlaceholderText(/Ton nom/i), { target: { name: 'nom', value: 'Testeur' } });
    fireEvent.change(screen.getByPlaceholderText(/ton@email.com/i), { target: { name: 'email', value: 'test@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: Question/i), { target: { name: 'sujet', value: 'Info' } });
    fireEvent.change(screen.getByPlaceholderText(/Ton message/i), { target: { name: 'message', value: 'Message de test' } });

    // Envoi
    const submitBtn = screen.getByRole('button', { name: /Envoyer/i });
    fireEvent.click(submitBtn);

    // Vérifier l'état de chargement
    expect(screen.getByText(/Envoi.../i)).toBeInTheDocument();

    // Attendre le message de succès
    await waitFor(() => {
      expect(screen.getByText(/Message envoyé avec succès !/i)).toBeInTheDocument();
    });

    // Avancer le temps de 2 secondes pour vérifier la fermeture automatique
    jest.advanceTimersByTime(2000);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('✅ Doit fermer la modale via le bouton Annuler', () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);
    fireEvent.click(screen.getByText(/Annuler/i));
    expect(mockOnClose).toHaveBeenCalled();
  });
});