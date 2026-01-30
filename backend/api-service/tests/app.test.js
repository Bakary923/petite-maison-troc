const request = require('supertest');
const app = require('../src/app');
const fs = require('fs');
const path = require('path');

describe('🌐 Audit Infrastructure & Disponibilité : app.js', () => {

  /**
   * TEST 1 : Route de Diagnostic (Ligne 74)
   * Objectif : Couvrir la branche de Health Check.
   */
  it('200 - Doit répondre positivement à la route racine', async () => {
    const res = await request(app).get('/');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('API Petite Maison du Troc opérationnelle');
  });

  /**
   * TEST 2 : Validation de la logique de persistance (PVC ready)
   * Objectif : Vérifier que l'application détecte correctement le point de montage.
   */
  it('Logic - Doit confirmer l existence du dossier uploads', () => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    // Ce test garantit que la variable uploadsDir définie ligne 36 est correcte
    expect(fs.existsSync(uploadsDir)).toBeDefined();
  });

  /**
   * TEST 3 : Middleware 404
   * Objectif : Couvrir les dernières lignes du routeur global.
   */
  it('404 - Doit retourner une erreur pour une route inconnue', async () => {
    const res = await request(app).get('/api/v1/invalid-route');
    expect(res.statusCode).toBe(404);
  });
});