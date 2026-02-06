# --- ÉTAPE 1 : Build React ---
FROM node:18-alpine AS build-stage

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build


# --- ÉTAPE 2 : Serveur Nginx ---
FROM nginx:stable-alpine

# Copie de la configuration Nginx personnalisée (port 8080)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copie du build React
COPY --from=build-stage /app/build /usr/share/nginx/html

# OpenShift lancera automatiquement un UID non-root
USER 1001

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
