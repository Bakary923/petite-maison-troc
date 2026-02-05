import { API_BASE_URL } from '../config';

describe('⚙️ Configuration API', () => {
  it('⚓ Doit pointer vers l\'Ingress (domaine local)', () => {
    // On valide que le frontend utilise bien l'adresse définie dans l'Ingress
    // au lieu de l'ancien port 30000
    expect(API_BASE_URL).toBe('http://petite-maison.local/api');
  });

  it('⚓ Ne doit pas être une chaîne vide', () => {
    expect(API_BASE_URL.length).toBeGreaterThan(0);
  });
});