# -----------------------------------------------------------------------------
# 🏗️ ÉTAPE 1 — Installation des dépendances (sans devDependencies)
# Multi‑stage build : permet d’avoir une image finale plus légère et plus sûre
# -----------------------------------------------------------------------------
FROM node:20-alpine AS deps

# Dossier de travail interne au conteneur
WORKDIR /app

# Copie uniquement des fichiers de dépendances
# → Permet de tirer parti du cache Docker
COPY package*.json ./

# Installation des dépendances de production uniquement
# npm ci = installation déterministe, plus rapide et plus fiable
RUN npm install --omit=dev


# -----------------------------------------------------------------------------
# 🚀 ÉTAPE 2 — Image finale d’exécution
# -----------------------------------------------------------------------------
FROM node:20-alpine

# Dossier de travail
WORKDIR /app

# Copie des node_modules installés dans l’étape précédente
COPY --from=deps /app/node_modules ./node_modules

# Copie du code source de l’application
COPY . .

# -----------------------------------------------------------------------------
# 🔐 SÉCURITÉ OPENSHIFT
# OpenShift impose l’exécution en utilisateur non-root.
# On crée un utilisateur dédié avec UID 1001.
# -----------------------------------------------------------------------------
RUN adduser -D -u 1001 appuser

# On passe en utilisateur non-root
USER 1001

# Port exposé par l’API (cohérent avec app.js et Helm)
EXPOSE 3000

# Commande de démarrage
CMD ["node", "src/app.js"]
