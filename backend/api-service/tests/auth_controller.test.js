const request = require('supertest');
const app = require('../src/app');

/**
 * ============================================================================
 * AUDIT DE COUVERTURE : AUTH.CONTROLLER.JS
 * Objectif : Atteindre le seuil de 80% imposé par la Quality Gate SonarCloud
 * en explorant les branches de validation et les blocs de gestion d'erreurs.
 * ============================================================================
 */
describe('🔐 Audit Authentification : auth.controller.js', () => {

  // --- TESTS DE VALIDATION ---
  
  it('400 - Doit rejeter un login sans mot de passe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });
    
    // Couvre la validation initiale du controller (ligne 95)
    expect(res.statusCode).toBe(400); 
  });

  it('401 - Doit rejeter un email qui n existe pas en base', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fantome@test.com', password: 'password123' });
    
    // Couvre la vérification result.rows.length === 0 (ligne 103)
    expect(res.statusCode).toBe(401); 
  });

  it('400 - Doit rejeter un refresh sans token dans le body', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});
    
    // Couvre la vérification de présence du token dans refresh()
    expect(res.statusCode).toBe(400); 
  });

  // ============================================================================
  // TEST CRITIQUE : COUVERTURE DES BLOCS CATCH (ERREUR 500)
  // Justification : Ce test simule une corruption de données pour forcer le 
  // passage dans les lignes de "Erreur serveur", permettant de valider la 
  // Quality Gate SonarCloud (passage de 75% à >80%).
  // ============================================================================
  it('500 - Doit gérer une erreur interne serveur lors de l inscription', async () => {
    // On envoie des valeurs nulles là où la DB attend des contraintes NOT NULL
    // Cela provoque un crash SQL capturé par le bloc catch(err)
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: null, password: null, username: null }); 
    
    // Couvre le bloc catch(err) et le console.error (lignes 83-84)
    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Erreur serveur.');
  });
});