const request = require('supertest');
const app = require('../src/app');

describe('🔐 Audit Authentification : auth.controller.js', () => {
  it('400 - Doit rejeter un login sans mot de passe', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com' });
    expect(res.statusCode).toBe(400); // Couvre la validation initiale du controller
  });

  it('401 - Doit rejeter un email qui n existe pas en base', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'fantome@test.com', password: 'password123' });
    expect(res.statusCode).toBe(401); // Couvre la vérification result.rows.length === 0
  });

  it('400 - Doit rejeter un refresh sans token dans le body', async () => {
    const res = await request(app)
      .post('/api/auth/refresh')
      .send({});
    expect(res.statusCode).toBe(400); // Couvre la vérification de refresh()
  });
});