import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import CreateAnnonce from '../pages/CreateAnnonce';

describe('📦 Page CreateAnnonce', () => {
  const mockAuthFetch = jest.fn();

  const renderCreate = () =>
    render(
      <AuthContext.Provider value={{ authFetch: mockAuthFetch }}>
        <CreateAnnonce />
      </AuthContext.Provider>
    );

  it('📤 Envoie un FormData complet avec titre, description et image', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonce: { id: 101, titre: 'Velo' } }),
    });

    renderCreate();

    // Remplir les champs texte
    fireEvent.change(
      screen.getByPlaceholderText('Ex: Vélo bleu en bon état'),
      { target: { value: 'Vélo de course' } }
    );

    fireEvent.change(
      screen.getByPlaceholderText(/Décrivez l'article/),
      { target: { value: 'Superbe état' } }
    );

    // Ajouter une image
    const file = new File(['image'], 'velo.png', { type: 'image/png' });
    const input = screen.getByLabelText(/Cliquez pour sélectionner une image/);
    fireEvent.change(input, { target: { files: [file] } });

    // Soumettre
    fireEvent.click(screen.getByText(/publier l'annonce/i));

    await waitFor(() => {
      const [url, options] = mockAuthFetch.mock.calls[0];
      const formData = options.body;

      // Vérifier que c'est bien un FormData
      expect(formData instanceof FormData).toBe(true);

      // Vérifier les champs envoyés
      expect(formData.get('titre')).toBe('Vélo de course');
      expect(formData.get('description')).toBe('Superbe état');
      expect(formData.get('image')).toBe(file);
    });
  });
});
