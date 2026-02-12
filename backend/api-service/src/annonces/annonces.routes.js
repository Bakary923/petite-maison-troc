const express = require('express');
const path = require('path');
const fs = require('fs'); // Gardé au cas où, mais plus utilisé pour l'écriture
const multer = require('multer');
const router = express.Router();

// Import du client Supabase configuré précédemment
const supabase = require('../config/supabase');

// Import du middleware d'authentification pour sécuriser les routes privées
const authMiddleware = require('../middlewares/auth');

// On importe express-validator pour vérifier les données envoyées à l'API
const { body, validationResult } = require('express-validator');

// ============================================================================
// MIDDLEWARES DE VALIDATION (Qualité ISO 25010 : Fiabilité des données)
// ============================================================================
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
// CONFIGURATION MULTER (Adaptée pour le Stateless / HPA)
// On utilise memoryStorage pour ne pas dépendre d'un volume local (PVC RWO)
// ============================================================================
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // Limite à 5 Mo
});

// Helper pour générer l'URL de l'image (désormais depuis Supabase)
const toImageUrl = (path) => {
  if (!path || path === 'default-annonce.jpg') return 'default-annonce.jpg';
  const { data } = supabase.storage.from('annonces-images').getPublicUrl(path);
  return data.publicUrl;
};

// ============================================================================
// ROUTES
// ============================================================================

// GET /api/annonces (Public)
router.get('/', async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const result = await pool.query("SELECT * FROM annonces WHERE status = 'validated' ORDER BY created_at DESC");
    
    // On adapte les chemins d'images pour le frontend
    const annonces = result.rows.map(row => ({
      ...row,
      image: toImageUrl(row.image)
    }));

    res.json(annonces);
  } catch (err) {
    console.error('[GET ERROR]', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// POST /api/annonces (Privé)
router.post('/', authMiddleware, upload.single('image'), validateAnnonce, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { titre, description } = req.body;
    const userId = req.user.id;
    let imagePath = 'default-annonce.jpg';

    // ✅ LOGIQUE SDK SUPABASE (Remplace le stockage local fs)
    if (req.file) {
      const fileName = `${Date.now()}-${req.file.originalname}`;
      
      const { data, error } = await supabase.storage
        .from('annonces-images')
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: false
        });

      if (error) throw error;
      imagePath = data.path; // Stockage du chemin relatif dans la BDD
    }

    const query = 'INSERT INTO annonces (titre, description, image, user_id) VALUES ($1, $2, $3, $4) RETURNING *';
    const result = await pool.query(query, [titre, description, imagePath, userId]);

    res.status(201).json({ 
      message: 'Annonce créée avec succès', 
      annonce: { ...result.rows[0], image: toImageUrl(result.rows[0].image) } 
    });
  } catch (err) {
    console.error('[POST ERROR]', err);
    res.status(500).json({ error: 'Erreur lors de la création' });
  }
});

// PUT /api/annonces/:id (Privé)
router.put('/:id', authMiddleware, validateAnnonce, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { id } = req.params;
    const { titre, description } = req.body;
    const userId = req.user.id;

    const checkQ = 'SELECT user_id FROM annonces WHERE id = $1';
    const check = await pool.query(checkQ, [id]);

    if (check.rows.length === 0) return res.status(404).json({ error: 'Annonce non trouvée' });
    if (check.rows[0].user_id !== userId) return res.status(403).json({ error: 'Non autorisé' });

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
    console.error('[UPDATE ERROR]', err);
    res.status(500).json({ error: 'Erreur lors de la mise à jour' });
  }
});

// DELETE /api/annonces/:id (Privé)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const pool = req.app.locals.pool;
    const { id } = req.params;
    const userId = req.user?.id;

    const checkQ = 'SELECT user_id, image FROM annonces WHERE id = $1';
    const check = await pool.query(checkQ, [id]);

    if (check.rows.length === 0) return res.status(404).json({ error: 'Annonce non trouvée' });
    if (check.rows[0].user_id !== userId) return res.status(403).json({ error: 'Non autorisé' });

    // ✅ LOGIQUE SUPABASE : On supprime aussi le fichier du bucket
    const oldImagePath = check.rows[0].image;
    if (oldImagePath && oldImagePath !== 'default-annonce.jpg') {
      await supabase.storage.from('annonces-images').remove([oldImagePath]);
    }

    await pool.query('DELETE FROM annonces WHERE id = $1', [id]);
    res.json({ message: 'Annonce supprimée avec succès' });
  } catch (err) {
    console.error('[DELETE ERROR]', err);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

module.exports = router;