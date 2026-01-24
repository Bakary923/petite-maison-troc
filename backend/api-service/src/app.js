// Chargement automatique des variables d'environnement depuis le fichier .env
require('dotenv').config();

// Import d'Express et initialisation de l'app
const express = require('express');
const app = express();

const path = require('path');
const fs = require('fs');

// Import des middlewares de sécurité et CORS
const helmet = require('helmet');
const cors = require('cors');

// Middleware global Helmet : ajoute plusieurs en-têtes HTTP de sécurité (XSS, clickjacking, etc.)
app.use(helmet({
  contentSecurityPolicy: false,        // CSP désactivée en développement
  crossOriginResourcePolicy: false,    // Désactive la politique stricte des ressources cross-origin
  crossOriginEmbedderPolicy: false     // Désactive l'isolation stricte des ressources
}));

// Permet à Express d'analyser automatiquement les corps de requêtes JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Créer/servir le dossier uploads (pour les images)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Autoriser le frontend (remplace l'URL si besoin)
app.use(cors({ origin: 'http://localhost:3001' }));

// Import et configuration de la base de données (pool partagé)
const pool = require('./config/database');
app.locals.pool = pool; // On le rend accessible dans les middlewares et routers

// ============================================
// ROUTES D'AUTHENTIFICATION
// ============================================
// ✅ CHEMIN CORRIGÉ : on est dans ./src/, donc on cherche dans ./auth/ (pas ./routes/auth/)
const authRoutes = require('./auth/auth.routes');
// Branche les routes /api/auth (ex: /api/auth/register, /api/auth/login, /api/auth/refresh, /api/auth/logout)
app.use('/api/auth', authRoutes);

// ============================================
// ROUTES ANNONCES
// ============================================
// ✅ CHEMIN CORRIGÉ : cherche dans ./annonces/
// GET /api/annonces → PUBLIC (accessible sans JWT)
// POST/PUT/DELETE /api/annonces → PROTÉGÉ (nécessite JWT)
const annoncesRoutes = require('./annonces/annonces.routes');
app.use('/api/annonces', annoncesRoutes);

// ============================================
// ROUTES ADMIN
// ============================================
// ✅ CHEMIN CORRIGÉ : cherche dans ./admin/
// Toutes les routes /api/admin sont PROTÉGÉES (authMiddleware + adminMiddleware)
const adminRoutes = require('./admin/admin.routes');
app.use('/api/admin', adminRoutes);

// ============================================
// ROUTE D'ACCUEIL
// ============================================
app.get('/', (req, res) => {
  res.send("Bienvenue sur l'API de la Petite Maison du Troc !");
});

// ============================================
// DÉMARRAGE DU SERVEUR
// ============================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Serveur backend démarré sur http://localhost:${PORT}`);
  console.log(`✅ Base de données connectée`);
});

/*
Ce fichier est le point d'entrée principal de l'app :
- Chargement .env (variables JWT_SECRET, JWT_REFRESH_SECRET, etc.)
- Import middlewares globaux (sécurité Helmet, parsing JSON, CORS, fichiers statiques...)
- Branchement de tous les modules de routes :
  * /api/auth → routes d'authentification (register, login, refresh, logout)
  * /api/annonces → routes des annonces (GET public, POST/PUT/DELETE protégés)
  * /api/admin → routes d'administration (toutes protégées)
- Initialisation et démarrage du serveur Express

FLUX COMPLET D'AUTHENTIFICATION :
1. POST /api/auth/register → crée user + génère accessToken (15m) + refreshToken (7j)
2. POST /api/auth/login → vérifie credentials + génère accessToken (15m) + refreshToken (7j)
3. POST /api/auth/refresh → utilise refreshToken pour générer nouveau accessToken
4. POST /api/auth/logout → supprime le refreshToken côté serveur
5. Les autres routes utilisent accessToken pour vérifier l'authentification
*/
