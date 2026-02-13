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

// --- MOCK SUPABASE v2 ---
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
        remove: jest.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    },
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: { id: '123' } } }),
    },
  }),
}));
