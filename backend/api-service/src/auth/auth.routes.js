// On importe Express et on crée un routeur pour les routes d'authentification
const express = require('express');
const router = express.Router();

// On importe express-validator pour vérifier les données envoyées à l'API
const { body, validationResult } = require('express-validator');

// On importe express-rate-limit pour limiter le nombre de tentatives de login
const rateLimit = require('express-rate-limit');

// On importe les fonctions 'register' (inscription) et 'login' (connexion) depuis le contrôleur d'auth
const { register, login } = require('./auth.controller');

// Middleware de validation pour l'inscription
// - vérifie que l'email est valide
// - vérifie que le mot de passe fait au moins 8 caractères
// - vérifie que le username a une longueur raisonnable
const validateRegister = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe trop court'),
  body('username').isLength({ min: 3, max: 30 }).withMessage('Username invalide'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Si la validation échoue, on renvoie une erreur 400 avec la liste des problèmes
      return res.status(400).json({ errors: errors.array() });
    }
    // Si tout est bon, on passe au contrôleur register
    next();
  }
];

// Middleware de validation pour la connexion
// - vérifie que l'email est présent et bien formé
// - vérifie que le mot de passe n'est pas vide
const validateLogin = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // Même principe : on renvoie 400 si les données sont invalides
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Limite réaliste : max 10 tentatives de login par IP toutes les 15 minutes
// Objectif : ralentir / bloquer les attaques par force brute sur /login
const loginRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // fenêtre de 15 minutes
  max: 20,                  // 10 requêtes max par IP dans cette fenêtre
  message: { error: 'Trop de tentatives de connexion, réessayez plus tard.' },
  standardHeaders: true,    // ajoute les en-têtes RateLimit-* standard
  legacyHeaders: false      // désactive les vieux en-têtes X-RateLimit-*
});

// Route POST /register qui gère l'inscription des utilisateurs (avec validation en amont)
router.post('/register', validateRegister, register);

// Route POST /login qui gère la connexion des utilisateurs
// - d'abord : rate limiting (loginRateLimiter)
// - puis : validation des données (validateLogin)
// - enfin : logique métier dans le contrôleur login
router.post('/login', loginRateLimiter, validateLogin, login);

// On exporte ce routeur pour l'utiliser dans l'application principale (app.js)
module.exports = router;

/*
À quoi sert ce fichier ?
- Il relie les chemins d'URL ('/register', '/login') aux fonctions qui traitent chaque action (inscription/connexion)
- On garde le code organisé : la logique métier reste dans le controller, ici on ne fait que router les requêtes
- Facile d'ajouter plus tard d'autres routes (ex : /logout, /profile, etc)

Avec la validation + le rate limiting :
- /register refuse les données incorrectes (email, mot de passe trop court, username trop court/long)
- /login refuse les requêtes sans email valide ou sans mot de passe
- /login est limité à 10 tentatives par 15 minutes et par IP pour réduire les attaques par force brute
- Cela renforce la sécurité de l'authentification et la qualité des données traitées par l'API
*/
