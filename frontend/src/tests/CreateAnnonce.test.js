import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import CreateAnnonce from '../pages/CreateAnnonce';

/**
 * TEST MÉTIER : CRÉATION D'ANNONCE
 * ✅ Justification Lead Dev : Support Multipart/FormData pour l'orchestrateur.
 */
describe('📦 Test UI Métier : Page CreateAnnonce', () => {
  const mockAuthFetch = jest.fn();

  const renderCreate = () => render(
    <AuthContext.Provider value={{ authFetch: mockAuthFetch }}>
      <BrowserRouter><CreateAnnonce /></BrowserRouter>
    </AuthContext.Provider>
  );

  it('✅ Doit envoyer les données via FormData lors de l’ajout d’une image', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonce: { id: 101, titre: 'Velo' } }),
    });

    renderCreate();

    // Remplissage du formulaire via screen
    fireEvent.change(screen.getByPlaceholderText('Ex: Vélo bleu en bon état'), { target: { value: 'Vélo de course' } });
    fireEvent.change(screen.getByPlaceholderText(/Décrivez l'article/), { target: { value: 'Superbe état' } });

    // Simulation de fichier
    const file = new File(['image'], 'velo.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Cliquez pour sélectionner une image/);
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByText('Publier l\'annonce'));

    await waitFor(() => {
      const callArgs = mockAuthFetch.mock.calls[0][1];
      expect(callArgs.body instanceof FormData).toBeTruthy();
    });
  });
});