const React = require("react");

const mockNavigate = jest.fn();

module.exports = {
  __esModule: true,
  useNavigate: () => mockNavigate,
  MemoryRouter: ({ children }) => React.createElement("div", null, children),
  Link: ({ children }) => React.createElement("a", null, children),
  mockNavigate, // <-- on l’exporte pour le test
};
