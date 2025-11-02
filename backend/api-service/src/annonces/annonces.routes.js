const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const router = express.Router();

// Configuration du dossier d'upload des images
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Configuration multer pour gérer l'upload des fichiers images
const storage = multer.diskStorage({
  // Dossier de destination des fichiers
  destination: (req, file, cb) => cb(null, uploadDir),
  // Génère un nom de fichier unique basé sur le timestamp
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2,8)}${ext}`);
  }
});
const upload = multer({ storage });

// Stockage temporaire en mémoire (utilisé si pas de base de données)
const store = [];

// Fonction helper pour construire une URL complète pour les images
function toImageUrl(req, imagePath) {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  // Retourne une URL complète : http://localhost:3000/uploads/...
  return `${req.protocol}://${req.get('host')}${imagePath}`;
}

// ============================================================================
// GET /api/annonces -> Récupère la liste de toutes les annonces
// ============================================================================
router.get('/', async (req, res) => {
  console.log('[DEBUG GET] req.user:', req.user); // DEBUG
  try {
    const pool = req.app.locals.pool;
    if (pool) {
      // Récupère les annonces depuis la base de données avec join sur la table users
      const q = `
        SELECT a.id, a.titre, a.description, a.image, a.created_at, a.updated_at, u.username
        FROM annonces a
        LEFT JOIN users u ON a.user_id = u.id
        ORDER BY a.created_at DESC
      `;
      const result = await pool.query(q);
      
      // Transforme les résultats en objet JSON lisible
      const annonces = result.rows.map(r => ({
        id: r.id,
        titre: r.titre,
        description: r.description,
        image: toImageUrl(req, r.image),
        username: r.username,
        createdAt: r.created_at,
        updatedAt: r.updated_at  // Date de modification
      }));
      return res.json({ annonces });
    }
    // Fallback : retourne les annonces en mémoire si pas de BDD
    return res.json({ annonces: store });
  } catch (err) {
    console.error('GET /api/annonces error', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

// ============================================================================
// POST /api/annonces -> Crée une nouvelle annonce
// ============================================================================
router.post('/', upload.single('image'), async (req, res) => {
  console.log('[DEBUG POST] req.user:', req.user); // DEBUG
  try {
    // Récupère les données du formulaire
    const body = req.body || {};
    const titre = (body.titre || '').trim();
    const description = (body.description || '').trim();

    // Vérifie que les champs obligatoires sont présents
    if (!titre || !description) {
      return res.status(400).json({ error: 'titre et description requis' });
    }

    // Récupère le chemin du fichier image s'il a été uploadé
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;
    const pool = req.app.locals.pool;

    let created;

    if (pool) {
      // Insère l'annonce dans la base de données
      const userId = req.user?.id || null;
      console.log('[DEBUG POST] userId extrait:', userId); // DEBUG
      console.log('[DEBUG POST] username extrait:', req.user?.username); // DEBUG
      
      // Requête SQL avec NOW() AT TIME ZONE 'Europe/Paris' pour avoir l'heure correcte en CET
      const insertQ = `
        INSERT INTO annonces (titre, description, image, user_id, created_at)
        VALUES ($1, $2, $3, $4, NOW() AT TIME ZONE 'Europe/Paris')
        RETURNING id, titre, description, image, created_at, updated_at
      `;
      const values = [titre, description, imagePath, userId];
      const result = await pool.query(insertQ, values);
      const row = result.rows[0];
      
      // Construit l'objet annonce à retourner
      created = {
        id: row.id,
        titre: row.titre,
        description: row.description,
        image: toImageUrl(req, row.image),
        username: req.user?.username || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      };
      console.log('[DEBUG POST] Annonce créée:', created); // DEBUG
    } else {
      // Fallback : stockage en mémoire
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

    // Retourne l'annonce créée
    return res.status(201).json({ annonce: created });
  } catch (err) {
    console.error('POST /api/annonces error', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

// ============================================================================
// PUT /api/annonces/:id -> Modifie une annonce (uniquement par l'auteur)
// ============================================================================
router.put('/:id', upload.single('image'), async (req, res) => {
  console.log('[DEBUG PUT] req.user:', req.user); // DEBUG
  try {
    // Récupère l'ID de l'annonce depuis l'URL
    const annonceId = req.params.id;
    
    // Récupère l'ID de l'utilisateur connecté (du JWT)
    const userId = req.user?.id;
    
    // Récupère les données modifiées du formulaire
    const body = req.body || {};
    const titre = (body.titre || '').trim();
    const description = (body.description || '').trim();
    
    // Vérifie que les champs obligatoires sont présents
    if (!titre || !description) {
      return res.status(400).json({ error: 'titre et description requis' });
    }

    const pool = req.app.locals.pool;

    if (!pool) {
      // Fallback : modification en mémoire
      const annonce = store.find(a => a.id === parseInt(annonceId));
      if (!annonce) {
        return res.status(404).json({ error: 'Annonce non trouvée' });
      }
      // Vérifie que c'est bien l'auteur
      if (annonce.username !== req.user?.username) {
        return res.status(403).json({ error: 'Non autorisé' });
      }
      // Modifie l'annonce
      annonce.titre = titre;
      annonce.description = description;
      annonce.updatedAt = new Date().toISOString();
      return res.json({ annonce });
    }

    // Vérifie que l'annonce existe
    const checkQ = 'SELECT user_id FROM annonces WHERE id = $1';
    const checkResult = await pool.query(checkQ, [annonceId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    // Vérifie que l'utilisateur connecté est l'auteur
    const annonce = checkResult.rows[0];
    if (annonce.user_id !== userId) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à modifier cette annonce' });
    }

    // Prépare la requête UPDATE selon si une nouvelle image est uploadée ou pas
    let updateQ;
    let values;
    
    if (req.file) {
      // Si une nouvelle image est uploadée, remplace l'ancienne
      const imagePath = `/uploads/${req.file.filename}`;
      updateQ = `
        UPDATE annonces 
        SET titre = $1, description = $2, image = $3, updated_at = NOW() AT TIME ZONE 'Europe/Paris'
        WHERE id = $4
        RETURNING id, titre, description, image, created_at, updated_at
      `;
      values = [titre, description, imagePath, annonceId];
    } else {
      // Pas de nouvelle image, garde l'ancienne
      updateQ = `
        UPDATE annonces 
        SET titre = $1, description = $2, updated_at = NOW() AT TIME ZONE 'Europe/Paris'
        WHERE id = $3
        RETURNING id, titre, description, image, created_at, updated_at
      `;
      values = [titre, description, annonceId];
    }

    // Exécute la mise à jour
    const result = await pool.query(updateQ, values);
    const row = result.rows[0];
    
    // Construit l'objet annonce modifiée à retourner
    const updated = {
      id: row.id,
      titre: row.titre,
      description: row.description,
      image: toImageUrl(req, row.image),
      username: req.user?.username,
      createdAt: row.created_at,
      updatedAt: row.updated_at  // Date de modification mise à jour
    };

    console.log('[DEBUG PUT] Annonce modifiée:', updated); // DEBUG
    return res.json({ annonce: updated });
  } catch (err) {
    console.error('PUT /api/annonces error', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

// ============================================================================
// DELETE /api/annonces/:id -> Supprime une annonce (uniquement par l'auteur)
// ============================================================================
router.delete('/:id', async (req, res) => {
  console.log('[DEBUG DELETE] req.user:', req.user); // DEBUG
  try {
    // Récupère l'ID de l'annonce depuis l'URL
    const annonceId = req.params.id;
    
    // Récupère l'ID de l'utilisateur connecté (du JWT)
    const userId = req.user?.id;
    
    // Récupère le pool de connexion à la base de données
    const pool = req.app.locals.pool;

    if (!pool) {
      // Fallback : suppression en mémoire
      const index = store.findIndex(a => a.id === parseInt(annonceId));
      if (index === -1) {
        return res.status(404).json({ error: 'Annonce non trouvée' });
      }
      store.splice(index, 1);
      return res.json({ message: 'Annonce supprimée' });
    }

    // Récupère l'annonce pour vérifier que l'utilisateur en est l'auteur
    const checkQ = 'SELECT user_id FROM annonces WHERE id = $1';
    const checkResult = await pool.query(checkQ, [annonceId]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Annonce non trouvée' });
    }

    const annonce = checkResult.rows[0];
    
    // Vérifie que l'utilisateur connecté est bien l'auteur
    if (annonce.user_id !== userId) {
      return res.status(403).json({ error: 'Vous n\'êtes pas autorisé à supprimer cette annonce' });
    }

    // Supprime l'annonce de la base de données
    const deleteQ = 'DELETE FROM annonces WHERE id = $1';
    await pool.query(deleteQ, [annonceId]);

    console.log(`[DEBUG DELETE] Annonce ${annonceId} supprimée par user ${userId}`); // DEBUG
    
    return res.json({ message: 'Annonce supprimée avec succès' });
  } catch (err) {
    console.error('DELETE /api/annonces error', err);
    return res.status(500).json({ error: 'Erreur interne' });
  }
});

// Exporte le routeur
module.exports = router;
