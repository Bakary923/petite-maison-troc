import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import ContactModal from '../components/ContactModal';

/**
 * TEST UNITAIRE : ContactModal
 * * Objectifs :
 * - Vérifier l'affichage correct des champs du formulaire.
 * - Simuler la saisie utilisateur et la soumission.
 * - Valider l'affichage du message de succès après envoi.
 * * ✅ Conformité ESLint : Utilisation exclusive de l'objet 'screen'.
 */

describe('📞 Composant ContactModal', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // On simule les timers pour le setTimeout de 2000ms présent dans le composant
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('✅ Ne doit rien afficher si isOpen est false', () => {
    render(<ContactModal isOpen={false} onClose={mockOnClose} />);
    // Le titre ne doit pas être présent dans le DOM
    expect(screen.queryByText(/Nous contacter/i)).not.toBeInTheDocument();
  });

  it('✅ Doit afficher le formulaire complet quand isOpen est true', () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);
    
    // Vérification de la présence des éléments clés
    expect(screen.getByText(/Nous contacter/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ton nom/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/ton@email.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ex: Question sur le troc/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ton message.../i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Envoyer/i })).toBeInTheDocument();
  });

  it('✅ Doit soumettre le formulaire et afficher le message de succès', async () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);

    // Simulation de la saisie utilisateur [cite: 12, 13, 87, 108]
    fireEvent.change(screen.getByPlaceholderText(/Ton nom/i), { target: { value: 'Bakary Dev' } });
    fireEvent.change(screen.getByPlaceholderText(/ton@email.com/i), { target: { value: 'bakary@test.com' } });
    fireEvent.change(screen.getByPlaceholderText(/Ex: Question sur le troc/i), { target: { value: 'Bug CI' } });
    fireEvent.change(screen.getByPlaceholderText(/Ton message.../i), { target: { value: 'Ma couverture est à 19% !' } });

    // Clic sur le bouton d'envoi [cite: 19, 185]
    fireEvent.click(screen.getByRole('button', { name: /Envoyer/i }));

    // Vérification de l'état de succès [cite: 27, 70]
    await waitFor(() => {
      expect(screen.getByText(/Message envoyé avec succès !/i)).toBeInTheDocument();
    });

    // Avancer le temps de 2 secondes pour déclencher onClose() [cite: 29, 32]
    jest.advanceTimersByTime(2000);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('✅ Doit appeler onClose lors du clic sur le bouton Annuler ou la croix', () => {
    render(<ContactModal isOpen={true} onClose={mockOnClose} />);
    
    // Test du bouton "Annuler" [cite: 189]
    fireEvent.click(screen.getByText(/Annuler/i));
    expect(mockOnClose).toHaveBeenCalledTimes(1);

    // Test du bouton "✕" (fermeture) [cite: 53, 62]
    fireEvent.click(screen.getByText('✕'));
    expect(mockOnClose).toHaveBeenCalledTimes(2);
  });
});