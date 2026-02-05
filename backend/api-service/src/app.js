/**
 * POINT D'ENTRÉE PRINCIPAL - API PETITE MAISON DU TROC
 * Architecture optimisée pour l'orchestration (Minikube / OpenShift)
 */

// Chargement des variables d'environnement (.env en local, injectées par K8s en cluster)
require('dotenv').config();

const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');

// Middlewares de sécurité et de partage de ressources
const helmet = require('helmet');
const cors = require('cors');

// ✅ OBSERVABILITÉ : Middleware de logs pour le monitoring des performances et erreurs
const logger = require('./middlewares/logger');

// ✅ SÉCURITÉ (ISO 25010) : Configuration de Helmet pour protéger contre les failles XSS et Clickjacking
app.use(helmet({
  contentSecurityPolicy: false,        // Désactivé pour faciliter le développement des ressources
  crossOriginResourcePolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Activation du système de traçabilité des requêtes
app.use(logger);

// Parsing des données JSON et URL-encoded avec gestion des limites de taille
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ GESTION DES FICHIERS : Persistance des images (Dossier 'uploads')
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ============================================================================
// ✅ CONFIGURATION CORS DYNAMIQUE (DÉCOUPLAGE)
// ============================================================================
// Liste des origines autorisées (Cluster Ingress + Ports de secours pour le tunnel)
const allowedOrigins = [
  process.env.FRONTEND_URL,              // http://petite-maison.local
  'http://localhost:8080',               // Tunnel Frontend (port-forward)
  'http://localhost:3001'                // Ancien port local
].filter(Boolean);                       // Supprime les entrées vides ou undefined

app.use(cors({ 
  origin: function (origin, callback) {
    // On autorise les requêtes sans 'origin' (ex: serveurs ou outils internes)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('❌ Action bloquée par la politique CORS de l\'API'));
    }
  },
  credentials: true // Indispensable pour la gestion sécurisée des cookies/sessions
}));

// Log de démarrage pour faciliter le débogage dans les journaux Kubernetes (kubectl logs)
console.log(`🛡️  CORS : Origines autorisées configurées ->`, allowedOrigins);

// ============================================================================
// CONNEXION BASE DE DONNÉES
// ============================================================================
const pool = require('./config/database');
app.locals.pool = pool; // Injection du pool pour accès global dans les routers

// ============================================================================
// ARCHITECTURE DES ROUTES (MODULARITÉ)
// ============================================================================
const authRoutes = require('./auth/auth.routes');
const annoncesRoutes = require('./annonces/annonces.routes');
const adminRoutes = require('./admin/admin.routes');

app.use('/api/auth', authRoutes);         // Gestion identités (Register/Login/Refresh)
app.use('/api/annonces', annoncesRoutes); // Gestion catalogue (Public & Privé)
app.use('/api/admin', adminRoutes);       // Modération (Accès restreint aux admins)

// Route de diagnostic (Health Check)
app.get('/', (req, res) => {
  res.send("✅ API Petite Maison du Troc opérationnelle sur le cluster.");
});

// ============================================================================
// INITIALISATION DU SERVEUR
// ============================================================================
// Priorité au port injecté par l'orchestrateur (Kubernetes Service)
const PORT = process.env.PORT || 3000;

// ✅ CORRECTION CI : On n'écoute sur le port que si on n'est pas en mode TEST
// Cela évite l'erreur "app.address is not a function" dans Jest/Supertest
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Serveur backend démarré sur le port : ${PORT}`);
    console.log(`🗄️  Base de données ciblée : ${process.env.DB_HOST || 'localhost'}`);
    console.log(`📊 Système d'observabilité activé`);
  });
}

// ✅ EXPORT : Indispensable pour que Supertest puisse charger l'application sans la lancer
module.exports = app;