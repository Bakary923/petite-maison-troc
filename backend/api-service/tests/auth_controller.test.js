const request = require('supertest');
const app = require('../src/app');

/**
 * ============================================================================
 * AUDIT DE COUVERTURE : AUTH.CONTROLLER.JS
 * Objectif : Valider les barrières de sécurité et la gestion des erreurs.
 * Ce fichier permet d'atteindre les seuils de couverture exigés par SonarCloud.
 * ============================================================================
 */
describe('🔐 Audit Authentification : auth.controller.js', () => {

  // --- TESTS DE LOGIN (Vérification des accès) ---
  
  it('400 - Doit rejeter un login sans mot de passe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });
    
    // Vérifie la validation de présence des champs requis
    expect(res.statusCode).toBe(400); 
  });

  it('401 - Doit rejeter un email qui n existe pas en base', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fantome@test.com', password: 'password123' });
    
    // Vérifie la gestion des identifiants inconnus
    expect(res.statusCode).toBe(401); 
  });

  // --- TESTS DE REFRESH TOKEN (Continuité de session) ---

  it('400 - Doit rejeter un refresh sans token dans le body', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});
    
    // Vérifie que le renouvellement de session exige un token
    expect(res.statusCode).toBe(400); 
  });

  // --- TESTS D'INSCRIPTION & VALIDATION (Qualité des données) ---

  /**
   * TEST DE ROBUSTESSE :
   * Vérifie que le contrôleur bloque les données nulles immédiatement.
   * Cela couvre la barrière de sécurité (ligne 20) et augmente le coverage global.
   */
  it('400 - Doit rejeter les données nulles lors de l inscription', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: null, password: null, username: null }); 
    
    // Validation du rejet des entrées non conformes
    expect(res.statusCode).toBe(400);
    // On vérifie que le corps de la réponse contient bien une erreur
    expect(res.body).toHaveProperty('error'); 
  });
});