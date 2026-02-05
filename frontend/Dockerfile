# --- ÉTAPE 1 : Build React ---
# On compile le frontend dans une image Node légère
FROM node:18-alpine AS build-stage

WORKDIR /app

# Installation des dépendances
COPY package*.json ./
RUN npm install

# Copie du code et build
COPY . .
RUN npm run build


# --- ÉTAPE 2 : Serveur Nginx sécurisé ---
# L’image nginx:stable-alpine tourne en root → interdit sur OpenShift Sandbox
FROM nginx:stable-alpine

# Création d’un utilisateur non-root compatible OpenShift (UID 1001)
# OpenShift injecte un UID aléatoire, mais il doit être autorisé à écrire dans les dossiers
RUN adduser -D -u 1001 appuser

# Donner les droits nécessaires aux dossiers utilisés par Nginx
# Sans ça : "permission denied" → CrashLoopBackOff
RUN chown -R 1001:1001 /var/cache/nginx /var/run /usr/share/nginx/html

# Copie de la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie du build React dans le dossier public de Nginx
COPY --from=build-stage /app/build /usr/share/nginx/html

# Exécution en utilisateur non-root
USER 1001

# OpenShift interdit les ports < 1024 → on expose 8080
EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
