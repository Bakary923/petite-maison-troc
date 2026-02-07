import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import AdminCard from '../components/AdminCard';

describe('🛡️ Composant AdminCard', () => {
  const mockAnnonce = {
    id: 1,
    titre: 'Velo de course',
    username: 'Bakary User',
    status: 'pending',
    description: 'Un super vélo en bon état',
    image: 'velo.jpg',
    created_at: '2024-05-20T10:00:00Z'
  };

  const mockOnValidate = jest.fn();
  const mockOnReject = jest.fn();
  const mockOnDelete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('✅ Doit afficher correctement les informations de l’annonce', () => {
    render(<AdminCard annonce={mockAnnonce} onValidate={mockOnValidate} onReject={mockOnReject} onDelete={mockOnDelete} />);
    expect(screen.getByText('Velo de course')).toBeInTheDocument();
    expect(screen.getByText(/Bakary User/i)).toBeInTheDocument();
    expect(screen.getByText('Un super vélo en bon état')).toBeInTheDocument();
    expect(screen.getByText(/En attente/i)).toBeInTheDocument();
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', 'velo.jpg');
  });

  it('✅ Doit appeler onValidate lors du clic sur le bouton Valider', () => {
    render(<AdminCard annonce={mockAnnonce} onValidate={mockOnValidate} onReject={mockOnReject} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByText(/Valider/i));
    expect(mockOnValidate).toHaveBeenCalledWith(mockAnnonce.id);
  });

  it('✅ Doit appeler onDelete lors du clic sur le bouton Supprimer', () => {
    render(<AdminCard annonce={mockAnnonce} onValidate={mockOnValidate} onReject={mockOnReject} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByText(/Supprimer/i));
    expect(mockOnDelete).toHaveBeenCalledWith(mockAnnonce.id);
  });

  it('✅ Doit afficher le formulaire de rejet et soumettre la raison', () => {
    render(<AdminCard annonce={mockAnnonce} onValidate={mockOnValidate} onReject={mockOnReject} onDelete={mockOnDelete} />);
    
    // 1. Ouvrir le formulaire
    fireEvent.click(screen.getByText(/Rejeter/i));
    
    // 2. Vérifier l'input
    const input = screen.getByPlaceholderText(/Raison du rejet.../i);
    expect(input).toBeInTheDocument();

    // 3. Saisir et Confirmer (Texte mis à jour pour le responsive)
    fireEvent.change(input, { target: { value: 'Image floue' } });
    fireEvent.click(screen.getByText(/Confirmer/i)); // Corrigé ici

    expect(mockOnReject).toHaveBeenCalledWith(mockAnnonce.id, 'Image floue');
  });

  it('✅ Doit masquer le formulaire de rejet lors du clic sur Annuler', () => {
    render(<AdminCard annonce={mockAnnonce} onValidate={mockOnValidate} onReject={mockOnReject} onDelete={mockOnDelete} />);
    fireEvent.click(screen.getByText(/Rejeter/i));
    fireEvent.click(screen.getByText(/Annuler/i));
    expect(screen.queryByPlaceholderText(/Raison du rejet.../i)).not.toBeInTheDocument();
  });

  it('✅ Doit afficher la raison du rejet si elle existe', () => {
    const rejectedAnnonce = { ...mockAnnonce, status: 'rejected', rejection_reason: 'Pas conforme' };
    render(<AdminCard annonce={rejectedAnnonce} onValidate={mockOnValidate} onReject={mockOnReject} onDelete={mockOnDelete} />);

    // Utilisation d'une regex souple pour ignorer les balises <strong>
    expect(screen.getByText(/Raison du rejet/i)).toBeInTheDocument();
    expect(screen.getByText(/Pas conforme/i)).toBeInTheDocument();
  });
});