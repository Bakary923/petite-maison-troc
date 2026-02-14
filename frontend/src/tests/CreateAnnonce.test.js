/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import CreateAnnonce from "../pages/CreateAnnonce";
import { AuthContext } from "../contexts/AuthContext";
import axios from "axios";

// --- Mock Cloudinary (axios) ---
jest.mock("axios");

// --- Mock useNavigate ---
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("CreateAnnonce", () => {
  let mockAuthFetch;

  beforeEach(() => {
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

  // ---------------------------------------------------------
  // TEST 1 : Création d'annonce sans image
  // ---------------------------------------------------------
  test("envoie une annonce valide sans image", async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/Titre/i), {
      target: { value: "Chaise hantée" },
    });

    fireEvent.change(screen.getByPlaceholderText(/Décrivez/i), {
      target: { value: "Elle grince même quand personne n'est assis." },
    });

    fireEvent.click(screen.getByText(/publier l'annonce/i));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/annonces")
    );
  });

  // ---------------------------------------------------------
  // TEST 2 : Upload Cloudinary + création d'annonce
  // ---------------------------------------------------------
  test("upload une image et crée l'annonce", async () => {
    // 🔥 Mock Cloudinary upload OK
    axios.post.mockResolvedValue({
      data: { secure_url: "https://cloudinary.com/fake.jpg" },
    });

    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/Titre/i), {
      target: { value: "Miroir brisé" },
    });

    fireEvent.change(screen.getByPlaceholderText(/Décrivez/i), {
      target: { value: "On ne voit pas son reflet dedans." },
    });

    const file = new File(["contenu_image"], "photo.jpg", {
      type: "image/jpeg",
    });

    const input = screen.getByLabelText(/Joindre une photo/i);
    fireEvent.change(input, { target: { files: [file] } });

    fireEvent.click(screen.getByText(/publier l'annonce/i));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());
    await waitFor(() =>
      expect(mockNavigate).toHaveBeenCalledWith("/annonces")
    );
  });
});
