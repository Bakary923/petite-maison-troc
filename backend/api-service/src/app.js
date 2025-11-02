// Chargement automatique des variables d'environnement depuis le fichier .env
require('dotenv').config();

// Import d'Express et initialisation de l'app
const express = require('express');
const app = express();

const path = require('path');
const fs = require('fs');

// Ajouter cet import (manquant)
const cors = require('cors');

// Permet à Express d'analyser automatiquement les corps de requêtes JSON (très utile pour toutes les routes POST/PUT)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Créer/servir le dossier uploads (pour les images)
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Autoriser le frontend (remplace l'URL si besoin)
// Pour autoriser toutes les origines utiliser app.use(cors());
app.use(cors({ origin: 'http://localhost:3001' }));

// Import et configuration de la base de données (pool partagé)
const pool = require('./config/database');
app.locals.pool = pool; // On le rend accessible dans les middlewares et routers

// Import des routes d'authentification
const authRoutes = require('./auth/auth.routes');
// Branche les routes /api/auth (ex: /api/auth/register, /api/auth/login)
app.use('/api/auth', authRoutes);

// ⚠️ IMPORTANT : NE PAS appliquer le middleware d'auth à TOUTES les routes /api/annonces
// À la place, les annonces.routes.js gérera lui-même l'authentification
// GET /api/annonces sera PUBLIC
// POST/PUT/DELETE /api/annonces seront PROTÉGÉS

// Import et branchement des routes d'annonces (SANS middleware global)
const annoncesRoutes = require('./annonces/annonces.routes');
app.use('/api/annonces', annoncesRoutes);

// Route d'accueil (optionnelle, pour tester que l'API répond bien sur /)
app.get('/', (req, res) => {
  res.send("Bienvenue sur l'API de la Petite Maison du Troc !");
});

// Démarrage du serveur sur le port défini en variable d'env ou par défaut 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur http://localhost:${PORT}`);
});

/*
Ce fichier est le point d'entrée principal de l'app :
- Chargement .env
- Import middlewares globaux
- Brancher tous les modules de routes (auth, annonces...)
- Initialiser et démarrer Express.

IMPORTANT :
- Les routes /api/auth sont PUBLIQUES
- Les routes /api/annonces gèrent eux-mêmes leur authentification :
  - GET /api/annonces → PUBLIC (accessible sans JWT)
  - POST/PUT/DELETE /api/annonces → PROTÉGÉ (nécessite JWT)
*/
