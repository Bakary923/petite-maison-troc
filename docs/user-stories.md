# User Stories - MVP

## Fonctionnalités Obligatoires

### US-01 : Inscription
**En tant que** visiteur  
**Je veux** créer un compte  
**Afin de** publier des annonces

**Critères :**
- Formulaire : username, email, password
- Password hashé (bcrypt)
- Rôle par défaut : "user"

---

### US-02 : Connexion
**En tant que** utilisateur  
**Je veux** me connecter  
**Afin d'** accéder aux fonctionnalités

**Critères :**
- Login avec email + password
- Génération token JWT (24h)
- Stockage token côté client

---

### US-03 : Créer une annonce
**En tant que** utilisateur connecté  
**Je veux** publier une annonce  
**Afin de** proposer un objet en troc/don

**Critères :**
- Formulaire : titre, description, catégorie, type (troc/don)
- Statut initial : "pending"
- Sauvegarde en base avec user_id

---

### US-04 : Lister les annonces
**En tant que** visiteur  
**Je veux** voir toutes les annonces validées  
**Afin de** trouver des objets

**Critères :**
- Affichage annonces statut "approved"
- Filtrage par catégorie
- Pagination

---

## Fonctionnalités Bonus

### US-05 : Modérer (role admin)
**En tant que** modérateur  
**Je veux** approuver/rejeter les annonces  
**Afin de** contrôler le contenu

**Critères :**
- Liste annonces "pending"
- Boutons Approuver / Rejeter
- Log dans moderation_logs
