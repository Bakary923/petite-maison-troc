const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();

// Import du middleware d'authentification
const authMiddleware = require('../middlewares/auth');

// On importe express-validator pour vérifier les données envoyées à l'API
const { body, validationResult } = require('express-validator');

// Middleware de validation pour la création d'annonce
// - vérifie que le titre est présent et de longueur raisonnable
// - vérifie que la description est présente et assez détaillée
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
      // Si la validation échoue, on renvoie une erreur 400 avec la liste des problèmes
      return res.status(400).json({ errors: errors.array() });
    }
    // Si tout est bon, on passe à la suite (upload + logique métier)
    next();
  }
];

// ============================================================================
// Configuration MULTER pour l'upload d'images
// ============================================================================

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
  }
});
const upload = multer({ storage });

// Stockage temporaire en mémoire (fallback si pas de DB)
const store = [];

// Helper : construire URL complète d'image
function toImageUrl(req, imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${req.protocol}://${req.get('host')}${imagePath}`;
}

// ============================================================================
// GET /api/annonces -> Récupère la liste de toutes les annonces (PUBLIC)
// ============================================================================
router.get('/', async (req, res) => {
  console.log('[DEBUG GET] Récupération des annonces (publique)');
  try {
    const pool = req.app.locals.pool;
    if (pool) {
      const q = `
        SELECT a.id, a.titre, a.description, a.image, a.created_at, a.updated_at, u.username
        FROM annonces a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
      `;
      const result = await pool.query(q);
      const annonces = result.rows.map(r => ({
        id: r.id,
        titre: r.titre,
        description: r.description,
        image: toImageUrl(req, r.image),
        username: r.username,
        createdAt: r.created_at,
        updatedAt: r.updated_at
      }));
      return res.json({ annonces });
    }
    return res.json({ annonces: store });
  } catch (err) {
    console.error('GET /api/annonces error', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

// ============================================================================
// POST /api/annonces -> Crée une annonce (PROTÉGÉ - besoin du JWT)
// ============================================================================
router.post(
  '/',
  authMiddleware,                 // 1) Vérifie le JWT
  upload.single('image'),         // 2) Gère l’upload d’image
  validateAnnonce,                // 3) Vérifie titre + description
  async (req, res) => {           // 4) Logique métier si tout est OK
    console.log('[DEBUG POST] req.user:', req.user);
    try {
      const body = req.body || {};
      const titre = (body.titre || '').trim();
      const description = (body.description || '').trim();

      // plus besoin du if !titre/!description ici, c'est géré par validateAnnonce

      const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
      const pool = req.app.locals.pool;

      let created;

      if (pool) {
        const userId = req.user?.id || null;
        console.log('[DEBUG POST] userId extrait:', userId);
        console.log('[DEBUG POST] username extrait:', req.user?.username);
        
        const insertQ = `
          INSERT INTO annonces (titre, description, image, user_id, created_at)
          VALUES ($1, $2, $3, $4, NOW() AT TIME ZONE 'Europe/Paris')
          RETURNING id, titre, description, image, created_at, updated_at
        `;
        const values = [titre, description, imagePath, userId];
        const result = await pool.query(insertQ, values);
        const row = result.rows[0];
        
        created = {
          id: row.id,
          titre: row.titre,
          description: row.description,
          image: toImageUrl(req, row.image),
          username: req.user?.username || null,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        };
        console.log('[DEBUG POST] Annonce créée:', created);
      } else {
        const now = new Date().toISOString();
        created = {
          id: store.length ? (store[0].id || Date.now()) + 1 : Date.now(),
          titre,
          description,
          image: toImageUrl(req, imagePath),
          username: req.user?.username || 'inconnu',
          createdAt: now,
          updatedAt: now
        };
        store.unshift(created);
      }

      return res.status(201).json({ annonce: created });
    } catch (err) {
      console.error('POST /api/annonces error', err);
      return res.status(500).json({ error: 'Erreur interne' });
    }
  }
);


// ============================================================================
// PUT /api/annonces/:id -> Modifie une annonce (PROTÉGÉ - besoin du JWT)
// ============================================================================
router.put(
  '/:id',
  authMiddleware,          // vérifie le JWT
  upload.single('image'),  // gère l'upload d'image
  validateAnnonce,         // vérifie titre + description (présents, longueurs)
  async (req, res) => {
    console.log('[DEBUG PUT] req.user:', req.user);
    try {
      const annonceId = req.params.id;
      const userId = req.user?.id;
      const body = req.body || {};
      const titre = (body.titre || '').trim();
      const description = (body.description || '').trim();

      // plus besoin du if (!titre || !description) ici : géré par validateAnnonce

      const pool = req.app.locals.pool;

      if (!pool) {
        const annonce = store.find(a => a.id === parseInt(annonceId));
        if (!annonce) {
          return res.status(404).json({ error: 'Annonce non trouvée' });
        }
        if (annonce.username !== req.user?.username) {
          return res.status(403).json({ error: 'Non autorisé' });
        }
        annonce.titre = titre;
        annonce.description = description;
        annonce.updatedAt = new Date().toISOString();
        return res.json({ annonce });
      }

      const checkQ = 'SELECT user_id FROM annonces WHERE id = $1';
      const checkResult = await pool.query(checkQ, [annonceId]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: 'Annonce non trouvée' });
      }

      const annonce = checkResult.rows[0];
      if (annonce.user_id !== userId) {
        return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à modifier cette annonce' });
      }

      let updateQ;
      let values;

      if (req.file) {
        const imagePath = `/uploads/${req.file.filename}`;
        updateQ = `
          UPDATE annonces 
          SET titre = $1, description = $2, image = $3, updated_at = NOW() AT TIME ZONE 'Europe/Paris'
          WHERE id = $4
          RETURNING id, titre, description, image, created_at, updated_at
        `;
        values = [titre, description, imagePath, annonceId];
      } else {
        updateQ = `
          UPDATE annonces 
          SET titre = $1, description = $2, updated_at = NOW() AT TIME ZONE 'Europe/Paris'
          WHERE id = $3
          RETURNING id, titre, description, image, created_at, updated_at
        `;
        values = [titre, description, annonceId];
      }

      const result = await pool.query(updateQ, values);
      const row = result.rows[0];

      const updated = {
        id: row.id,
        titre: row.titre,
        description: row.description,
        image: toImageUrl(req, row.image),
        username: req.user?.username,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };

      console.log('[DEBUG PUT] Annonce modifiée:', updated);
      return res.json({ annonce: updated });
    } catch (err) {
      console.error('PUT /api/annonces error', err);
      return res.status(500).json({ error: 'Erreur interne' });
    }
  }
);

// ============================================================================
// DELETE /api/annonces/:id -> Supprime une annonce (PROTÉGÉ - besoin du JWT)
// ============================================================================
router.delete('/:id', authMiddleware, async (req, res) => {
  console.log('[DEBUG DELETE] req.user:', req.user);
  try {
    const annonceId = req.params.id;
    const userId = req.user?.id;
    const pool = req.app.locals.pool;

    if (!pool) {
      const index = store.findIndex(a => a.id === parseInt(annonceId));
      if (index === -1) {
        return res.status(404).json({ error: 'Annonce non trouvée' });
      }
      store.splice(index, 1);
      return res.json({ message: 'Annonce supprimée' });
    }

    const checkQ = 'SELECT user_id FROM annonces WHERE id = $1';
    const checkResult = await pool.query(checkQ, [annonceId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    const annonce = checkResult.rows[0];
    
    if (annonce.user_id !== userId) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à supprimer cette annonce' });
    }

    const deleteQ = 'DELETE FROM annonces WHERE id = $1';
    await pool.query(deleteQ, [annonceId]);

    console.log(`[DEBUG DELETE] Annonce ${annonceId} supprimée par user ${userId}`);
    
    return res.json({ message: 'Annonce supprimée avec succès' });
  } catch (err) {
    console.error('DELETE /api/annonces error', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

module.exports = router;
