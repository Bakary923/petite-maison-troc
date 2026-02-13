// --- 📌 Matchers Jest-DOM (obligatoire pour toBeInTheDocument) --- 
import '@testing-library/jest-dom';

// --- 🔧 MOCK FORM DATA POUR JEST ---
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

// --- 🔧 MOCK SUPABASE POUR LES TESTS ---
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: jest.fn().mockResolvedValue({ data: {}, error: null }),
        remove: jest.fn().mockResolvedValue({ data: {}, error: null }),
      }),
    },
  }),
}));
