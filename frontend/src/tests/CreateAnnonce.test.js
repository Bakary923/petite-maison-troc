import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import CreateAnnonce from '../pages/CreateAnnonce';

describe('📦 Page CreateAnnonce', () => {
  const mockAuthFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Envoie un JSON complet avec imagePath', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonce: { id: 101 } })
    });

    render(
      <AuthContext.Provider value={{ authFetch: mockAuthFetch }}>
        <CreateAnnonce />
      </AuthContext.Provider>
    );

    // Remplir le titre
    fireEvent.change(screen.getByPlaceholderText(/vélo bleu/i), {
      target: { value: 'Vélo de course' }
    });

    // Remplir la description
    fireEvent.change(screen.getByPlaceholderText(/Décrivez l'article/i), {
      target: { value: 'Très bon état, peu servi.' }
    });

    // Ajouter une image
    const file = new File(['image'], 'velo.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText(/image/i), {
      target: { files: [file] }
    });

    // Soumettre
    fireEvent.click(screen.getByText(/publier/i));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());

    const [, options] = mockAuthFetch.mock.calls[0];

    // --- ✔️ NOUVEAU TEST : JSON, PAS FORM DATA ---
    expect(typeof options.body).toBe("string");

    const parsed = JSON.parse(options.body);

    expect(parsed.titre).toBe("Vélo de course");
    expect(parsed.description).toBe("Très bon état, peu servi.");
    expect(parsed.imagePath).toBe("fake/path.png"); // mock Supabase
  });
});
