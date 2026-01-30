const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

describe('🛡️ Tests de Robustesse Sécurité (Coverage++)', () => {
  
  /**
   * Cible : auth.js (Lignes 23-26)
   * Objectif : Couvrir le bloc 'catch' du middleware d'authentification.
   */
  it('De vrait rejeter un token totalement malformé (401)', async () => {
    const res = await request(app)
      .get('/api/annonces/me')
      .set('Authorization', 'Bearer token_nimporte_quoi');
    
    expect(res.statusCode).toEqual(401);
    expect(res.body.error).toBe('Token invalide ou expiré');
  });

  /**
   * Cible : auth.js (Ligne 13)
   * Objectif : Couvrir le cas où le header est présent mais vide.
   */
  it('Devrait rejeter un header Authorization sans format Bearer', async () => {
    const res = await request(app)
      .get('/api/annonces/me')
      .set('Authorization', 'Basic user:pass');
    
    expect(res.statusCode).toEqual(401);
  });

  /**
   * Cible : annonces.routes.js (Validation d'entrée)
   * Objectif : Couvrir les messages d'erreurs spécifiques d'express-validator.
   */
  it('Devrait rejeter une annonce avec une description trop courte (<10 chars)', async () => {
    // On génère un token valide pour passer le middleware auth
    const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'test');
    
    const res = await request(app)
      .post('/api/annonces')
      .set('Authorization', `Bearer ${token}`)
      .send({ titre: 'Vélo', description: 'Court' });
    
    expect(res.statusCode).toEqual(400);
    expect(res.body.errors[0].msg).toContain('10 caractères');
  });
});