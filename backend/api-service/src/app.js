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

// créer/servir le dossier uploads (pour les images)
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

// Import du middleware d'authentification
const authMiddleware = require('./middlewares/auth');

// Import et branchement des routes d'annonces AVEC protection par JWT
const annoncesRoutes = require('./annonces/annonces.routes');
app.use('/api/annonces', authMiddleware, annoncesRoutes);

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
*/
