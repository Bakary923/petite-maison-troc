import '@testing-library/jest-dom';

// --- MOCK FORM DATA ---
global.FormData = class FormDataMock {
  constructor() {
    this.fields = {};
  }
  append(key, value) {
    this.fields[key] = value;
  }
  get(key) {
    return this.fields[key];
  }
};

// --- MOCK DU MODULE supabaseClient.js ---
jest.mock('./supabaseClient', () => ({
  supabase: {
    storage: {
      from: () => ({
        upload: jest.fn().mockResolvedValue({
          data: { path: 'fake/path.png' },
          error: null
        }),
        remove: jest.fn().mockResolvedValue({
          data: {},
          error: null
        })
      })
    },
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: '123', email: 'test@test.com' } },
        error: null
      })
    }
  }
}));
