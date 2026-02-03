module.exports = {
  // Simule la navigation sans dépendre du vrai module
  useNavigate: () => jest.fn(),

  // Simule un MemoryRouter minimal pour les tests CI
  MemoryRouter: ({ children }) => <div>{children}</div>,

  // Simule les composants de navigation
  Link: ({ children }) => <a>{children}</a>,
  Navigate: () => null,
};
