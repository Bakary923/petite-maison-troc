const request = require('supertest');
const app = require('../src/app');

describe('🛡️ Validation de la Politique de Sécurité (Auth)', () => {
  // Données de test uniques pour éviter les conflits en base de données
  const uniqueId = Date.now();
  const testUser = {
    username: `dev_lead_${uniqueId}`,
    email: `test_${uniqueId}@cesi.fr`,
    password: 'ComplexPassword123!'
  };

  /**
   * TEST 1 : INSCRIPTION (REGISTER)
   * Objectif : Vérifier la capacité du système à créer un compte et générer des tokens JWT.
   */
  it('1.1 Inscription - Doit créer un compte et retourner les tokens JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);
    
    // On attend un code 201 (Created)
    expect(res.statusCode).toEqual(201);
    // On vérifie la présence des tokens pour la gestion de session (Disponibilité)
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  /**
   * TEST 2 : SÉCURITÉ (LOGIN FAIL)
   * Objectif : Vérifier que le middleware de sécurité rejette les mauvaises informations.
   */
  it('1.2 Sécurité - Doit rejeter une connexion avec un mauvais mot de passe (401)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ 
        email: testUser.email, 
        password: 'MauvaisMotDePasse' 
      });
    
    // Le code 401 Unauthorized prouve que la barrière de sécurité fonctionne
    expect(res.statusCode).toEqual(401);
    expect(res.body.error).toBeDefined();
  });
});