const React = require("react");

module.exports = {
  __esModule: true, // <-- ESSENTIEL pour les imports nommés
  useNavigate: () => jest.fn(),
  MemoryRouter: ({ children }) => React.createElement("div", null, children),
  Link: ({ children }) => React.createElement("a", null, children),
};
