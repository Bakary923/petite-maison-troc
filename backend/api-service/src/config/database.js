// Chargement des variables d'environnement (local uniquement)
if (!process.env.CI && process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { Pool } = require('pg');

const isCI = process.env.CI === 'true' || process.env.NODE_ENV === 'test';

// --- LOGIQUE DE CONNEXION ---
const poolConfig = process.env.DATABASE_URL 
  ? { connectionString: process.env.DATABASE_URL } // 👈 Priorité à l'URL complète si elle existe
  : {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

// Ajout du SSL pour Supabase (hors CI)
poolConfig.ssl = isCI ? false : { rejectUnauthorized: false };

const pool = new Pool(poolConfig);

// Test de connexion enrichi pour le débuggage
pool
  .query('SELECT 1')
  .then(() => {
    console.log(`✅ Connexion PostgreSQL OK (mode: ${isCI ? 'CI/test' : 'production'})`);
    console.log(`🗄️  Cible : ${process.env.DATABASE_URL ? 'DATABASE_URL' : process.env.DB_HOST}`);
  })
  .catch((err) => {
    console.error('❌ Erreur connexion PostgreSQL', err);
    console.error('Détails de la config utilisée :', {
      host: poolConfig.host || 'via URL',
      port: poolConfig.port || 'via URL',
      user: poolConfig.user || 'via URL'
    });
  });

module.exports = pool;