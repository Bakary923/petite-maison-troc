/**
 * ROUTES ANNONCES — VERSION FINALE (UPLOAD VIA FRONTEND)
 * Le backend ne reçoit plus de fichier → seulement imagePath
 */

const express = require('express');
const router = express.Router();

const supabase = require('../config/supabase');
const authMiddleware = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');

/* ============================================================================
   VALIDATION DES DONNÉES
============================================================================ */
const validateAnnonce = [
  body('titre')
    .trim()
    .notEmpty().withMessage('Le titre est requis')
    .isLength({ min: 3, max: 100 }).withMessage('Le titre doit faire entre 3 et 100 caractères'),

  body('description')
    .trim()
    .notEmpty().withMessage('La description est requise')
    .isLength({ min: 10 }).withMessage('La description doit faire au moins 10 caractères'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

/* ============================================================================
   HELPER : Génère l’URL publique Supabase
============================================================================ */
const toImageUrl = (path) => {
  if (!path || path === 'default-annonce.jpg') return 'default-annonce.jpg';
  const { data } = supabase.storage.from('ANNONCES-IMAGES').getPublicUrl(path);
  return data.publicUrl;
};

/* ============================================================================
   ROUTES
============================================================================ */

/**
 * GET /api/annonces
 * PUBLIC — Retourne toutes les annonces validées
 */
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;

    const result = await pool.query(
      "SELECT * FROM annonces WHERE status = 'validated' ORDER BY created_at DESC"
    );

    const annonces = result.rows.map(row => ({
      ...row,
      image: toImageUrl(row.image)
    }));

    res.json({ annonces });
  } catch (err) {
    console.error("GET /annonces ERROR:", err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/annonces/me
 * PRIVÉ — Retourne les annonces de l’utilisateur connecté
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const userId = req.user.id;

    const result = await pool.query(
      "SELECT * FROM annonces WHERE user_id = $1 ORDER BY created_at DESC",
      [userId]
    );

    const annonces = result.rows.map(row => ({
      ...row,
      image: toImageUrl(row.image)
    }));

    res.json({ annonces });
  } catch (err) {
    console.error("GET /annonces/me ERROR:", err);
    res.status(500).json({ error: 'Erreur lors de la récupération de vos annonces' });
  }
});

/**
 * POST /api/annonces
 * PRIVÉ — Création d’une annonce
 * ⚠️ IMPORTANT : l’image est déjà uploadée par le frontend → on reçoit imagePath
 */
router.post('/', authMiddleware, validateAnnonce, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { titre, description, imagePath } = req.body;
    const userId = req.user.id;

    const finalImage = imagePath || 'default-annonce.jpg';

    const query = `
      INSERT INTO annonces (titre, description, image, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [
      titre,
      description,
      finalImage,
      userId
    ]);

    res.status(201).json({
      message: 'Annonce créée',
      annonce: {
        ...result.rows[0],
        image: toImageUrl(result.rows[0].image)
      }
    });

  } catch (err) {
    console.error("POST /annonces ERROR:", err);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

/**
 * GET /api/annonces/:id
 * PUBLIC — Détail d’une annonce
 */
router.get('/:id', async (req, res) => {
  try {
    const pool = req.app.locals.pool;

    const result = await pool.query(
      'SELECT * FROM annonces WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    res.json({
      annonce: {
        ...result.rows[0],
        image: toImageUrl(result.rows[0].image)
      }
    });

  } catch (err) {
    console.error("GET /annonces/:id ERROR:", err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/annonces/:id
 * PRIVÉ — Mise à jour d’une annonce
 */
router.put('/:id', authMiddleware, validateAnnonce, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { id } = req.params;
    const { titre, description } = req.body;
    const userId = req.user.id;

    const check = await pool.query(
      'SELECT user_id FROM annonces WHERE id = $1',
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    if (check.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const updateQ = `
      UPDATE annonces
      SET titre = $1, description = $2, status = 'pending', updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `;

    const result = await pool.query(updateQ, [
      titre,
      description,
      id
    ]);

    res.json({
      message: 'Annonce mise à jour avec succès',
      annonce: {
        ...result.rows[0],
        image: toImageUrl(result.rows[0].image)
      }
    });

  } catch (err) {
    console.error("PUT /annonces/:id ERROR:", err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

/**
 * DELETE /api/annonces/:id
 * PRIVÉ — Suppression d’une annonce
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { id } = req.params;
    const userId = req.user.id;

    const check = await pool.query(
      'SELECT user_id, image FROM annonces WHERE id = $1',
      [id]
    );

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    if (check.rows[0].user_id !== userId) {
      return res.status(403).json({ error: 'Non autorisé' });
    }

    const oldImagePath = check.rows[0].image;

    // 👉 Supprimer l’image Supabase si elle existe
    if (oldImagePath && oldImagePath !== 'default-annonce.jpg') {
      await supabase.storage.from('ANNONCES-IMAGES').remove([oldImagePath]);
    }

    await pool.query('DELETE FROM annonces WHERE id = $1', [id]);

    res.json({ message: 'Annonce supprimée avec succès' });

  } catch (err) {
    console.error("DELETE /annonces/:id ERROR:", err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;
