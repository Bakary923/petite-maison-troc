import { API_BASE_URL } from '../config';

/**
 * TEST CONFIGURATION : API_BASE_URL
 * * Objectif :
 * - Vérifier que le front pointe bien vers l'orchestrateur Minikube
 * - S'assurer que le NodePort (30000) est correct pour le tunnel
 * ✅ Compatible CI : Test unitaire léger (Zéro dépendance UI)
 */
describe('⚙️ Configuration API', () => {

  it('⚓ Doit être définie et ne pas être vide', () => {
    expect(API_BASE_URL).toBeDefined();
    expect(API_BASE_URL.length).toBeGreaterThan(0);
  });

  it('⚓ Doit pointer vers l’URL du tunnel Minikube par défaut', () => {
    // Ce test valide que ton frontend communique avec le NodePort 30000 de K8s
    expect(API_BASE_URL).toBe('http://localhost:30000');
  });

});