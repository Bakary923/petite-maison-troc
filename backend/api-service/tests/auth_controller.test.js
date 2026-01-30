const request = require('supertest');
const app = require('../src/app');

/**
 * ============================================================================
 * AUDIT DE COUVERTURE : AUTH.CONTROLLER.JS
 * Objectif : Valider la logique de contrôle d'accès et de gestion des erreurs.
 * Ce fichier permet d'augmenter significativement le score SonarCloud.
 * ============================================================================
 */
describe('🔐 Audit Authentification : auth.controller.js', () => {

  // --- TESTS DE LOGIN ---
  
  it('400 - Doit rejeter un login sans mot de passe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });
    
    // Valide la condition de présence des champs (ligne 95)
    expect(res.statusCode).toBe(400); 
  });

  it('401 - Doit rejeter un email qui n existe pas en base', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fantome@test.com', password: 'password123' });
    
    // Valide la vérification d'existence en base (ligne 103)
    expect(res.statusCode).toBe(401); 
  });

  // --- TESTS DE REFRESH TOKEN ---

  it('400 - Doit rejeter un refresh sans token dans le body', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});
    
    // Valide la vérification du body pour le renouvellement
    expect(res.statusCode).toBe(400); 
  });

  // --- TESTS D'INSCRIPTION & VALIDATION ---

  /**
   * Justification : Ce test vérifie que le contrôleur bloque les données nulles 
   * avant même d'interroger la base de données, assurant la robustesse du système.
   */
  it('400 - Doit rejeter les données nulles lors de l inscription', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: null, password: null, username: null }); 
    
    // Valide la barrière de sécurité de la ligne 20
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Champs requis manquants');
  });
});