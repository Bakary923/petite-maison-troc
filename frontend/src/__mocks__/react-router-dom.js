const React = require("react");

module.exports = {
  useNavigate: () => jest.fn(),
  MemoryRouter: ({ children }) => React.createElement("div", null, children),
  Link: ({ children }) => React.createElement("a", null, children),
};
