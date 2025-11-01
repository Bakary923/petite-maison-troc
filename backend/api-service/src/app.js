// Permet de charger les variables d'environnement définies dans .env
require('dotenv').config();

// On importe le module Express
const express = require('express');
const app = express();

// Permet à Express de lire automatiquement les requêtes JSON (important pour POST/PUT)
app.use(express.json());

// On importe les routes d'authentification
const authRoutes = require('./auth/auth.routes');
// On "branche" les routes d'authentification sous /api/auth (par ex. /api/auth/register)
app.use('/api/auth', authRoutes);

// (Plus tard, tu ajouteras les routes des annonces ici)
// const annoncesRoutes = require('./annonces/annonces.routes');
// app.use('/api/annonces', annoncesRoutes);

// Définir une route d'accueil simple (optionnel, pour test rapide)
app.get('/', (req, res) => {
  res.send('Bienvenue sur l\'API de la Petite Maison du Troc !');
});

// On démarre le serveur sur le port 3000
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur http://localhost:${PORT}`);
});



// C'est le point d'entrée du serveur Express : c'est ici que tu initialises Express, ajoutes les middlewares (comme express.json()), enregistres tes routes, et démarres ton application.
// C'est une pratique standard en Node.js/Express : tout projet pro ou cours commence par un fichier principal (app.js ou server.js) qui configure l'app.​
// Tes routes (auth, annonces...) doivent être "branchées" sur ce fichier : tu y "imports" tous les routers (modules) que tu crées.