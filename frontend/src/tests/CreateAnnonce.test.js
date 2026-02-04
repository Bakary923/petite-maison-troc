import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import CreateAnnonce from '../pages/CreateAnnonce';

// ✅ SOLUTION CI : Mock pour support du téléchargement d'images (FormData)
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}));

/**
 * TEST MÉTIER : Création d’annonce
 * Objectif : Vérifier l’envoi correct des données complexes (Multipart/FormData).
 */
describe('📦 Page CreateAnnonce', () => {
  const mockAuthFetch = jest.fn();

  it('✅ Envoie un FormData complet avec image', async () => {
    mockAuthFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ annonce: { id: 101 } }) });

    render(
      <AuthContext.Provider value={{ authFetch: mockAuthFetch }}>
        <CreateAnnonce />
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByPlaceholderText('Ex: Vélo bleu en bon état'), { target: { value: 'Vélo de course' } });
    
    // Simulation d'un fichier image pour le test
    const file = new File(['image'], 'velo.png', { type: 'image/png' });
    const input = screen.getByLabelText(/image/i);
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByText(/publier/i));

    await waitFor(() => {
      const [, options] = mockAuthFetch.mock.calls[0];
      expect(options.body instanceof FormData).toBe(true);
      expect(options.body.get('titre')).toBe('Vélo de course');
    });
  });
});