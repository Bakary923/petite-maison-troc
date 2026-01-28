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
// On autorise l'URL du frontend définie via les variables d'environnement du cluster.
// Cela permet de changer de port ou de domaine sans modifier le code source.
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:3001';

app.use(cors({ 
  origin: allowedOrigin,
  credentials: true // Indispensable pour la gestion sécurisée des cookies/sessions
}));

// Log de démarrage pour faciliter le débogage dans les journaux Kubernetes (kubectl logs)
console.log(`🛡️  CORS : Origine autorisée configurée sur -> ${allowedOrigin}`);

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

app.use('/api/auth', authRoutes);     // Gestion identités (Register/Login/Refresh)
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

app.listen(PORT, () => {
  console.log(`🚀 Serveur backend démarré sur le port : ${PORT}`);
  console.log(`🗄️  Base de données ciblée : ${process.env.DB_HOST || 'localhost'}`);
  console.log(`📊 Système d'observabilité activé`);
});