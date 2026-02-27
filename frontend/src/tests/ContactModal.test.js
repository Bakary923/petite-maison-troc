// ContactModal.test.js
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContactModal from '../components/ContactModal';

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
});

const onClose = jest.fn();

function renderOpen() {
  return render(<ContactModal isOpen={true} onClose={onClose} />);
}

async function fillForm() {
  await userEvent.type(screen.getByPlaceholderText('Ton nom'), 'Alice');
  await userEvent.type(screen.getByPlaceholderText('ton@email.com'), 'alice@test.com');
  await userEvent.type(screen.getByPlaceholderText('Ex: Question sur le troc'), 'Test');
  await userEvent.type(screen.getByPlaceholderText('Ton message...'), 'Hello');
}

async function fillAndSubmit() {
  renderOpen();
  await fillForm();
  fireEvent.click(screen.getByRole('button', { name: /Envoyer/i }));
}

// ══════════════════════════════════════════════════════════════════════════════
// 1. Visibilité
// ══════════════════════════════════════════════════════════════════════════════
describe('Visibilité', () => {
  it('ne rend rien si isOpen est false', () => {
    render(<ContactModal isOpen={false} onClose={onClose} />);
    expect(screen.queryByText(/Nous contacter/i)).not.toBeInTheDocument();
  });

  it('affiche le modal si isOpen est true', () => {
    renderOpen();
    expect(screen.getByText(/Nous contacter/i)).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. Fermeture
// ══════════════════════════════════════════════════════════════════════════════
describe('Fermeture', () => {
  it('appelle onClose en cliquant sur le bouton ✕', () => {
    renderOpen();
    fireEvent.click(screen.getByLabelText('Fermer'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('appelle onClose en cliquant sur le bouton Annuler', () => {
    renderOpen();
    fireEvent.click(screen.getByText('Annuler'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('appelle onClose en cliquant sur le backdrop', () => {
    renderOpen();
    fireEvent.click(screen.getByLabelText(/Fermer la fenêtre/i));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('appelle onClose sur le backdrop avec la touche Enter', () => {
    renderOpen();
    fireEvent.keyDown(screen.getByLabelText(/Fermer la fenêtre/i), { key: 'Enter' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('appelle onClose sur le backdrop avec la touche Espace', () => {
    renderOpen();
    fireEvent.keyDown(screen.getByLabelText(/Fermer la fenêtre/i), { key: ' ' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("n'appelle pas onClose sur une autre touche", () => {
    renderOpen();
    fireEvent.keyDown(screen.getByLabelText(/Fermer la fenêtre/i), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. Saisie du formulaire
// ══════════════════════════════════════════════════════════════════════════════
describe('Saisie du formulaire', () => {
  it('met à jour les champs à la saisie', async () => {
    renderOpen();
    await userEvent.type(screen.getByPlaceholderText('Ton nom'), 'Alice');
    await userEvent.type(screen.getByPlaceholderText('ton@email.com'), 'alice@test.com');
    await userEvent.type(screen.getByPlaceholderText('Ex: Question sur le troc'), 'Test sujet');
    await userEvent.type(screen.getByPlaceholderText('Ton message...'), 'Bonjour !');

    expect(screen.getByPlaceholderText('Ton nom')).toHaveValue('Alice');
    expect(screen.getByPlaceholderText('ton@email.com')).toHaveValue('alice@test.com');
    expect(screen.getByPlaceholderText('Ex: Question sur le troc')).toHaveValue('Test sujet');
    expect(screen.getByPlaceholderText('Ton message...')).toHaveValue('Bonjour !');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. Soumission réussie
// ══════════════════════════════════════════════════════════════════════════════
describe('Soumission réussie', () => {
  it('affiche le message de succès après soumission', async () => {
    await fillAndSubmit();
    expect(await screen.findByText(/Message envoyé avec succès/i)).toBeInTheDocument();
  });

  it('masque le formulaire après soumission', async () => {
    await fillAndSubmit();
    await screen.findByText(/Message envoyé avec succès/i);
    expect(screen.queryByPlaceholderText('Ton nom')).not.toBeInTheDocument();
  });

  it('appelle onClose après 2 secondes', async () => {
    await fillAndSubmit();
    await screen.findByText(/Message envoyé avec succès/i);
    expect(onClose).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(2000); });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. État loading
// ══════════════════════════════════════════════════════════════════════════════
describe('État loading', () => {
  it('affiche "Envoi..." et désactive le bouton pendant le chargement', async () => {
    renderOpen();
    await fillForm();
    fireEvent.click(screen.getByRole('button', { name: /Envoyer/i }));
    expect(screen.getByText('Envoi...')).toBeDisabled();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. Accessibilité
// ══════════════════════════════════════════════════════════════════════════════
describe('Accessibilité', () => {
  it('le backdrop a un role="button" et un tabIndex="0"', () => {
    renderOpen();
    const backdrop = screen.getByLabelText(/Fermer la fenêtre/i);
    expect(backdrop).toHaveAttribute('role', 'button');
    expect(backdrop).toHaveAttribute('tabindex', '0');
  });

  it('le bouton fermer a un aria-label "Fermer"', () => {
    renderOpen();
    expect(screen.getByLabelText('Fermer')).toBeInTheDocument();
  });
});