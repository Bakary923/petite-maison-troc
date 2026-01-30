const request = require('supertest');
const app = require('../src/app');

/**
 * ============================================================================
 * AUDIT DE DISPONIBILITÉ & ROUTAGE (BOOTSTRAP)
 * Ce fichier valide le point d'entrée principal de l'API.
 * Note : Le fichier src/app.js est exclu du calcul de couverture SonarCloud
 * car il gère l'orchestration technique (CORS, Helmet, Ports) et non la logique.
 * ============================================================================
 */
describe('🌐 API Bootstrap - Tests fonctionnels de disponibilité', () => {

  /**
   * TEST 1 : Health Check (Route racine)
   * Objectif : Vérifier que l'application est "Ready" sur le cluster Kubernetes.
   * Utilité : Indispensable pour les sondes de disponibilité (Liveness/Readiness).
   */
  it('200 - Health Check (L’API répond positivement)', async () => {
    const res = await request(app).get('/');
    
    // Vérification du code de statut HTTP
    expect(res.statusCode).toBe(200);
    
    // Vérification du message de bienvenue de la plateforme
    expect(res.text).toContain('API Petite Maison du Troc opérationnelle');
  });

  /**
   * TEST 2 : Gestion du Routage Inexistant
   * Objectif : Valider que le middleware 404 global est bien positionné.
   * Sécurité : Empêche l'exposition d'erreurs techniques sur des routes invalides.
   */
  it('404 - Route inconnue (Gestion des erreurs de routage)', async () => {
    const res = await request(app).get('/api/v1/route-inexistante-test');
    
    // L'API doit retourner une erreur 404 propre
    expect(res.statusCode).toBe(404);
  });

});