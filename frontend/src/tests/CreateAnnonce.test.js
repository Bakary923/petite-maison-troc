import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import CreateAnnonce from '../pages/CreateAnnonce';

jest.mock('react-router-dom', () => ({
  useNavigate: () => jest.fn()
}), { virtual: true });

describe('📦 Page CreateAnnonce', () => {
  const mockAuthFetch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('✅ Envoie un FormData complet avec image', async () => {
    mockAuthFetch.mockResolvedValueOnce({ 
      ok: true, 
      json: async () => ({ annonce: { id: 101 } }) 
    });

    render(
      <AuthContext.Provider value={{ authFetch: mockAuthFetch }}>
        <CreateAnnonce />
      </AuthContext.Provider>
    );

    fireEvent.change(screen.getByPlaceholderText(/vélo bleu/i), { 
      target: { value: 'Vélo de course' } 
    });

    const file = new File(['image'], 'velo.png', { type: 'image/png' });
    const input = screen.getByLabelText(/image/i);
    fireEvent.change(input, { target: { files: [file] } });

    // ❌ act() supprimé
    fireEvent.click(screen.getByText(/publier/i));

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalled();
    });

    const [, options] = mockAuthFetch.mock.calls[0];
    expect(options.body instanceof FormData).toBe(true);
    expect(options.body.get('titre')).toBe('Vélo de course');
  });
});
