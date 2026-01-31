import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import CreateAnnonce from '../pages/CreateAnnonce';

/**
 * ============================================================================
 * TEST UI MÉTIER : CRÉATION D'ANNONCE
 * Objectif : Valider l'envoi de données multipart (texte + image).
 * Justification : Vérifie la robustesse de l'intercepteur authFetch.
 * ============================================================================
 */

describe('📦 Test UI Métier : Page CreateAnnonce', () => {
  const mockAuthFetch = jest.fn();

  const renderCreate = () => render(
    <AuthContext.Provider value={{ authFetch: mockAuthFetch }}>
      <BrowserRouter>
        <CreateAnnonce />
      </BrowserRouter>
    </AuthContext.Provider>
  );

  it('✅ Doit envoyer les données via FormData lors de l’ajout d’une image', async () => {
    // Simulation d'une réponse API réussie
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonce: { id: 101, titre: 'Velo' } }),
    });

    const { getByPlaceholderText, getByLabelText, getByText } = renderCreate();

    // 1. Saisie des informations
    fireEvent.change(getByPlaceholderText('Ex: Vélo bleu en bon état'), { target: { value: 'Vélo de course' } });
    fireEvent.change(getByPlaceholderText(/Décrivez l'article/), { target: { value: 'Superbe état' } });

    // 2. Simulation de l'ajout d'un fichier image
    const file = new File(['(⌐□_□)'], 'velo.png', { type: 'image/png' });
    const input = getByLabelText(/Cliquez pour sélectionner une image/);
    fireEvent.change(input, { target: { files: [file] } });

    // 3. Soumission
    fireEvent.click(getByText('Publier l\'annonce'));

    await waitFor(() => {
      // Vérification que authFetch a été appelé avec un objet FormData (pas du JSON standard)
      const callArgs = mockAuthFetch.mock.calls[0][1];
      expect(callArgs.body instanceof FormData).toBeTruthy();
    });
  });
});