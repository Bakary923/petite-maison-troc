import { API_BASE_URL } from '../config';

describe('⚙️ Configuration API', () => {
  it('⚓ Doit pointer vers une URL valide (Ingress ou Localhost)', () => {
    // Le test vérifie si l'URL est soit celle de l'Ingress, soit celle de secours pour le tunnel
    const isCorrectURL = 
      API_BASE_URL === 'http://petite-maison.local/api' || 
      API_BASE_URL === 'http://localhost:3000';
    
    expect(isCorrectURL).toBe(true);
  });

  it('⚓ Ne doit pas être une chaîne vide', () => {
    expect(API_BASE_URL.length).toBeGreaterThan(0);
  });
});