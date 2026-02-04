module.exports = {
  useNavigate: () => jest.fn(),
  MemoryRouter: ({ children }) => <div>{children}</div>,
};
