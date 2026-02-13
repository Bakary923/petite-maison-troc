export const createClient = () => ({
  storage: {
    from: () => ({
      upload: async () => ({
        data: { path: "mock-image.jpg" },
        error: null
      }),
      getPublicUrl: () => ({
        data: { publicUrl: "https://mock-url" }
      })
    })
  }
});
