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

    fireEvent.change(
      screen.getByPlaceholderText('Ex: Vélo bleu en bon état'),
      { target: { value: 'Vélo de course' } }
    );

    fireEvent.change(
      screen.getByPlaceholderText(/Décrivez l'article/),
      { target: { value: 'Superbe état' } }
    );

    const file = new File(['image'], 'velo.png', { type: 'image/png' });
    fireEvent.change(
      screen.getByLabelText(/Cliquez pour sélectionner une image/),
      { target: { files: [file] } }
    );

    fireEvent.click(screen.getByText(/publier l'annonce/i));

    // ✔ Un seul expect dans waitFor
    await waitFor(() => {
      const [, options] = mockAuthFetch.mock.calls[0];
      expect(options.body instanceof FormData).toBe(true);
    });

    // ✔ Les autres expect en dehors
    const [, options] = mockAuthFetch.mock.calls[0];
    const formData = options.body;

    expect(formData.get('titre')).toBe('Vélo de course');
    expect(formData.get('description')).toBe('Superbe état');
    expect(formData.get('image')).toBe(file);
  });
});
