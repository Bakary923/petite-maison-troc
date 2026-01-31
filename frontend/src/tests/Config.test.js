import { API_BASE_URL } from '../config';

/**
 * TEST CONFIGURATION : API_BASE_URL
 *
 * Objectif :
 * - Vérifier que le front pointe bien vers l'orchestrateur Minikube
 * - S'assurer que le NodePort par défaut est correct
 * ✅ Compatible CI : Test pur Node
 */
describe('⚙️ Configuration API', () => {
  it('⚓ Doit pointer vers l’URL du tunnel Minikube par défaut', () => {
    expect(API_BASE_URL).toBe('http://localhost:30000');
  });
});
