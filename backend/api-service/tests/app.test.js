const request = require('supertest');
const app = require('../src/app');
const fs = require('fs');
const path = require('path');

describe('🌐 Audit Final de Couverture : app.js', () => {
  
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
   * TEST 2 : Logique de création de dossier (Lignes 37-38)
   * Objectif : Forcer le passage dans la création du dossier uploads.
   */
  it('Logic - Doit s assurer que le dossier uploads est géré', () => {
    const uploadsDir = path.join(__dirname, '../../uploads');
    // On vérifie simplement que la logique de l'app a bien rendu le dossier disponible
    expect(fs.existsSync(uploadsDir)).toBe(true);
  });

  /**
   * TEST 3 : Gestion 404
   * Objectif : Couvrir les middlewares de fin de chaîne.
   */
  it('404 - Doit retourner une erreur pour une route inconnue', async () => {
    const res = await request(app).get('/api/v1/unknown');
    expect(res.statusCode).toBe(404);
  });
});