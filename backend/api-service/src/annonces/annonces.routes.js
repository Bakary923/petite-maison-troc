const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');

/* -----------------------------------------------------------
   VALIDATION EXPRESS-VALIDATOR
----------------------------------------------------------- */
const validateAnnonce = [
  body('titre')
    .trim()
    .notEmpty().withMessage('Le titre est requis')
    .isLength({ min: 3, max: 100 }).withMessage('Le titre doit faire entre 3 et 100 caractères'),

  body('description')
    .trim()
    .isLength({ min: 10, max: 500 }).withMessage('La description doit faire entre 10 et 500 caractères'),

  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

/* -----------------------------------------------------------
   GET /api/annonces  (public)
----------------------------------------------------------- */
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      "SELECT * FROM annonces WHERE status = 'validated' ORDER BY created_at DESC"
    );

    // 🔥 Cloudinary : l’URL est déjà complète
    res.json({ annonces: result.rows });

  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/* -----------------------------------------------------------
   GET /api/annonces/me  (privé)
----------------------------------------------------------- */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query(
      "SELECT * FROM annonces WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id]
    );

    res.json({ annonces: result.rows });

  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

/* -----------------------------------------------------------
   POST /api/annonces  (privé)
----------------------------------------------------------- */
router.post('/', authMiddleware, validateAnnonce, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { titre, description, image } = req.body;

    // 🔥 Cloudinary : l’image est déjà une URL complète
    const imageUrl = image || 'default-annonce.jpg';

    const query = `
      INSERT INTO annonces (titre, description, image, user_id, status)
      VALUES ($1, $2, $3, $4, 'validated')
      RETURNING *
    `;

    const result = await pool.query(query, [
      titre,
      description,
      imageUrl,
      req.user.id
    ]);

    res.status(201).json({
      message: 'Annonce créée',
      annonce: result.rows[0]
    });

  } catch (err) {
    console.error("[POST ERROR]", err);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

/* -----------------------------------------------------------
   PUT /api/annonces/:id  (privé)
----------------------------------------------------------- */
router.put('/:id', authMiddleware, validateAnnonce, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { id } = req.params;
    const { titre, description, image } = req.body;

    const check = await pool.query('SELECT * FROM annonces WHERE id = $1', [id]);
    if (check.rows.length === 0)
      return res.status(404).json({ error: 'Non trouvée' });

    await pool.query(
      'UPDATE annonces SET titre=$1, description=$2, image=$3 WHERE id=$4',
      [titre, description, image || check.rows[0].image, id]
    );

    res.json({ message: 'Mise à jour OK' });

  } catch (err) {
    res.status(500).json({ error: 'Erreur mise à jour' });
  }
});

/* -----------------------------------------------------------
   DELETE /api/annonces/:id  (privé)
----------------------------------------------------------- */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { id } = req.params;

    const check = await pool.query(
      'SELECT user_id FROM annonces WHERE id = $1',
      [id]
    );

    if (check.rows.length === 0)
      return res.status(404).json({ error: 'Non trouvée' });

    if (check.rows[0].user_id !== req.user.id)
      return res.status(403).json({ error: 'Interdit' });

    // 🔥 Cloudinary : on ne supprime rien côté backend
    // (tu peux ajouter une API Cloudinary plus tard si tu veux)

    await pool.query('DELETE FROM annonces WHERE id = $1', [id]);

    res.json({ message: 'Supprimée avec succès' });

  } catch (err) {
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

module.exports = router;
