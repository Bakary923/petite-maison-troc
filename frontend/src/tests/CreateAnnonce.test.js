import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import { AuthContext } from '../contexts/AuthContext';
import CreateAnnonce from '../pages/CreateAnnonce';
import { MemoryRouter } from 'react-router-dom';

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
      <MemoryRouter>
        <AuthContext.Provider value={{ authFetch: mockAuthFetch }}>
          <CreateAnnonce />
        </AuthContext.Provider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/vélo bleu/i), {
      target: { value: 'Vélo de course' }
    });

    const file = new File(['image'], 'velo.png', { type: 'image/png' });
    const input = screen.getByLabelText(/image/i);
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByText(/publier/i));

    await waitFor(() => {
      expect(mockAuthFetch).toHaveBeenCalled();
    });

    const [, options] = mockAuthFetch.mock.calls[0];

    expect(options.body instanceof FormData).toBe(true);
    expect(options.body.get('titre')).toBe('Vélo de course');
    expect(options.body.get('image')).toBe(file);
  });
});
