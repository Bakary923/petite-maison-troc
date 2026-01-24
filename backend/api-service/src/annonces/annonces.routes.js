const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();

// Import du middleware d'authentification
const authMiddleware = require('../middlewares/auth');

// On importe express-validator pour vérifier les données envoyées à l'API
const { body, validationResult } = require('express-validator');

// Middleware de validation pour la création d'annonce (Qualité ISO 25010)
const validateAnnonce = [
  body('titre')
    .trim()
    .notEmpty().withMessage('Le titre est requis')
    .isLength({ min: 3, max: 100 }).withMessage('Le titre doit faire entre 3 et 100 caractères'),
  body('description')
    .trim()
    .notEmpty().withMessage('La description est requise')
    .isLength({ min: 10, max: 2000 }).withMessage('La description doit faire entre 10 et 2000 caractères'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// ============================================================================
// Configuration MULTER Sécurisée (Solution de sécurité minimale)
// ============================================================================
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '';
    // Nom de fichier aléatoire pour éviter l'écrasement et l'énumération
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // Limite à 5 Mo (Protection contre DoS)
  },
  fileFilter: (req, file, cb) => {
    // Vérification du type MIME (Empêche l'upload de fichiers malveillants)
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Format non supporté. Seuls JPG, PNG et WEBP sont acceptés.'), false);
    }
  }
});

// Middleware pour capturer les erreurs d'upload proprement
const handleMulterError = (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Image trop lourde (max 5Mo)' });
      }
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    next();
  });
};

// Stockage temporaire (fallback si pas de DB)
const store = [];

// Helper : construire URL complète d'image
function toImageUrl(req, imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${req.protocol}://${req.get('host')}${imagePath}`;
}

// ============================================================================
// ROUTES
// ============================================================================

// GET /api/annonces -> Récupère les annonces VALIDÉES (Public)
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    if (pool) {
      const q = `
        SELECT a.id, a.titre, a.description, a.image, a.status, a.created_at, a.updated_at, u.username
        FROM annonces a
        LEFT JOIN users u ON a.user_id = u.id
        WHERE a.status = 'validated'
        ORDER BY a.created_at DESC
      `;
      const result = await pool.query(q);
      const annonces = result.rows.map(r => ({
        ...r,
        image: toImageUrl(req, r.image),
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
      return res.json({ annonces });
    }
    return res.json({ annonces: store.filter(a => a.status === 'validated') });
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' });
  }
});

// GET /api/annonces/me -> Mes annonces (Protégé)
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const userId = req.user?.id;
    if (!pool || !userId) return res.status(400).json({ error: 'Inaccessible' });

    const q = `SELECT * FROM annonces WHERE user_id = $1 ORDER BY created_at DESC`;
    const result = await pool.query(q, [userId]);
    const annonces = result.rows.map(r => ({
      ...r,
      image: toImageUrl(req, r.image)
    }));
    return res.json({ annonces });
  } catch (err) {
    res.status(500).json({ error: 'Erreur interne' });
  }
});

// POST /api/annonces -> Création (Protégé + Upload Sécurisé)
router.post(
  '/',
  authMiddleware,
  handleMulterError, // Gestion sécurisée de l'upload
  validateAnnonce,   // Validation du contenu texte
  async (req, res) => {
    try {
      const { titre, description } = req.body;
      const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
      const pool = req.app.locals.pool;
      const userId = req.user?.id;

      if (pool) {
        const insertQ = `
          INSERT INTO annonces (titre, description, image, user_id, status, created_at)
          VALUES ($1, $2, $3, $4, 'pending', NOW())
          RETURNING *
        `;
        const result = await pool.query(insertQ, [titre, description, imagePath, userId]);
        const created = { ...result.rows[0], image: toImageUrl(req, result.rows[0].image) };
        return res.status(201).json({ annonce: created });
      }
      return res.status(500).json({ error: 'DB non connectée' });
    } catch (err) {
      res.status(500).json({ error: 'Erreur création' });
    }
  }
);

// DELETE /api/annonces/:id -> Suppression (Propriétaire uniquement)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { id } = req.params;
    const userId = req.user?.id;

    const checkQ = 'SELECT user_id FROM annonces WHERE id = $1';
    const check = await pool.query(checkQ, [id]);

    if (check.rows.length === 0) return res.status(404).json({ error: 'Annonce non trouvée' });
    if (check.rows[0].user_id !== userId) return res.status(403).json({ error: 'Non autorisé' });

    await pool.query('DELETE FROM annonces WHERE id = $1', [id]);
    res.json({ message: 'Annonce supprimée' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur suppression' });
  }
});

module.exports = router;