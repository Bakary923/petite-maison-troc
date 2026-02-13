/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CreateAnnonce from "../pages/CreateAnnonce";
import { AuthContext } from "../contexts/AuthContext";

// 1. Mock simplifié de useNavigate (On n'utilise plus requireActual pour éviter les crashs)
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// 2. Mock de Supabase pour isoler le test du réseau et des variables d'env
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
    // Simulation d'une réponse API réussie
    mockAuthFetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ message: "Succès" }),
      })
    );
    mockNavigate.mockClear();
    jest.clearAllMocks();
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

    // Remplissage du titre
    fireEvent.change(screen.getByPlaceholderText(/Titre \(ex: Maison hantée\)/i), {
      target: { value: "Chaise hantée" },
    });

    // Remplissage de la description (Match avec ton nouveau texte)
    fireEvent.change(screen.getByPlaceholderText(/Décrivez les phénomènes/i), {
      target: { value: "Elle grince même quand personne n'est assis." },
    });

    // Clic sur le bouton de publication
    fireEvent.click(screen.getByText(/publier l'annonce/i));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/annonces"));
  });

  test("upload une image et crée l'annonce", async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/Titre \(ex: Maison hantée\)/i), {
      target: { value: "Miroir brisé" },
    });

    fireEvent.change(screen.getByPlaceholderText(/Décrivez les phénomènes/i), {
      target: { value: "On ne voit pas son reflet dedans." },
    });

    // Simulation de sélection de fichier
    const file = new File(["contenu_image"], "photo.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/Joindre une photo/i);

    fireEvent.change(input, {
      target: { files: [file] },
    });

    fireEvent.click(screen.getByText(/publier l'annonce/i));

    // On attend que l'API soit appelée et que la navigation se fasse
    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/annonces"));
  });
});