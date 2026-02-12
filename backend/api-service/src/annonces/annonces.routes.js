const express = require('express');
const router = express.Router();
const multer = require('multer');

// Import du client Supabase et du middleware d'authentification
const supabase = require('../config/supabase');
const authMiddleware = require('../middlewares/auth');
const { body, validationResult } = require('express-validator');

// --- VALIDATION ---
const validateAnnonce = [
  body('titre').trim().notEmpty().isLength({ min: 3, max: 100 }),
  body('description').trim().notEmpty().isLength({ min: 10, max: 2000 }),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    next();
  }
];

// --- MULTER (Stateless) ---
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Helper URL Supabase
const toImageUrl = (path) => {
  if (!path || path === 'default-annonce.jpg') return 'default-annonce.jpg';
  const { data } = supabase.storage.from('annonces-images').getPublicUrl(path);
  return data.publicUrl;
};

// ============================================================================
// ROUTES (L'ordre est CRITIQUE ici pour éviter les 404 dans Jest)
// ============================================================================

// 1. GET /api/annonces (Liste publique)
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query("SELECT * FROM annonces WHERE status = 'validated' ORDER BY created_at DESC");
    const annonces = result.rows.map(row => ({ ...row, image: toImageUrl(row.image) }));
    res.json({ annonces }); // Note : renvoie un objet { annonces: [] } pour Jest
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 2. ✅ ROUTE /me (DOIT ÊTRE AVANT /:id)
// C'est cette route qui manquait et causait l'échec de tes tests
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const userId = req.user.id;
    const result = await pool.query("SELECT * FROM annonces WHERE user_id = $1 ORDER BY created_at DESC", [userId]);
    const annonces = result.rows.map(row => ({ ...row, image: toImageUrl(row.image) }));
    res.json({ annonces });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la récupération de vos annonces' });
  }
});

// 3. POST /api/annonces (Création)
router.post('/', authMiddleware, upload.single('image'), validateAnnonce, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { titre, description } = req.body;
    const userId = req.user.id;
    let imagePath = 'default-annonce.jpg';

    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      const { data, error } = await supabase.storage
        .from('annonces-images')
        .upload(fileName, req.file.buffer, { contentType: req.file.mimetype });
      if (error) throw error;
      imagePath = data.path;
    }

    const query = 'INSERT INTO annonces (titre, description, image, user_id) VALUES ($1, $2, $3, $4) RETURNING *';
    const result = await pool.query(query, [titre, description, imagePath, userId]);
    res.status(201).json({ 
      message: 'Annonce créée', 
      annonce: { ...result.rows[0], image: toImageUrl(result.rows[0].image) } 
    });
  } catch (err) {
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

// 4. GET /api/annonces/:id (Détail)
router.get('/:id', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query('SELECT * FROM annonces WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Annonce non trouvée' });
    res.json({ annonce: { ...result.rows[0], image: toImageUrl(result.rows[0].image) } });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// 5. PUT & DELETE (Identiques à ton code précédent)
router.put('/:id', authMiddleware, validateAnnonce, async (req, res) => {
  /* ... ton code de mise à jour ... */
});

router.delete('/:id', authMiddleware, async (req, res) => {
  /* ... ton code de suppression ... */
});

module.exports = router;