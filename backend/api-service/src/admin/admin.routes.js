const express = require('express');
const router = express.Router();
const adminMiddleware = require('../middlewares/adminMiddleware');
const authMiddleware = require('../middlewares/auth');

// ============================================
// Helper : construire URL complète d'image
// ============================================
function toImageUrl(req, imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${req.protocol}://${req.get('host')}${imagePath}`;
}

// ============================================
// 📋 ROUTES ANNONCES
// ============================================

// Récupérer TOUTES les annonces
router.get('/annonces', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(500).json({ message: 'Base de données non disponible' });
    }

    const query = `
      SELECT a.id, a.titre, a.description, a.image, a.status, a.created_at, a.updated_at, u.username
      FROM annonces a
      LEFT JOIN users u ON a.user_id = u.id
      ORDER BY a.created_at DESC
    `;
    const result = await pool.query(query);
    
    // AJOUT : Construire les URLs d'images
    const annonces = result.rows.map(r => ({
      ...r,
      image: toImageUrl(req, r.image)
    }));
    
    res.json(annonces);
  } catch (err) {
    console.error('GET /admin/annonces error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Récupérer les annonces EN ATTENTE
router.get('/annonces/pending', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(500).json({ message: 'Base de données non disponible' });
    }

    const query = `
      SELECT a.id, a.titre, a.description, a.image, a.status, a.created_at, a.updated_at, u.username, u.id as user_id
      FROM annonces a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.status = 'pending'
      ORDER BY a.created_at DESC
    `;
    const result = await pool.query(query);
    
    // ✨ AJOUT : Construire les URLs d'images
    const annonces = result.rows.map(r => ({
      ...r,
      image: toImageUrl(req, r.image)
    }));
    
    res.json(annonces);
  } catch (err) {
    console.error('GET /admin/annonces/pending error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Récupérer les annonces VALIDÉES
router.get('/annonces/validated', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(500).json({ message: 'Base de données non disponible' });
    }

    const query = `
      SELECT a.id, a.titre, a.description, a.image, a.status, a.created_at, a.updated_at, u.username
      FROM annonces a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.status = 'validated'
      ORDER BY a.created_at DESC
    `;
    const result = await pool.query(query);
    
    // ✨ AJOUT : Construire les URLs d'images
    const annonces = result.rows.map(r => ({
      ...r,
      image: toImageUrl(req, r.image)
    }));
    
    res.json(annonces);
  } catch (err) {
    console.error('GET /admin/annonces/validated error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Récupérer les annonces REJETÉES
router.get('/annonces/rejected', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(500).json({ message: 'Base de données non disponible' });
    }

    const query = `
      SELECT a.id, a.titre, a.description, a.image, a.status, a.created_at, a.updated_at, u.username, a.rejection_reason
      FROM annonces a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.status = 'rejected'
      ORDER BY a.created_at DESC
    `;
    const result = await pool.query(query);
    
    // ✨ AJOUT : Construire les URLs d'images
    const annonces = result.rows.map(r => ({
      ...r,
      image: toImageUrl(req, r.image)
    }));
    
    res.json(annonces);
  } catch (err) {
    console.error('GET /admin/annonces/rejected error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Valider une annonce
router.put('/annonces/:id/validate', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(500).json({ message: 'Base de données non disponible' });
    }

    const annonceId = req.params.id;
    const adminId = req.user?.id;

    const query = `
      UPDATE annonces 
      SET status = 'validated', validated_by = $1, validated_at = NOW() AT TIME ZONE 'Europe/Paris'
      WHERE id = $2
      RETURNING id, titre, description, image, status, created_at, updated_at
    `;
    
    const result = await pool.query(query, [adminId, annonceId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    // ✨ AJOUT : Construire l'URL d'image
    const annonce = {
      ...result.rows[0],
      image: toImageUrl(req, result.rows[0].image)
    };

    res.json({ message: 'Annonce validée ✅', annonce });
  } catch (err) {
    console.error('PUT /admin/annonces/:id/validate error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Rejeter une annonce
router.put('/annonces/:id/reject', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(500).json({ message: 'Base de données non disponible' });
    }

    const annonceId = req.params.id;
    const adminId = req.user?.id;
    const { reason } = req.body;

    const query = `
      UPDATE annonces 
      SET status = 'rejected', rejected_by = $1, rejected_at = NOW() AT TIME ZONE 'Europe/Paris', rejection_reason = $2
      WHERE id = $3
      RETURNING id, titre, description, image, status, rejection_reason, created_at, updated_at
    `;
    
    const result = await pool.query(query, [adminId, reason, annonceId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    // ✨ AJOUT : Construire l'URL d'image
    const annonce = {
      ...result.rows[0],
      image: toImageUrl(req, result.rows[0].image)
    };

    res.json({ message: 'Annonce rejetée ❌', annonce });
  } catch (err) {
    console.error('PUT /admin/annonces/:id/reject error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Supprimer une annonce
router.delete('/annonces/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(500).json({ message: 'Base de données non disponible' });
    }

    const annonceId = req.params.id;

    const query = 'DELETE FROM annonces WHERE id = $1 RETURNING id, titre';
    const result = await pool.query(query, [annonceId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Annonce non trouvée' });
    }

    res.json({ message: 'Annonce supprimée 🗑️', annonce: result.rows[0] });
  } catch (err) {
    console.error('DELETE /admin/annonces/:id error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ============================================
// 👥 ROUTES UTILISATEURS
// ============================================

// Récupérer tous les utilisateurs
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(500).json({ message: 'Base de données non disponible' });
    }

    const query = 'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC';
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (err) {
    console.error('GET /admin/users error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Supprimer un utilisateur
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    if (!pool) {
      return res.status(500).json({ message: 'Base de données non disponible' });
    }

    const userId = req.params.id;

    // Supprimer aussi ses annonces
    const deleteAnnoncesQ = 'DELETE FROM annonces WHERE user_id = $1';
    await pool.query(deleteAnnoncesQ, [userId]);

    // Supprimer l'utilisateur
    const deleteUserQ = 'DELETE FROM users WHERE id = $1 RETURNING id, username';
    const result = await pool.query(deleteUserQ, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({ message: 'Utilisateur supprimé 🗑️', user: result.rows[0] });
  } catch (err) {
    console.error('DELETE /admin/users/:id error:', err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
