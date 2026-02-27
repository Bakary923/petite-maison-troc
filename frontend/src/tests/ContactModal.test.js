// ContactModal.test.js
import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
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
  async function fillAndSubmit() {
    renderOpen();
    await userEvent.type(screen.getByPlaceholderText('Ton nom'), 'Alice');
    await userEvent.type(screen.getByPlaceholderText('ton@email.com'), 'alice@test.com');
    await userEvent.type(screen.getByPlaceholderText('Ex: Question sur le troc'), 'Test');
    await userEvent.type(screen.getByPlaceholderText('Ton message...'), 'Hello');
    await act(async () => {
      fireEvent.submit(screen.getByRole('button', { name: /Envoyer/i }).closest('form'));
    });
  }

  it('affiche le message de succès après soumission', async () => {
    await fillAndSubmit();
    expect(await screen.findByText(/Message envoyé avec succès/i)).toBeInTheDocument();
  });

  it('réinitialise les champs après soumission', async () => {
    await fillAndSubmit();
    // Le formulaire est remplacé par le successBox, les inputs ne sont plus là
    expect(screen.queryByPlaceholderText('Ton nom')).not.toBeInTheDocument();
  });

  it('appelle onClose après 2 secondes', async () => {
    await fillAndSubmit();
    expect(onClose).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(2000); });

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. État loading
// ══════════════════════════════════════════════════════════════════════════════
describe('État loading', () => {
  it('désactive le bouton submit pendant le chargement', async () => {
    // On bloque handleSubmit pour capturer l'état intermédiaire
    jest.spyOn(global.console, 'log').mockImplementation(() => {});

    renderOpen();
    await userEvent.type(screen.getByPlaceholderText('Ton nom'), 'Alice');
    await userEvent.type(screen.getByPlaceholderText('ton@email.com'), 'alice@test.com');
    await userEvent.type(screen.getByPlaceholderText('Ex: Question sur le troc'), 'Test');
    await userEvent.type(screen.getByPlaceholderText('Ton message...'), 'Hello');

    // Pendant l'envoi, le bouton doit être disabled
    let submitBtn;
    await act(async () => {
      submitBtn = screen.getByRole('button', { name: /Envoyer/i });
      fireEvent.submit(submitBtn.closest('form'));
      // Juste après le submit, avant que la promesse resolve
      expect(submitBtn).toBeDisabled();
    });
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