// On importe bcrypt pour hasher et vérifier les mots de passe
const bcrypt = require('bcryptjs');
// On importe le pool partagé pour accéder à la base PostgreSQL
const pool = require('../config/database');

/*
  Fonction d'inscription (register) :
  - Récupère le nom, email, mot de passe envoyé dans la requête
  - Vérifie que tous les champs sont présents
  - Vérifie que l'email n'est pas déjà pris
  - Hache le mot de passe
  - Enregistre l'utilisateur en base
  - Gère les erreurs (champs manquants, email déjà pris, erreur serveur)
*/
exports.register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  try {
    // Vérifier si l'utilisateur existe déjà
    const existe = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'Cet email existe déjà.' });
    }
    // Hachage du mot de passe
    const hashed = await bcrypt.hash(password, 10);
    // Insertion de l'utilisateur en base
    await pool.query(
      'INSERT INTO users (username, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [username, email, hashed, 'user']
    );
    return res.status(201).json({ message: 'Inscription réussie !' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};

/*
  Fonction de connexion (login) :
  - Récupère l'email et le mot de passe depuis la requête
  - Vérifie la présence des champs
  - Récupère l'utilisateur par son email
  - Compare le mot de passe envoyé avec le hash en base
  - Si OK, retourne les infos de l'utilisateur (sans son mot de passe)
  - En cas d'échec, renvoie une erreur adaptée
*/
exports.login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  try {
    // Recherche de l'utilisateur par email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    const user = result.rows[0];
    // Comparaison entre le hash stocké et le mot de passe fourni
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    // Succès : renvoie les infos utiles (jamais le hash !)
    res.json({
      message: 'Connexion réussie !',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

/*
Ce contrôleur regroupe :
- La logique métier pour l'inscription et la connexion utilisateur
- La gestion des erreurs pour des réponses claires côté front
- Une séparation parfaite avec le fichier de routing pour garder un code maintenable et lisible
*/
