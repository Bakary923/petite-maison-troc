// On importe bcrypt pour le hash des mots de passe
const bcrypt = require('bcryptjs');
// On importe jsonwebtoken pour créer et signer le token JWT
const jwt = require('jsonwebtoken');
// On récupère la clé secrète utilisée pour le JWT (penser à la mettre dans votre .env)
const JWT_SECRET = process.env.JWT_SECRET;
// On importe le pool PostgreSQL pour faire les requêtes SQL
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
  - Récupère l'email et le mot de passe envoyés dans la requête HTTP POST
  - Vérifie que les champs email et password sont bien renseignés
  - Cherche en base l'utilisateur correspondant à cet email
  - Si l'utilisateur existe, vérifie que le mot de passe fourni correspond à celui enregistré (en comparant avec le hash stocké)
  - Si l'identifiant et le mot de passe sont validés :
      - Génère un token JWT sécurisé contenant les infos principales de l'utilisateur (id, username, email, role), valide 24h
      - Retourne au frontend :
          - Un message de succès,
          - Les infos utilisateur (toujours jamais le hash du mot de passe)
          - Le token JWT à utiliser dans les prochaines requêtes authentifiées
  - En cas d'échec (mauvais email ou mauvais mot de passe), renvoie une erreur explicite (sans indiquer si c'est l'email ou le mot de passe)
  - En cas d'erreur serveur (bug, souci base...), renvoie une erreur 500 générique
*/
exports.login = async (req, res) => {
  // On extrait l'email et le mot de passe envoyés dans la requête
  const { email, password } = req.body;

  // Vérifie la présence de tous les champs
  if (!email || !password) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }

  try {
    // On va chercher l'utilisateur correspondant à l'email dans la base
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    // S'il n'existe aucun utilisateur avec cet email, on renvoie une erreur 401
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // On récupère le premier (et unique) utilisateur trouvé
    const user = result.rows[0];

    // On compare le mot de passe donné avec le hash stocké en base
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      // Si le mot de passe ne correspond pas, on renvoie une erreur 401
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }

    // Si l'identifiant et le mot de passe sont ok, on génère un token JWT :
    // - On encode dedans l'id, le username, l'email et le rôle
    // - On signe le token avec la clé secrète (JWT_SECRET), valable 24h
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // On renvoie la confirmation au frontend, les infos essentielles (jamais le hash) et le token JWT à utiliser ensuite
    res.json({
      message: 'Connexion réussie !',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token: token
    });

  } catch (err) {
    // En cas d'erreur interne (base down, bug JS...), on renvoie une erreur 500 générique
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

/*
Ce contrôleur :
- Récupère et vérifie les infos d'identification transmises par l'utilisateur
- Protège les accès via le mot de passe hashé et vérifié avec bcrypt
- Génère un token JWT sécurisé en cas de succès (clé secrète JWT_SECRET dans le .env)
- Renvoie toutes les infos utiles à l'utilisateur sans jamais exposer le mot de passe hashé
- Gère les erreurs de façon claire pour front et debug
*/