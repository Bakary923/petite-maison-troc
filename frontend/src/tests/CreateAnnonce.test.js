import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import CreateAnnonce from '../pages/CreateAnnonce';

// ✅ SOLUTION CI : Isolation du module router
// Le mock remplace l'import physique qui bloquait la CI Ubuntu
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  MemoryRouter: ({ children }) => <div>{children}</div>,
}));

/**
 * TEST MÉTIER : Création d’annonce
 *
 * Objectif :
 * - Vérifier l’envoi des données via FormData
 * - Support Multipart/FormData pour CI et orchestrateur
 * ✅ Compatible CI : Node + Jest, MemoryRouter utilisé
 */
describe('📦 Page CreateAnnonce', () => {
  const mockAuthFetch = jest.fn();

  const renderCreate = () => render(
    <AuthContext.Provider value={{ authFetch: mockAuthFetch }}>
        <CreateAnnonce />
    </AuthContext.Provider>
  );

  it('✅ Envoie les données via FormData lors de l’ajout d’une image', async () => {
    mockAuthFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ annonce: { id: 101, titre: 'Velo' } }),
    });

    renderCreate();

    fireEvent.change(screen.getByPlaceholderText('Ex: Vélo bleu en bon état'), { target: { value: 'Vélo de course' } });
    fireEvent.change(screen.getByPlaceholderText(/Décrivez l'article/), { target: { value: 'Superbe état' } });

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