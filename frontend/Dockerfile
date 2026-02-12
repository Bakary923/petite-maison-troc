# -----------------------------------------------------------------------------
# 🏗️ ÉTAPE 1 — Build du frontend React
# -----------------------------------------------------------------------------
FROM node:20-alpine AS build

# Dossier de travail
WORKDIR /app

# Copie des fichiers de dépendances
COPY package*.json ./

# Installation déterministe des dépendances
RUN npm install

# Copie du reste du code source
COPY . .

# Build de l’application React (génère le dossier /build)
RUN npm run build


# -----------------------------------------------------------------------------
# 🚀 ÉTAPE 2 — Serveur Nginx pour servir le build
# -----------------------------------------------------------------------------
FROM nginx:alpine

# Copie de la configuration Nginx personnalisée
# (port 8080, redirections, cache, gzip, etc.)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie du build React dans le dossier public de Nginx
COPY --from=build /app/build /usr/share/nginx/html

# -----------------------------------------------------------------------------
# 🔐 SÉCURITÉ OPENSHIFT
# Nginx tourne en utilisateur non-root (UID 1001)
# -----------------------------------------------------------------------------
USER 1001

# Port exposé (cohérent avec Helm et OpenShift)
EXPOSE 8080

# Commande de démarrage Nginx
CMD ["nginx", "-g", "daemon off;"]
