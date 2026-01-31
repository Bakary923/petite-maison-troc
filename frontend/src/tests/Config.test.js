import { API_BASE_URL } from '../config';

/**
 * ============================================================================
 * TEST DE CONFIGURATION : POINT D'ENTRÉE API
 * Objectif : Garantir l'intégrité de la liaison Frontend-Backend.
 * Contexte : Vérifie que l'URL cible correspond au NodePort exposé par Minikube.
 * ============================================================================
 */

describe('⚙️ Test Configuration : API', () => {

  /**
   * TEST : Validation de l'URL du Tunnel
   * Pourquoi : Dans une usine logicielle DevSecOps, la configuration doit être 
   * prédictive pour assurer la connectivité entre les conteneurs.
   */
  it('⚓ Doit pointer vers l’URL du tunnel Minikube par défaut', () => {
    // On vérifie que la constante globale pointe bien sur le port 30000 (NodePort standard)
    // Cela garantit que le Frontend "voit" le tunnel vers le cluster local.
    expect(API_BASE_URL).toBe('http://localhost:30000');
  });

});