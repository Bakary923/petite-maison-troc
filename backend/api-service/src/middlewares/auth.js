// Middleware pour protéger les routes : seules les personnes ayant un token JWT valide ont accès
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET;

module.exports = (req, res, next) => {

  // Vérifie la présence d'un header Authorization
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token manquant ou invalide' });
  }

  // Récupère le token après 'Bearer '
  const token = authHeader.split(' ')[1];
  try {
    // Vérifie et décode le token JWT
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    // Ajoute les informations de l'utilisateur à la requête pour les prochaines middlewares/routes
    req.user = decoded;
    next(); // Passe la main à la route suivante
  } catch (err) {
    // Si le token est invalide ou expiré
    console.error("Erreur JWT:", err);
    return res.status(401).json({ error: 'Token invalide ou expiré' });
  }
};