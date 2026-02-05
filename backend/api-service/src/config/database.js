// Chargement des variables d'environnement (local uniquement)
require('dotenv').config();

const { Pool } = require('pg');

// Connexion PostgreSQL vers SUPABASE
// Supabase impose SSL et un host externe (db.xxxxx.supabase.co)
const pool = new Pool({
  host: process.env.DB_HOST,          // ex: db.xxxxx.supabase.co
  port: Number(process.env.DB_PORT),  // 5432
  database: process.env.DB_NAME,      // "postgres"
  user: process.env.DB_USER,          // "postgres"
  password: process.env.DB_PASSWORD,  // ton vrai mot de passe Supabase
  ssl: {
    rejectUnauthorized: false         // obligatoire pour Supabase
  }
});

// Test de connexion (utile pour les logs Kubernetes)
pool
  .query('SELECT 1')
  .then(() => {
    console.log('✅ Connexion Supabase PostgreSQL OK');
  })
  .catch((err) => {
    console.error('❌ Erreur connexion Supabase PostgreSQL', err);
  });

module.exports = pool;
