import { API_BASE_URL } from '../config';

/**
 * TEST CONFIGURATION : API_BASE_URL
 * ✅ Objectif : Vérifier le point d'ancrage vers l'orchestrateur Minikube.
 */
describe('⚙️ Test Configuration : API', () => {
  it('⚓ Doit pointer vers l’URL du tunnel Minikube par défaut', () => {
    // On s'assure que le NodePort configuré est bien le 30000
    expect(API_BASE_URL).toBe('http://localhost:30000');
  });
});