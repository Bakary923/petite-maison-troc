# --- ÉTAPE 1 : Le Build ---
# On utilise Node pour transformer le code React en fichiers HTML/JS statiques
FROM node:18-alpine as build-stage

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install

# Copie du code et compilation
COPY . .
RUN npm run build

# --- ÉTAPE 2 : La Production ---
# On utilise Nginx, beaucoup plus performant que Node pour servir des fichiers
FROM nginx:stable-alpine

# ✅ AJOUT : On copie la configuration personnalisée pour gérer le rafraîchissement (Refresh 404)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# On copie uniquement le résultat du build (dossier /build) dans le dossier public de Nginx
COPY --from=build-stage /app/build /usr/share/nginx/html

# Exposition du port web standard (80 dans le conteneur)
EXPOSE 80

# Lancement de Nginx
CMD ["nginx", "-g", "daemon off;"]