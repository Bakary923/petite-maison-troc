# Image Node légère
FROM node:18-alpine

WORKDIR /app

# Installation des dépendances (production uniquement)
COPY package*.json ./
RUN npm install --only=production

# Copie du code source
COPY . .

# Création d’un utilisateur non-root compatible OpenShift (UID 1001)
RUN adduser -D -u 1001 appuser

# Préparation du dossier uploads AVANT de changer d’utilisateur
# Très important : OpenShift utilise un UID aléatoire → il doit avoir les droits
RUN mkdir -p uploads && chown -R 1001:1001 /app

# Exécution en utilisateur non-root
USER 1001

# Port de l’API
EXPOSE 3000

CMD ["node", "src/app.js"]
