const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth'); //Middleware d'authentification JWT

// Route protégée : création d'une annonce pour un utilisateur authentifié.
router.post('/', auth, async (req, res) => {
  const { titre, description } = req.body;
  const userId = req.user.id;
  if (!titre) {
    return res.status(400).json({ error: 'Titre obligatoire' });
  }
  try {
    await req.app.locals.pool.query(
      'INSERT INTO annonces (user_id, titre, description) VALUES ($1, $2, $3)',
      [userId, titre, description]
    );
    res.status(201).json({ message: 'Annonce créée !' });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route GET : liste toutes les annonces de la table, accessibles à tous
router.get('/', async (req, res) => {
  try {
    const result = await req.app.locals.pool.query(
      'SELECT annonces.*, users.username FROM annonces JOIN users ON annonces.user_id = users.id ORDER BY annonces.created_at DESC'
    );
    res.json({ annonces: result.rows });
  } catch (err) {
    res.status(500).json({ error: 'Erreur serveur.' });
  }
});

// GET /api/annonces/mes : annonces créées par l'utilisateur connecté
router.get('/mes', auth, async (req, res) => {
  console.log("req.user =", req.user);
  try {
    const userId = req.user.id;
    const result = await req.app.locals.pool.query(
      'SELECT * FROM annonces WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json({ annonces: result.rows });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/annonces/:id : affiche le détail d'une annonce précise (publique)
router.get('/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: "ID invalide" });
  }
  try {
    const result = await req.app.locals.pool.query(
      'SELECT annonces.*, users.username FROM annonces JOIN users ON annonces.user_id = users.id WHERE annonces.id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Annonce non trouvée" });
    }
    res.json({ annonce: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: "Erreur serveur" });
  }
});


module.exports = router;
