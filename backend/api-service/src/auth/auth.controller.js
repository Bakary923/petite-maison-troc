const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// ============================================================================
// Helper : Hasher un refresh token
// ============================================================================
function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// ============================================================================
// REGISTER
// ============================================================================
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
    const result = await pool.query(
      'INSERT INTO users (username, email, password_hash, role, created_at) VALUES ($1, $2, $3, $4, NOW()) RETURNING id, username, email, role',
      [username, email, hashed, 'user']
    );
    
    const user = result.rows[0];
    
    // ✅ Générer ACCESS TOKEN (15 min)
    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    // ✅ Générer REFRESH TOKEN (7 jours)
    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    // ✅ Stocker le refresh token hashé en base
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await pool.query(
      'INSERT INTO refresh_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
      [tokenHash, user.id, expiresAt]
    );
    
    return res.status(201).json({
      message: 'Inscription réussie !',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('[ERROR REGISTER]', err);
    return res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ============================================================================
// LOGIN
// ============================================================================
exports.login = async (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Champs requis manquants' });
  }
  
  try {
    // Chercher l'utilisateur
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    const user = result.rows[0];
    
    // Vérifier le mot de passe
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
    }
    
    // ✅ Générer ACCESS TOKEN (15 min)
    const accessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    // ✅ Générer REFRESH TOKEN (7 jours)
    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    // ✅ Stocker le refresh token hashé en base
    const tokenHash = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await pool.query(
      'INSERT INTO refresh_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
      [tokenHash, user.id, expiresAt]
    );
    
    res.json({
      message: 'Connexion réussie !',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      accessToken,
      refreshToken
    });
  } catch (err) {
    console.error('[ERROR LOGIN]', err);
    res.status(500).json({ error: 'Erreur serveur.' });
  }
};

// ============================================================================
// REFRESH TOKEN - Renouvelle l'access token
// ============================================================================
exports.refresh = async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token manquant' });
  }
  
  try {
    // Vérifier le refresh token
    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    // Vérifier qu'il existe en base
    const tokenHash = hashRefreshToken(refreshToken);
    const result = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()',
      [tokenHash]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Refresh token invalide ou expiré' });
    }
    
    // Récupérer les infos de l'utilisateur
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [decoded.id]);
    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Utilisateur non trouvé' });
    }
    
    const user = userResult.rows[0];
    
    // ✅ Générer un NOUVEAU access token
    const newAccessToken = jwt.sign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '15m' }
    );
    
    // ✅ Générer un NOUVEAU refresh token (rotation)
    const newRefreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );
    
    // ✅ Supprimer l'ancien refresh token
    await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    
    // ✅ Stocker le nouveau refresh token
    const newTokenHash = hashRefreshToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    
    await pool.query(
      'INSERT INTO refresh_tokens (token_hash, user_id, expires_at) VALUES ($1, $2, $3)',
      [newTokenHash, user.id, expiresAt]
    );
    
    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    });
  } catch (err) {
    console.error('[ERROR REFRESH]', err.message);
    res.status(401).json({ error: 'Refresh token invalide' });
  }
};

// ============================================================================
// LOGOUT - Supprimer le refresh token
// ============================================================================
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(400).json({ error: 'Refresh token manquant' });
  }
  
  try {
    const tokenHash = hashRefreshToken(refreshToken);
    await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [tokenHash]);
    
    res.json({ message: 'Déconnexion réussie' });
  } catch (err) {
    console.error('[ERROR LOGOUT]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};
