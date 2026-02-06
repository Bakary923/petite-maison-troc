// 1. Chargement des variables d'environnement
// En production (OpenShift), les variables sont injectées par le Deployment (Secret)
if (!process.env.CI && process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const { Pool } = require('pg');

// 2. Détection de l'environnement
const isCI = process.env.CI === 'true' || process.env.NODE_ENV === 'test';

// 3. Configuration de la connexion
const poolConfig = {};

if (process.env.DATABASE_URL) {
  // PRIORITÉ : On utilise l'URL complète (Connection String)
  // C'est la méthode la plus fiable pour le Pooler Supabase (Port 6543)
  poolConfig.connectionString = process.env.DATABASE_URL;
} else {
  // FALLBACK : Utilisation des variables individuelles (Local/Dev)
  poolConfig.host = process.env.DB_HOST;
  poolConfig.port = Number(process.env.DB_PORT) || 5432;
  poolConfig.database = process.env.DB_NAME;
  poolConfig.user = process.env.DB_USER;
  poolConfig.password = process.env.DB_PASSWORD;
}

// 4. RÉGLAGE CRITIQUE : Sécurité SSL
// Supabase exige le SSL. Cependant, OpenShift Sandbox ne possède pas 
// les certificats racines de Supabase dans son store.
// 'rejectUnauthorized: false' permet d'accepter la connexion sécurisée
// sans que Node.js ne bloque à cause du certificat "auto-signé".
poolConfig.ssl = isCI ? false : { 
  rejectUnauthorized: false 
};

// ⭐ AJOUT CRITIQUE POUR OPENSHIFT + SUPABASE ⭐
// OpenShift ne possède PAS les certificats CA de Supabase.
// Node.js bloque donc la connexion AVANT même que pg ne prenne la main.
// Cette ligne désactive la vérification TLS globale côté Node.
// → C'est EXACTEMENT ce que fait ton collègue.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// 5. Initialisation du Pool
const pool = new Pool(poolConfig);

// 6. Test de connexion (Indispensable pour voir les logs dans OpenShift)
pool
  .query('SELECT 1')
  .then(() => {
    console.log(`✅ Connexion PostgreSQL OK (mode: ${isCI ? 'CI/test' : 'production'})`);
    console.log(`🗄️  Source : ${process.env.DATABASE_URL ? 'DATABASE_URL' : 'Variables DB_HOST'}`);
  })
  .catch((err) => {
    console.error('❌ Erreur de connexion PostgreSQL !');
    console.error('Détails de l\'erreur :', err.message);
    
    // Aide au débuggage pour le jury :
    if (err.message.includes('self-signed certificate')) {
      console.error('💡 Conseil : Vérifiez que rejectUnauthorized est bien à false.');
      console.error('💡 Conseil : NODE_TLS_REJECT_UNAUTHORIZED doit être à 0 dans OpenShift.');
    }
  });

module.exports = pool;
