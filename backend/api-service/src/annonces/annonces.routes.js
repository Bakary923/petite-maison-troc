const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();

// upload directory (crée si nécessaire)
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
  }
});
const upload = multer({ storage });

// stockage temporaire en mémoire (fallback)
const store = [];

// Helper : construire URL complète d'image
function toImageUrl(req, imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${req.protocol}://${req.get('host')}${imagePath}`;
}

// GET /api/annonces -> liste toutes les annonces (DB si configurée)
router.get('/', async (req, res) => {
  console.log('[DEBUG GET] req.user:', req.user); // DEBUG
  try {
    const pool = req.app.locals.pool;
    if (pool) {
      // Ajuste la requête si ton schéma diffère (noms de table/colonnes)
      const q = `
        SELECT a.id, a.titre, a.description, a.image, a.created_at, u.username
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
        createdAt: r.created_at
      }));
      return res.json({ annonces });
    }
    // fallback mémoire
    return res.json({ annonces: store });
  } catch (err) {
    console.error('GET /api/annonces error', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

// POST /api/annonces -> crée une annonce (JSON ou multipart/form-data 'image')
router.post('/', upload.single('image'), async (req, res) => {
  console.log('[DEBUG POST] req.user:', req.user); // DEBUG - LIGNE AJOUTÉE
  try {
    const body = req.body || {};
    const titre = (body.titre || '').trim();
    const description = (body.description || '').trim();

    if (!titre || !description) {
      return res.status(400).json({ error: 'titre et description requis' });
    }

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const pool = req.app.locals.pool;

    let created;

    if (pool) {
      // insère en base (ajuste noms de colonnes si nécessaire)
      const userId = req.user?.id || null;
      console.log('[DEBUG POST] userId extrait:', userId); // DEBUG
      console.log('[DEBUG POST] username extrait:', req.user?.username); // DEBUG
      
      const insertQ = `
        INSERT INTO annonces (titre, description, image, user_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id, titre, description, image, created_at
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
        createdAt: row.created_at
      };
      console.log('[DEBUG POST] Annonce créée:', created); // DEBUG
    } else {
      // fallback mémoire
      created = {
        id: store.length ? (store[0].id || Date.now()) + 1 : Date.now(),
        titre,
        description,
        image: toImageUrl(req, imagePath),
        username: req.user?.username || 'inconnu',
        createdAt: new Date().toISOString()
      };
      store.unshift(created);
    }

    // renvoyer l'objet créé (frontend l'ajoutera immédiatement)
    return res.status(201).json({ annonce: created });
  } catch (err) {
    console.error('POST /api/annonces error', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

module.exports = router;
