// Chargement des variables d'environnement en local uniquement
// En CI ou en production, on ne charge jamais .env
if (!process.env.CI && process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { Pool } = require('pg');

// Détection du mode CI/test
const isCI = process.env.CI === 'true' || process.env.NODE_ENV === 'test';

// --- CONSTRUCTION DE LA CONFIG DE CONNEXION ---
// Priorité à DATABASE_URL si elle existe (cas de la production sur OpenShift)
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
    }
  : {
      // Fallback si DATABASE_URL n'est pas fournie
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    };

// --- SSL POUR SUPABASE ---
// Supabase impose SSL, mais OpenShift/Node rejette les certificats intermédiaires.
// rejectUnauthorized: false permet d'accepter la chaîne SSL Supabase.
// En CI, on désactive complètement SSL pour éviter les erreurs.
poolConfig.ssl = isCI
  ? false
  : {
      rejectUnauthorized: false,
    };

// Création du pool PostgreSQL
const pool = new Pool(poolConfig);

// Test de connexion pour debug
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
      user: poolConfig.user || 'via URL',
    });
  });

module.exports = pool;
