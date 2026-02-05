// Chargement des variables d'environnement (local uniquement)
// ❗ En CI et en production (OpenShift), on NE charge PAS .env
if (!process.env.CI && process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { Pool } = require('pg');

// Détection du mode CI / tests
// 👉 En CI : Postgres local → PAS de SSL
// 👉 En Production : Supabase → SSL obligatoire
const isCI = process.env.CI === 'true' || process.env.NODE_ENV === 'test';

// Connexion PostgreSQL
// 👉 En CI : DB locale (localhost)
// 👉 En Production : Supabase (db.xxxxx.supabase.co)
// Supabase impose SSL, mais la CI NE LE SUPPORTE PAS → d'où la logique conditionnelle
const pool = new Pool({
  host: process.env.DB_HOST,          // ex: db.xxxxx.supabase.co ou localhost en CI
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME,      // "postgres" pour Supabase
  user: process.env.DB_USER,          // "postgres" pour Supabase
  password: process.env.DB_PASSWORD,  // mot de passe Supabase ou CI
  ssl: isCI ? false : { rejectUnauthorized: false } // ❗ CI = pas de SSL / Prod = SSL obligatoire
});

// Test de connexion (utile pour les logs Kubernetes et CI)
pool
  .query('SELECT 1')
  .then(() => {
    console.log(`✅ Connexion PostgreSQL OK (mode: ${isCI ? 'CI/test' : 'production'})`);
  })
  .catch((err) => {
    console.error('❌ Erreur connexion PostgreSQL', err);
  });

module.exports = pool;
