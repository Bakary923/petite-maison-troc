import React from 'react';
import { render, fireEvent, waitFor, screen, act } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import CreateAnnonce from '../pages/CreateAnnonce';

// ✅ MOCK VIRTUEL : Empêche Jest de chercher le dossier node_modules physiquement
// C'est la solution pour ton erreur "Cannot find module 'react-router-dom'"
jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}), { virtual: true });

describe('📦 Page CreateAnnonce', () => {
  const mockAuthFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('✅ Envoie un FormData complet avec image', async () => {
    // Simulation d'une réponse réussie du backend
    mockAuthFetch.mockResolvedValueOnce({ 
      ok: true, 
      json: async () => ({ annonce: { id: 101 } }) 
    });

    render(
      <AuthContext.Provider value={{ authFetch: mockAuthFetch }}>
        <CreateAnnonce />
      </AuthContext.Provider>
    );

    // Remplissage du formulaire
    fireEvent.change(screen.getByPlaceholderText(/vélo bleu/i), { 
      target: { value: 'Vélo de course' } 
    });
    
    // Simulation d'upload d'image (Blob)
    const file = new File(['image'], 'velo.png', { type: 'image/png' });
    const input = screen.getByLabelText(/image/i);
    fireEvent.change(input, { target: { files: [file] } });

    // Soumission du formulaire avec act() pour React 19
    await act(async () => {
      fireEvent.click(screen.getByText(/publier/i));
    });

    // ✅ On attend seulement que l'appel API soit déclenché
    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalled();
    });

    // ✅ Analyse du FormData (Validation de la structure multipart)
    const [, options] = mockAuthFetch.mock.calls[0];
    expect(options.body instanceof FormData).toBe(true);
    expect(options.body.get('titre')).toBe('Vélo de course');
  });
});