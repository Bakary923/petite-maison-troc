import { API_BASE_URL } from '../config';

describe('⚙️ Configuration API', () => {
  it('⚓ Doit pointer vers le port 30000 (NodePort Minikube)', () => {
    // Vérifie que le front est correctement configuré pour l'orchestration
    expect(API_BASE_URL).toBe('http://localhost:30000');
  });

  it('⚓ Ne doit pas être une chaîne vide', () => {
    expect(API_BASE_URL.length).toBeGreaterThan(0);
  });
});