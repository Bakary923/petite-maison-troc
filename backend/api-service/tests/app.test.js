const request = require('supertest');
const app = require('../src/app'); // 💡 IMPORTATION DE TA VRAIE APP

/**
 * ============================================================================
 * AUDIT GLOBAL : APP.JS
 * Objectif : Valider les middlewares globaux et les routes de base.
 * Ce test permet de couvrir les lignes 74-76 de app.js et franchir les 80%.
 * ============================================================================
 */
describe('🌐 Audit de l\'Application (app.js)', () => {

  /**
   * TEST 1 : ROUTE DE DIAGNOSTIC
   * Cible : app.js ligne 74
   * Justification : Vérifie que l'API est correctement initialisée sur le cluster.
   */
  it('200 - Doit répondre au Health Check (/)', async () => {
    const res = await request(app).get('/');
    
    // Valide la branche de réponse principale de app.js
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('API Petite Maison du Troc opérationnelle');
  });

  /**
   * TEST 2 : GESTION DES ERREURS GLOBALES
   * Objectif : Vérifier que Express gère les routes inexistantes proprement.
   */
  it('404 - Doit retourner une erreur pour une route inconnue', async () => {
    const res = await request(app).get('/api/v1/unknown-route');
    
    // Assure la robustesse globale de l'application
    expect(res.statusCode).toBe(404);
  });
});