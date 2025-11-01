// Point d’entrée Express qui relie les endpoints aux fonctions métier

// On importe Express et on crée un sous-routeur
const express = require('express');
const router = express.Router();
// On importe la fonction 'register' depuis le contrôleur ci-dessus
const { register } = require('./auth.controller');

// On crée la route POST /register qui va appeler la fonction register
router.post('/register', register);

// Exporte ce router pour qu'il soit utilisé dans l'application principale
module.exports = router;


// À quoi sert ce fichier ?

// Il définit les liens entre chaque URL (endpoint) et la fonction à appeler

// Ici, une seule route pour l'inscription : /api/auth/register, méthode POST

// On pourra ajouter facilement la connexion plus tard (POST /login) dans ce même router

// Ce système te permet d'avoir un code propre (séparation routes/logique métier)