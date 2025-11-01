// Pour que seules les personnes connectées (avec token valide) puissent accéder à certaines routes (ex : création d'annonce)

// Middleware d'authentification par token JWT
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {
  // Récupère le token dans l’en-tête Authorization : Bearer <token> ("Bearer xxx")
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide' });
  }

  const token = authHeader.split(' ')[1];
  try {
    // Vérifie la validité du token et extrait les données utilisateur
    const decoded = jwt.verify(token, JWT_SECRET);
    // Ajoute les infos du user à req pour les routes suivantes
    req.user = decoded; // Injection du user dans la requête pour les routes suivantes
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};
