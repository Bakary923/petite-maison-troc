const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');

/* -----------------------------------------------------------
   HELPER : URL Publique avec correction du "/"
   ⚠️ Utilise 'ANNONCES-IMAGES' en MAJUSCULES
----------------------------------------------------------- */
const toImageUrl = (path) => {
  if (!path || path === 'default-annonce.jpg') return '/default-annonce.jpg';
  const { data } = supabase.storage.from('ANNONCES-IMAGES').getPublicUrl(path);
  return data.publicUrl;
};

// Validation compatible Jest
const validateAnnonce = [
  body('titre').trim().notEmpty().withMessage('Le titre est requis').isLength({ min: 3 }),
  body('description').trim().isLength({ min: 10 }).withMessage('La description doit faire au moins 10 caractères'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

// GET ALL
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query("SELECT * FROM annonces WHERE status = 'validated' ORDER BY created_at DESC");
    const annonces = result.rows.map(row => ({ ...row, image: toImageUrl(row.image) }));
    res.json({ annonces });
  } catch (err) { res.status(500).json({ error: 'Erreur serveur' }); }
});

// POST (STATLESS)
router.post('/', authMiddleware, validateAnnonce, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { titre, description, image } = req.body;
    
    const imagePath = image || 'default-annonce.jpg';

    const query = `
      INSERT INTO annonces (titre, description, image, user_id, status)
      VALUES ($1, $2, $3, $4, 'validated')
      RETURNING *
    `;
    const result = await pool.query(query, [titre, description, imagePath, req.user.id]);

    res.status(201).json({
      message: 'Annonce créée',
      annonce: { ...result.rows[0], image: toImageUrl(result.rows[0].image) }
    });
  } catch (err) {
    console.error("[POST ERROR]", err);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

// DELETE
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { id } = req.params;
    const check = await pool.query('SELECT user_id, image FROM annonces WHERE id = $1', [id]);

    if (check.rows.length === 0) return res.status(404).json({ error: 'Non trouvée' });
    if (check.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Interdit' });

    // Nettoyage Cloud (MAJUSCULES)
    if (check.rows[0].image && check.rows[0].image !== 'default-annonce.jpg') {
      await supabase.storage.from('ANNONCES-IMAGES').remove([check.rows[0].image]);
    }

    await pool.query('DELETE FROM annonces WHERE id = $1', [id]);
    res.json({ message: 'Supprimée avec succès' });
  } catch (err) { res.status(500).json({ error: 'Erreur suppression' }); }
});

module.exports = router;