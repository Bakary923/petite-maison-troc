/**
 * ROUTES ANNONCES — VERSION FINALE
 * Compatible Jest / Supabase / Architecture Stateless
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import du client Supabase et du middleware d'authentification
const supabase = require('../config/supabase');
const authMiddleware = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');

/* ============================================================================
   VALIDATION DES DONNÉES (ISO 25010)
   Les tests Jest attendent des messages précis → .withMessage() obligatoire
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
   CONFIGURATION MULTER (STATLESS / HPA)
============================================================================ */
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 Mo max
});

/* ============================================================================
   HELPER : Génère l’URL publique Supabase
============================================================================ */
const toImageUrl = (path) => {
  if (!path || path === 'default-annonce.jpg') return 'default-annonce.jpg';
  const { data } = supabase.storage.from('ANNONCES-IMAGES').getPublicUrl(path);
  return data.publicUrl;
};

/* ============================================================================
   ROUTES (ORDRE CRITIQUE)
============================================================================ */

/**
 * GET /api/annonces
 * PUBLIC — Retourne toutes les annonces validées
 * ✔ Renvoie { annonces: [...] } (attendu par Jest)
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
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * GET /api/annonces/me
 * PRIVÉ — Retourne les annonces de l’utilisateur connecté
 * ✔ Doit être AVANT /:id
 * ✔ Renvoie { annonces: [...] }
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
    res.status(500).json({ error: 'Erreur lors de la récupération de vos annonces' });
  }
});

/**
 * POST /api/annonces
 * PRIVÉ — Création d’une annonce
 * ✔ Compatible Supabase
 * ✔ Compatible Jest
 */
router.post('/', authMiddleware, upload.single('image'), validateAnnonce, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { titre, description } = req.body;
    const userId = req.user.id;

    let imagePath = 'default-annonce.jpg';

    // Upload Supabase si image fournie
    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;

      const { data, error } = await supabase.storage
        .from('ANNONCES-IMAGES')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      // 🔥 LOG D'ERREUR SUPABASE (DEBUG)
      if (error) {
        console.error("SUPABASE UPLOAD ERROR:", error);
        throw error;
      }

      imagePath = data.path;
    }

    const query = `
      INSERT INTO annonces (titre, description, image, user_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await pool.query(query, [titre, description, imagePath, userId]);

    res.status(201).json({
      message: 'Annonce créée',
      annonce: { ...result.rows[0], image: toImageUrl(result.rows[0].image) }
    });
  } catch (err) {
    console.error("ERREUR BACKEND /api/annonces :", err);
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
    const result = await pool.query('SELECT * FROM annonces WHERE id = $1', [req.params.id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    res.json({
      annonce: { ...result.rows[0], image: toImageUrl(result.rows[0].image) }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/**
 * PUT /api/annonces/:id
 * PRIVÉ — Mise à jour d’une annonce
 * ✔ Compatible Jest
 */
router.put('/:id', authMiddleware, validateAnnonce, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { id } = req.params;
    const { titre, description } = req.body;
    const userId = req.user.id;

    const check = await pool.query('SELECT user_id FROM annonces WHERE id = $1', [id]);

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

    const result = await pool.query(updateQ, [titre, description, id]);

    res.json({
      message: 'Annonce mise à jour avec succès',
      annonce: { ...result.rows[0], image: toImageUrl(result.rows[0].image) }
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

/**
 * DELETE /api/annonces/:id
 * PRIVÉ — Suppression d’une annonce
 * ✔ Compatible Jest
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
    if (oldImagePath && oldImagePath !== 'default-annonce.jpg') {
      await supabase.storage.from('ANNONCES-IMAGES').remove([oldImagePath]);
    }

    await pool.query('DELETE FROM annonces WHERE id = $1', [id]);

    res.json({ message: 'Annonce supprimée avec succès' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;
