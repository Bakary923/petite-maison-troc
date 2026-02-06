/**
 * POINT D'ENTRÉE PRINCIPAL - API PETITE MAISON DU TROC
 * Architecture optimisée pour OpenShift (Reverse Proxy Nginx)
 */

// Chargement des variables d'environnement
require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// 🔥 Indispensable derrière un reverse proxy (OpenShift, Nginx)
// Permet à Express de lire correctement X-Forwarded-Proto (https)
app.set('trust proxy', true);

// Middlewares de sécurité et de partage de ressources
const helmet = require('helmet');
const cors = require('cors');

// ✅ OBSERVABILITÉ : Middleware de logs pour le monitoring
const logger = require('./middlewares/logger');

// ✅ SÉCURITÉ : Configuration Helmet (Adaptée pour environnement conteneurisé)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ GESTION DES FICHIERS : Persistance sur volume PVC
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ============================================================================
// ✅ CONFIGURATION CORS (ALIGNEE SUR LE REVERSE PROXY)
// ============================================================================
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:8080',
  'http://localhost:3000'
].filter(Boolean);

app.use(cors({ 
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('❌ Action bloquée par la politique CORS de l\'API'));
    }
  },
  credentials: true
}));

console.log(`🛡️  CORS : Origines autorisées ->`, allowedOrigins);

// ============================================================================
// CONNEXION BASE DE DONNÉES
// ============================================================================
const pool = require('./config/database');
app.locals.pool = pool;

// ============================================================================
// ARCHITECTURE DES ROUTES
// ============================================================================
const authRoutes = require('./auth/auth.routes');
const annoncesRoutes = require('./annonces/annonces.routes');
const adminRoutes = require('./admin/admin.routes');

app.use('/api/auth', authRoutes);
app.use('/api/annonces', annoncesRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => {
  res.send("✅ API Petite Maison du Troc opérationnelle sur le cluster.");
});

// ============================================================================
// INITIALISATION DU SERVEUR (PORT COHÉRENT AVEC YAML)
// ============================================================================
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur backend démarré sur le port : ${PORT}`);
    console.log(`🗄️  Base de données ciblée : ${process.env.DB_HOST || 'localhost'}`);
    console.log(`📊 Système d'observabilité activé`);
  });
}

module.exports = app;
