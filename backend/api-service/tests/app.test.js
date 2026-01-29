const request = require('supertest');
const express = require('express');

// Création d'une app temporaire pour tester si l'environnement Jest fonctionne
const app = express();
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

describe('Vérification Santé de l\'API', () => {
  it('doit répondre 200 sur la route /health', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body.status).toBe('ok');
  });
});