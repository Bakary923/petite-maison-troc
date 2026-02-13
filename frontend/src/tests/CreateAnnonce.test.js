/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom"; // Suppression de mockNavigate ici
import CreateAnnonce from "../pages/CreateAnnonce";
import { AuthContext } from "../contexts/AuthContext";

// On mock useNavigate de react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock Supabase
jest.mock("../config/supabaseClient", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: jest.fn().mockResolvedValue({ data: { path: 'test-path.jpg' }, error: null }),
      }),
    },
  },
}));

describe("CreateAnnonce", () => {
  let mockAuthFetch;

  beforeEach(() => {
    mockAuthFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "ok" })
      })
    );
    mockNavigate.mockClear();
  });

  const renderPage = () =>
    render(
      <AuthContext.Provider value={{ authFetch: mockAuthFetch }}>
        <MemoryRouter>
          <CreateAnnonce />
        </MemoryRouter>
      </AuthContext.Provider>
    );

  test("envoie une annonce valide sans image", async () => {
    renderPage();

    // ✅ Match avec "Titre (ex: Maison hantée)"
    fireEvent.change(screen.getByPlaceholderText(/Titre/i), {
      target: { value: "Chaise hantée" }
    });

    // ✅ Match avec "Décrivez les phénomènes paranormaux..."
    fireEvent.change(screen.getByPlaceholderText(/Décrivez les phénomènes/i), {
      target: { value: "Elle bouge toute seule la nuit." }
    });

    fireEvent.click(screen.getByText(/publier/i));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/annonces"));
  });

  test("upload une image et crée l'annonce", async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/Titre/i), {
      target: { value: "Table de spiritisme" }
    });

    fireEvent.change(screen.getByPlaceholderText(/Décrivez les phénomènes/i), {
      target: { value: "Parfaite pour parler aux ancêtres." }
    });

    // ✅ Match avec "Joindre une photo" (le texte dans ton label)
    const file = new File(["hello"], "photo.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/Joindre une photo/i);
    
    fireEvent.change(input, {
      target: { files: [file] }
    });

    fireEvent.click(screen.getByText(/publier/i));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/annonces"));
  });
});