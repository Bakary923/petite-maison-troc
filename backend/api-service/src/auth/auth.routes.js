// On importe Express et on crée un routeur pour les routes d'authentification
const express = require('express');
const router = express.Router();

// On importe express-validator pour vérifier les données envoyées à l'API
const { body, validationResult } = require('express-validator');

// On importe express-rate-limit pour limiter le nombre de tentatives de login
const rateLimit = require('express-rate-limit');

// On importe les fonctions du contrôleur d'auth
const { register, login, refresh, logout } = require('./auth.controller');

// ============================================================================
// Middlewares de validation
// ============================================================================

const validateRegister = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 8 }).withMessage('Mot de passe trop court (min 8 caractères)'),
  body('username').isLength({ min: 3, max: 30 }).withMessage('Username invalide (3-30 caractères)'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

const validateLogin = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').notEmpty().withMessage('Mot de passe requis'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// ============================================================================
// Rate Limiter pour éviter les attaques par force brute
// ============================================================================

const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // fenêtre de 15 minutes
  max: 20,                  // 20 requêtes max par IP
  message: { error: 'Trop de tentatives de connexion, réessayez plus tard.' },
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================================================
// ROUTES D'AUTHENTIFICATION
// ============================================================================

// POST /api/auth/register - Inscription
router.post('/register', validateRegister, register);

// POST /api/auth/login - Connexion
router.post('/login', loginRateLimiter, validateLogin, login);

// POST /api/auth/refresh - Renouveler l'access token
router.post('/refresh', refresh);

// POST /api/auth/logout - Déconnexion
router.post('/logout', logout);

// On exporte ce routeur
module.exports = router;

/*
À quoi sert ce fichier ?
- Il relie les chemins d'URL aux fonctions qui traitent chaque action
- Validation des données en amont (email, mot de passe, username)
- Rate limiting sur /login pour éviter les attaques par force brute
- 4 routes :
  * /register : créer un compte (génère access + refresh token)
  * /login : se connecter (génère access + refresh token)
  * /refresh : renouveler l'access token avec le refresh token
  * /logout : supprimer le refresh token côté serveur

FLUX COMPLET :
1. User se register/login → reçoit accessToken (15m) + refreshToken (7j)
2. User utilise accessToken pour les appels API
3. Quand accessToken expire → appelle /refresh avec refreshToken
4. Serveur vérifie le refreshToken, génère un nouveau accessToken
5. User se logout → refreshToken supprimé de la base
*/
