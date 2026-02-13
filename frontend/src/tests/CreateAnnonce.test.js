/**
 * @jest-environment jsdom
 */

import React from "react";
import { render, fireEvent, screen, waitFor } from "@testing-library/react";
import CreateAnnonce from "../pages/CreateAnnonce";
import { AuthContext } from "../contexts/AuthContext";

// Mock Supabase
jest.mock("@supabase/supabase-js");

// Mock navigate() — mais on NE mock PAS react-router-dom ici
const mockNavigate = jest.fn();

// On utilise MemoryRouter depuis le mock global dans __mocks__
import { MemoryRouter } from "react-router-dom";

describe("CreateAnnonce", () => {
  const mockAuthFetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ message: "ok" })
    })
  );

  const renderPage = () =>
    render(
      <AuthContext.Provider value={{ authFetch: mockAuthFetch }}>
        <MemoryRouter>
          <CreateAnnonce />
        </MemoryRouter>
      </AuthContext.Provider>
    );

  test("affiche une erreur si titre ou description manquent", async () => {
    renderPage();

    fireEvent.click(screen.getByText(/publier/i));

    const errorMsg = await screen.findByText(/titre et description requis/i);
    expect(errorMsg).toBeInTheDocument();
  });

  test("envoie une annonce valide sans image", async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/titre/i), {
      target: { value: "Chaise" }
    });

    fireEvent.change(screen.getByPlaceholderText(/description/i), {
      target: { value: "Belle chaise en bois" }
    });

    fireEvent.click(screen.getByText(/publier/i));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/annonces"));
  });

  test("upload une image et crée l'annonce", async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/titre/i), {
      target: { value: "Chaise" }
    });

    fireEvent.change(screen.getByPlaceholderText(/description/i), {
      target: { value: "Belle chaise en bois" }
    });

    const file = new File(["hello"], "photo.jpg", { type: "image/jpeg" });

    fireEvent.change(screen.getByLabelText(/joindre une photo/i), {
      target: { files: [file] }
    });

    fireEvent.click(screen.getByText(/publier/i));

    await waitFor(() => expect(mockAuthFetch).toHaveBeenCalled());
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/annonces"));
  });
});
