# Image Node légère pour optimiser le temps de build et la sécurité
FROM node:18-alpine

# Définition du dossier de travail
WORKDIR /app

# Installation des dépendances (production uniquement pour réduire la taille de l'image)
COPY package*.json ./
RUN npm install --only=production

# Copie du code source dans le conteneur
COPY . .

# ✅ SÉCURITÉ OPENSHIFT : Création d'un utilisateur non-root (UID 1001)
# OpenShift interdit l'exécution en tant que 'root' par sécurité.
RUN adduser -D -u 1001 appuser

# 📁 SUPPRESSION DE LA LOGIQUE UPLOADS LOCALE
# Nous ne créons plus de dossier 'uploads' ici car l'application est Stateless.
# Les images transitent par la RAM (Multer memoryStorage) vers le Cloud.

# Changement de propriétaire pour tout le dossier app
RUN chown -R 1001:1001 /app

# Exécution en utilisateur non-root pour respecter le principe du moindre privilège
USER 1001

# Port d’écoute de l’API (cohérent avec values.yaml et deployment.yaml)
EXPOSE 3000

# Commande de démarrage
CMD ["node", "src/app.js"]