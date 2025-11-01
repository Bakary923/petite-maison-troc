// On importe 'pg' pour PostgreSQL et dotenv pour charger les variables du .env
require('dotenv').config(); // Charge les variables d'environnement depuis .env automatiquement
const { Pool } = require('pg');


// On crée une "pool" de connexions PostgreSQL avec les infos cachées dans .env
const pool = new Pool({
  host: process.env.DB_HOST,         // hôte serveur, en général 'localhost'
  port: process.env.DB_PORT,         // port PostgreSQL, par défaut 5432
  database: process.env.DB_NAME,     // nom de la base, ici 'petite_maison'
  user: process.env.DB_USER,         // nom d'utilisateur DB, ici 'dev'
  password: process.env.DB_PASSWORD  // mot de passe DB, ici 'devpass'
});

// On exporte cette variable pour l'utiliser dans tous les contrôleurs facilement
module.exports = pool;
