export const createClient = () => ({
  storage: {
    from: () => ({
      upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
      remove: jest.fn().mockResolvedValue({ data: {}, error: null }),
    }),
  },
});
