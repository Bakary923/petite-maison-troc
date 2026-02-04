import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import AdminCard from '../components/AdminCard';

/**
 * TEST UNITAIRE : AdminCard
 * Objectifs :
 * - Vérifier l'affichage dynamique des données de l'annonce.
 * - Tester les actions de validation, suppression et rejet.
 * - Valider le fonctionnement du formulaire de rejet (Apparition/Saisie).
 * ✅ Conformité ESLint : Utilisation exclusive de l'objet 'screen'.
 */

describe('🛡️ Composant AdminCard', () => {
  // Données de test (Annonce en attente)
  const mockAnnonce = {
    id: 1,
    titre: 'Velo de course',
    username: 'Bakary User',
    status: 'pending',
    description: 'Un super vélo en bon état',
    image: 'velo.jpg',
    created_at: '2024-05-20T10:00:00Z'
  };

  // Mocks des fonctions de rappel (props)
  const mockOnValidate = jest.fn();
  const mockOnReject = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('✅ Doit afficher correctement les informations de l’annonce', () => {
    render(
      <AdminCard 
        annonce={mockAnnonce} 
        onValidate={mockOnValidate} 
        onReject={mockOnReject} 
        onDelete={mockOnDelete} 
      />
    );

    // Vérification des textes [cite: 401, 402, 415]
    expect(screen.getByText('Velo de course')).toBeInTheDocument();
    expect(screen.getByText(/Bakary User/i)).toBeInTheDocument();
    expect(screen.getByText('Un super vélo en bon état')).toBeInTheDocument();
    
    // Vérification du badge de statut [cite: 383, 408]
    expect(screen.getByText(/En attente/i)).toBeInTheDocument();

    // Vérification de l'image [cite: 413]
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'velo.jpg');
  });

  it('✅ Doit appeler onValidate lors du clic sur le bouton Valider', () => {
    render(
      <AdminCard annonce={mockAnnonce} onValidate={mockOnValidate} onReject={mockOnReject} onDelete={mockOnDelete} />
    );

    // Clic sur Valider [cite: 430]
    fireEvent.click(screen.getByText(/Valider/i));
    expect(mockOnValidate).toHaveBeenCalledWith(mockAnnonce.id);
  });

  it('✅ Doit appeler onDelete lors du clic sur le bouton Supprimer', () => {
    render(
      <AdminCard annonce={mockAnnonce} onValidate={mockOnValidate} onReject={mockOnReject} onDelete={mockOnDelete} />
    );

    // Clic sur Supprimer [cite: 444]
    fireEvent.click(screen.getByText(/Supprimer/i));
    expect(mockOnDelete).toHaveBeenCalledWith(mockAnnonce.id);
  });

  it('✅ Doit afficher le formulaire de rejet et soumettre la raison', () => {
    render(
      <AdminCard annonce={mockAnnonce} onValidate={mockOnValidate} onReject={mockOnReject} onDelete={mockOnDelete} />
    );

    // 1. Ouvrir le formulaire de rejet [cite: 436]
    fireEvent.click(screen.getByText(/Rejeter/i));
    
    // 2. Vérifier l'apparition du champ de saisie [cite: 453]
    const input = screen.getByPlaceholderText(/Raison du rejet.../i);
    expect(input).toBeInTheDocument();

    // 3. Saisir une raison et soumettre [cite: 455, 458]
    fireEvent.change(input, { target: { value: 'Image floue' } });
    fireEvent.click(screen.getByText(/Confirmer le rejet/i));

    // 4. Vérifier l'appel de onReject avec les bons arguments [cite: 377]
    expect(mockOnReject).toHaveBeenCalledWith(mockAnnonce.id, 'Image floue');
  });

  it('✅ Doit masquer le formulaire de rejet lors du clic sur Annuler', () => {
    render(
      <AdminCard annonce={mockAnnonce} onValidate={mockOnValidate} onReject={mockOnReject} onDelete={mockOnDelete} />
    );

    // Ouvrir puis annuler 
    fireEvent.click(screen.getByText(/Rejeter/i));
    fireEvent.click(screen.getByText(/Annuler/i));

    // Le champ ne doit plus être visible [cite: 449]
    expect(screen.queryByPlaceholderText(/Raison du rejet.../i)).not.toBeInTheDocument();
  });

  it('✅ Doit afficher la raison du rejet si elle existe', () => {
    const rejectedAnnonce = { ...mockAnnonce, status: 'rejected', rejection_reason: 'Pas conforme' };
    
    render(
      <AdminCard annonce={rejectedAnnonce} onValidate={mockOnValidate} onReject={mockOnReject} onDelete={mockOnDelete} />
    );

    // Vérification de l'affichagee de la raison [cite: 420]
    expect(screen.getByText(/Raison du rejet : Pas conforme/i)).toBeInTheDocument();
    // Les boutons Valider/Rejeter ne doivent pas être là car le statut n'est plus "pending" 
    expect(screen.queryByText(/Valider/i)).not.toBeInTheDocument();
  });
});