import { API_BASE_URL } from '../config';

describe('⚙️ Configuration API', () => {
  it('⚓ Doit pointer vers une URL valide (Proxy, Ingress ou Localhost)', () => {
    // Le test doit maintenant accepter les nouvelles routes du Reverse Proxy
    const isCorrectURL = 
      API_BASE_URL === '/api' ||                         // Mode Production (Chemin relatif)
      API_BASE_URL === 'http://localhost:3000/api' ||    // Mode Développement Local
      API_BASE_URL === 'http://petite-maison.local/api'; // Ancienne compatibilité (optionnel)
    
    expect(isCorrectURL).toBe(true);
  });

  it('⚓ Ne doit pas être une chaîne vide', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(API_BASE_URL.length).toBeGreaterThan(0);
  });
});