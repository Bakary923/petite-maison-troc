// logique d’inscription (traiter la requête, vérifier doublons, hacher le mot de passe, enregistrer en base)

// On importe bcrypt pour le hash du mot de passe
const bcrypt = require('bcryptjs');
// On importe le pool partagé
const pool = require('../config/database'); // Chemin relatif depuis 'auth/' jusqu'à 'config/database.js'

// Fonction appelée lors d'une requête POST /register
exports.register = async (req, res) => {
  const { username, email, password } = req.body; // Récupération des champs du formulaire
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  try {
    // Vérifier si un utilisateur existe déjà avec cet email
    const existe = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existe.rows.length > 0) {
      return res.status(409).json({ error: 'Cet email existe déjà.' });
    }
    // Hacher le mot de passe de façon sécurisée (10 tours de "salage")
    const hashed = await bcrypt.hash(password, 10); // 10 tours est la norme[7][5][6]
    // Insérer le nouvel utilisateur dans la base
    await pool.query(
      'INSERT INTO users (username, email, password_hash, role, created_at) VALUES ($1,$2,$3,$4,NOW())',
      [username, email, hashed, 'user']
    );
    return res.status(201).json({ message: 'Inscription réussie !' });
  } catch (err) {
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};



//Ce que fait ce code étape par étape :

// Vérifie qu'il y a tous les champs nécessaires (username, email, password)

// Cherche en base si l'utilisateur existe déjà

// Si oui, répond avec un message d'erreur

// Sinon, hash le mot de passe puis crée l'utilisateur en base

// Répond à l'utilisateur que l'inscription a réussi

// Attrape et gère proprement les erreurs éventuelles