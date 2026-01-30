const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'test_secret_pour_ci');

describe('📦 Audit Logique Métier : annonces.routes.js', () => {
  it('400 - Doit rejeter un titre trop long (>100 chars)', async () => {
    const res = await request(app)
      .post('/api/annonces')
      .set('Authorization', `Bearer ${token}`)
      .send({ titre: 'A'.repeat(101), description: 'Description valide' });
    expect(res.statusCode).toBe(400); // Couvre les validations express-validator
  });

  it('404 - Doit retourner une erreur si l annonce à supprimer n existe pas', async () => {
    const res = await request(app)
      .delete('/api/annonces/999999')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toBe(404); // Couvre la branche check.rows.length === 0
  });
});