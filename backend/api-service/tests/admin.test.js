const request = require('supertest');
const app = require('../src/app');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret_pour_ci';
const userToken = jwt.sign({ id: 10, role: 'user' }, JWT_SECRET);
const adminToken = jwt.sign({ id: 1, role: 'admin' }, JWT_SECRET);

describe('🛡️ Audit Sécurité : admin.routes.js', () => {
  it('403 - Doit rejeter un utilisateur sans rôle admin', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`);
    expect(res.statusCode).toBe(403); // Couvre le middleware de sécurité
  });

  it('200 - Doit permettre à un admin de lister les utilisateurs', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200); // Couvre la route de récupération
  });
});