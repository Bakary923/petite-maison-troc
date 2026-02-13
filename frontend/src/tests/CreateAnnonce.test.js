/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CreateAnnonce from "../pages/CreateAnnonce";
import { AuthContext } from "../contexts/AuthContext";

// 1. Mock de useNavigate (React Router)
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// 2. Mock de Supabase pour éviter l'erreur de variable d'env et simuler l'upload
jest.mock("../config/supabaseClient", () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: jest.fn().mockResolvedValue({ data: { path: "test-image.jpg" }, error: null }),
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
        json: () => Promise.resolve({ message: "ok" }),
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

    // ✅ Match avec ton nouveau placeholder Titre
    fireEvent.change(screen.getByPlaceholderText(/Titre \(ex: Maison hantée\)/i), {
      target: { value: "Chaise" },
    });

    // ✅ Match avec ton nouveau placeholder Description
    fireEvent.change(screen.getByPlaceholderText(/Décrivez les phénomènes/i), {
      target: { value: "Belle chaise en bois" },
    });

    fireEvent.click(screen.getByText(/publier l'annonce/i));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/annonces"));
  });

  test("upload une image et crée l'annonce", async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/Titre \(ex: Maison hantée\)/i), {
      target: { value: "Chaise" },
    });

    fireEvent.change(screen.getByPlaceholderText(/Décrivez les phénomènes/i), {
      target: { value: "Belle chaise en bois" },
    });

    // ✅ Match avec le texte de ton label de fichier
    const file = new File(["hello"], "photo.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/Joindre une photo/i);

    fireEvent.change(input, {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByText(/publier l'annonce/i));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/annonces"));
  });
});