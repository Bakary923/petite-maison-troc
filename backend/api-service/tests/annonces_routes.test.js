// annonces.routes.test.js
const request = require('supertest');
const express = require('express');
const router = require('../routes/annonces');

// ─── Mock authMiddleware ───────────────────────────────────────────────────────
jest.mock('../middlewares/auth', () => (req, res, next) => {
  req.user = { id: 1 };
  next();
});

// ─── Factory app ──────────────────────────────────────────────────────────────
function makeApp(poolMock) {
  const app = express();
  app.use(express.json());
  app.locals.pool = poolMock;
  app.use('/api/annonces', router);
  return app;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makePool = (rows = [], overrides = {}) => ({
  query: jest.fn().mockResolvedValue({ rows }),
  ...overrides,
});

const validBody = {
  titre: 'Mon titre valide',
  description: 'Une description suffisamment longue pour passer la validation.',
  image: 'https://example.com/img.jpg',
};

beforeEach(() => jest.clearAllMocks());

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/annonces
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/annonces', () => {
  it('retourne les annonces validées (200)', async () => {
    const annonces = [{ id: 1, titre: 'Test', status: 'validated' }];
    const app = makeApp(makePool(annonces));

    const res = await request(app).get('/api/annonces');

    expect(res.status).toBe(200);
    expect(res.body.annonces).toEqual(annonces);
  });

  it('retourne 500 en cas d\'erreur DB', async () => {
    const pool = { query: jest.fn().mockRejectedValue(new Error('DB error')) };
    const app = makeApp(pool);

    const res = await request(app).get('/api/annonces');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Erreur serveur');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// GET /api/annonces/me
// ══════════════════════════════════════════════════════════════════════════════
describe('GET /api/annonces/me', () => {
  it('retourne les annonces de l\'utilisateur connecté (200)', async () => {
    const annonces = [{ id: 2, titre: 'Ma annonce', user_id: 1 }];
    const app = makeApp(makePool(annonces));

    const res = await request(app).get('/api/annonces/me');

    expect(res.status).toBe(200);
    expect(res.body.annonces).toEqual(annonces);
  });

  it('retourne 500 en cas d\'erreur DB', async () => {
    const pool = { query: jest.fn().mockRejectedValue(new Error('DB error')) };
    const app = makeApp(pool);

    const res = await request(app).get('/api/annonces/me');

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Erreur serveur');
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/annonces
// ══════════════════════════════════════════════════════════════════════════════
describe('POST /api/annonces', () => {
  it('crée une annonce avec succès (201)', async () => {
    const created = { id: 10, ...validBody, status: 'pending', user_id: 1 };
    const app = makeApp(makePool([created]));

    const res = await request(app).post('/api/annonces').send(validBody);

    expect(res.status).toBe(201);
    expect(res.body.annonce).toEqual(created);
    expect(res.body.message).toMatch(/en attente/i);
  });

  it('utilise "default-annonce.jpg" si aucune image fournie', async () => {
    const created = { id: 11, titre: validBody.titre, image: 'default-annonce.jpg' };
    const pool = makePool([created]);
    const app = makeApp(pool);

    const { image, ...bodyWithoutImage } = validBody;
    await request(app).post('/api/annonces').send(bodyWithoutImage);

    const callArgs = pool.query.mock.calls[0][1];
    expect(callArgs[2]).toBe('default-annonce.jpg');
  });

  it('retourne 400 si le titre est manquant', async () => {
    const app = makeApp(makePool());
    const res = await request(app)
      .post('/api/annonces')
      .send({ description: validBody.description });

    expect(res.status).toBe(400);
    expect(res.body.errors).toBeDefined();
  });

  it('retourne 400 si le titre est trop court (< 3 caractères)', async () => {
    const app = makeApp(makePool());
    const res = await request(app)
      .post('/api/annonces')
      .send({ ...validBody, titre: 'AB' });

    expect(res.status).toBe(400);
  });

  it('retourne 400 si la description est trop courte (< 10 caractères)', async () => {
    const app = makeApp(makePool());
    const res = await request(app)
      .post('/api/annonces')
      .send({ ...validBody, description: 'Court' });

    expect(res.status).toBe(400);
  });

  it('retourne 400 si la description est trop longue (> 500 caractères)', async () => {
    const app = makeApp(makePool());
    const res = await request(app)
      .post('/api/annonces')
      .send({ ...validBody, description: 'A'.repeat(501) });

    expect(res.status).toBe(400);
  });

  it('retourne 500 en cas d\'erreur DB', async () => {
    const pool = { query: jest.fn().mockRejectedValue(new Error('DB error')) };
    const app = makeApp(pool);

    const res = await request(app).post('/api/annonces').send(validBody);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/création/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// PUT /api/annonces/:id
// ══════════════════════════════════════════════════════════════════════════════
describe('PUT /api/annonces/:id', () => {
  it('met à jour une annonce existante (200)', async () => {
    const existing = [{ id: 1, image: 'old.jpg' }];
    const pool = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: existing }) // SELECT check
        .mockResolvedValueOnce({ rows: [] }),       // UPDATE
    };
    const app = makeApp(pool);

    const res = await request(app).put('/api/annonces/1').send(validBody);

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/ok/i);
  });

  it('retourne 404 si l\'annonce n\'existe pas', async () => {
    const app = makeApp(makePool([]));

    const res = await request(app).put('/api/annonces/999').send(validBody);

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/non trouvée/i);
  });

  it('utilise l\'ancienne image si aucune nouvelle image fournie', async () => {
    const existing = [{ id: 1, image: 'old-image.jpg' }];
    const pool = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: existing })
        .mockResolvedValueOnce({ rows: [] }),
    };
    const app = makeApp(pool);

    const { image, ...bodyWithoutImage } = validBody;
    await request(app).put('/api/annonces/1').send(bodyWithoutImage);

    const updateCall = pool.query.mock.calls[1][1];
    expect(updateCall[2]).toBe('old-image.jpg');
  });

  it('retourne 400 si la validation échoue', async () => {
    const app = makeApp(makePool());
    const res = await request(app)
      .put('/api/annonces/1')
      .send({ titre: 'AB', description: 'Court' });

    expect(res.status).toBe(400);
  });

  it('retourne 500 en cas d\'erreur DB', async () => {
    const pool = { query: jest.fn().mockRejectedValue(new Error('DB error')) };
    const app = makeApp(pool);

    const res = await request(app).put('/api/annonces/1').send(validBody);

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/mise à jour/i);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// DELETE /api/annonces/:id
// ══════════════════════════════════════════════════════════════════════════════
describe('DELETE /api/annonces/:id', () => {
  it('supprime une annonce appartenant à l\'utilisateur (200)', async () => {
    const pool = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ user_id: 1 }] }) // SELECT check
        .mockResolvedValueOnce({ rows: [] }),               // DELETE
    };
    const app = makeApp(pool);

    const res = await request(app).delete('/api/annonces/1');

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/supprimée/i);
  });

  it('retourne 404 si l\'annonce n\'existe pas', async () => {
    const app = makeApp(makePool([]));

    const res = await request(app).delete('/api/annonces/999');

    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/non trouvée/i);
  });

  it('retourne 403 si l\'annonce appartient à un autre utilisateur', async () => {
    const pool = makePool([{ user_id: 99 }]); // user_id différent de req.user.id (1)
    const app = makeApp(pool);

    const res = await request(app).delete('/api/annonces/1');

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/interdit/i);
  });

  it('retourne 500 en cas d\'erreur DB', async () => {
    const pool = { query: jest.fn().mockRejectedValue(new Error('DB error')) };
    const app = makeApp(pool);

    const res = await request(app).delete('/api/annonces/1');

    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/suppression/i);
  });
});