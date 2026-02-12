/**
 * POINT D'ENTRÉE PRINCIPAL - API PETITE MAISON DU TROC
 * Architecture optimisée pour OpenShift (Reverse Proxy Nginx)
 * Version : 2.0 - Mode Stateless (Migration PVC -> Supabase Storage)
 */

// Chargement des variables d'environnement
require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
// const fs = require('fs'); // ❌ SUPPRIMÉ : Plus besoin de manipuler le système de fichiers local

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
  contentSecurityPolicy: false, // Désactivé pour permettre les appels API externes (Supabase)
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(logger);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// ✅ GESTION DES FICHIERS (MISE À JOUR STATELESS)
// ============================================================================
// ❌ ANCIENNE LOGIQUE PVC : Supprimée pour résoudre l'erreur de montage RWO sur OpenShift.
// Les images ne sont plus servies localement mais via le CDN de Supabase.
/* const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir)); 
*/

// ============================================================================
// ✅ CONFIGURATION CORS (MISE À JOUR : DOMAINES PROD + PREFLIGHT)
// ============================================================================
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://la-petite-maison-epouvante.org',
  'https://www.la-petite-maison-epouvante.org',
  'http://localhost:8080',
  'http://localhost:3000',
  'http://localhost:5173' // Port par défaut de Vite en local
].filter(Boolean);

app.use(cors({ 
  origin: function (origin, callback) {
    // Autoriser si pas d'origine (ex: outils internes) ou si dans la liste
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`🚫 CORS bloqué pour l'origine : ${origin}`);
      callback(new Error('❌ Action bloquée par la politique CORS de l\'API'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'Accept']
}));

// 🔥 Indispensable pour les nouvelles routes (Admin/Auth)
// Gère les requêtes de vérification "OPTIONS" envoyées par le navigateur
app.options(/(.*)/, cors());

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
  res.send("✅ API Petite Maison du Troc opérationnelle sur le cluster (Mode Stateless activé).");
});

// ============================================================================
// INITIALISATION DU SERVEUR
// ============================================================================
const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur backend démarré sur le port : ${PORT}`);
    console.log(`🗄️  Base de données ciblée : ${process.env.DB_HOST || 'localhost'}`);
    console.log(`📊 Système d'observabilité activé`);
    console.log(`☁️  Stockage Cloud : Supabase Storage configuré`);
  });
}

module.exports = app;