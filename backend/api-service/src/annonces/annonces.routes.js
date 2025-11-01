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

module.exports = router;
