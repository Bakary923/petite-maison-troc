import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import ContactModal from '../components/ContactModal';

describe('📞 Composant ContactModal', () => {
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

  it('✅ Doit afficher le formulaire complet quand isOpen est true', () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText(/Nous contacter/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ton nom/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ton@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: Question sur le troc/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ton message.../i)).toBeInTheDocument();
    // Utilisation d'une regex souple pour matcher "📤 Envoyer"
    expect(screen.getByRole('button', { name: /Envoyer/i })).toBeInTheDocument();
  });

  it('✅ Doit soumettre le formulaire et afficher le message de succès', async () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);

    fireEvent.change(screen.getByPlaceholderText(/Ton nom/i), { target: { value: 'Bakary Dev' } });
    fireEvent.change(screen.getByPlaceholderText(/ton@email.com/i), { target: { value: 'bakary@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: Question sur le troc/i), { target: { value: 'Bug CI' } });
    fireEvent.change(screen.getByPlaceholderText(/Ton message.../i), { target: { value: 'Ma couverture est au top !' } });

    // On clique sur le bouton qui contient "Envoyer"
    fireEvent.click(screen.getByRole('button', { name: /Envoyer/i }));

    // Vérification de l'affichage du succès
    await waitFor(() => {
      expect(screen.getByText(/Message envoyé avec succès !/i)).toBeInTheDocument();
    });

    // On avance le temps pour fermer la modale
    jest.advanceTimersByTime(2000);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('✅ Doit appeler onClose lors du clic sur le bouton Annuler ou la croix', () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);
    
    // Clic sur "Annuler"
    fireEvent.click(screen.getByText(/Annuler/i));
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Clic sur "✕"
    fireEvent.click(screen.getByText('✕'));
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});