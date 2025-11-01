// On importe Express et on crée un routeur pour les routes d'authentification
const express = require('express');
const router = express.Router();

// On importe les fonctions 'register' (inscription) et 'login' (connexion) depuis le contrôleur d'auth
const { register, login } = require('./auth.controller');

// Route POST /register qui gère l'inscription des utilisateurs
router.post('/register', register);

// Route POST /login qui gère la connexion des utilisateurs
router.post('/login', login);

// On exporte ce routeur pour l'utiliser dans l'application principale (app.js)
module.exports = router;

/*
À quoi sert ce fichier ?
- Il relie les chemins d'URL ('/register', '/login') aux fonctions qui traitent chaque action (inscription/connexion)
- On garde le code organisé : la logique métier reste dans le controller, ici on ne fait que router les requêtes
- Facile d'ajouter plus tard d'autres routes (ex : /logout, /profile, etc)
*/
